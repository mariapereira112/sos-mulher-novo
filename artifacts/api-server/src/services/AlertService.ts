import { eq } from "drizzle-orm";
import twilio from "twilio";
import { db, emergencyContactsTable, usersTable } from "@workspace/db";
import { AlertModel } from "../models/AlertModel";
import { logger } from "../lib/logger";
import { getApiBaseUrl } from "../lib/url";

// Twilio WhatsApp sandbox — contacts must join: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
const WHATSAPP_FROM = "whatsapp:+14155238886";

// Safety floor only — the real timer comes from the user's profile setting (10/20/30/40/90/300s).
// Never override the user's choice; just prevent zero/negative values from a malformed request.
const MIN_TIMER_SECONDS = 5;

// ── In-memory timer registry ────────────────────────────────────────────────
// Stores Phase 2 + Phase 3 NodeJS.Timeout handles per alertId.
// clearTimers() cancels all pending escalations immediately when alert is resolved.
const activeTimers = new Map<number, NodeJS.Timeout[]>();

// ── In-memory Twilio call SID registry ───────────────────────────────────────
// Stores live Twilio callSids per alertId so they can be terminated on cancel.
const activeCallSids = new Map<number, string[]>();

function addTimer(alertId: number, timer: NodeJS.Timeout) {
  const existing = activeTimers.get(alertId) ?? [];
  activeTimers.set(alertId, [...existing, timer]);
}

function registerCallSid(alertId: number, callSid: string) {
  const existing = activeCallSids.get(alertId) ?? [];
  activeCallSids.set(alertId, [...existing, callSid]);
}

function clearTimers(alertId: number) {
  const timers = activeTimers.get(alertId) ?? [];
  timers.forEach(clearTimeout);
  activeTimers.delete(alertId);
  if (timers.length > 0) {
    logger.info({ alertId, cleared: timers.length }, "Timers cleared — escalation chain stopped");
  }
}

async function cancelActiveCalls(alertId: number) {
  const sids = activeCallSids.get(alertId) ?? [];
  activeCallSids.delete(alertId);
  if (sids.length === 0) return;

  const client = getTwilioClient();
  if (!client) return;

  for (const sid of sids) {
    try {
      await client.calls(sid).update({ status: "completed" });
      logger.info({ alertId, callSid: sid }, "Twilio call terminated on cancel");
    } catch (err) {
      logger.warn({ alertId, callSid: sid, err }, "Could not terminate Twilio call (may have already ended)");
    }
  }
}

function getTwilioClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function buildMapsUrl(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Brazilian mobile numbers can have 12 or 13 digits after the +.
 *   13-digit: +55 XX 9XXXXXXXX  (new format — 9 prefix before 8 digits)
 *   12-digit: +55 XX XXXXXXXX   (old format — 8 digits only)
 *
 * WhatsApp Twilio sandbox records the number EXACTLY as the user sends "join".
 * If the stored format doesn't match the sandbox format, delivery silently fails.
 * This helper returns the ALTERNATE format to retry if the first attempt fails.
 */
/**
 * Normalize a Brazilian phone to E.164.
 * - 10-11 digit local number (no country code) → +55XXXXXXXXXX
 * - Already has +55 → keep as-is
 * - Other international → keep as-is (starts with +)
 */
function normalizeE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return trimmed; // already E.164
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`; // local BR
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  return trimmed.startsWith("+") ? trimmed : `+${digits}`;
}

function brazilPhoneAlternate(phone: string): string | null {
  if (!phone.startsWith("+55")) return null;
  const after55 = phone.slice(3); // everything after +55
  if (after55.length === 11 && after55[2] === "9") {
    // 13 total: +55 + 2 area + "9" + 8 = 13 → strip the leading "9"
    return `+55${after55.slice(0, 2)}${after55.slice(3)}`;
  }
  if (after55.length === 10) {
    // 12 total: +55 + 2 area + 8 → insert "9" after area code
    return `+55${after55.slice(0, 2)}9${after55.slice(2)}`;
  }
  return null;
}

export class AlertService {
  // ── Public: expose clearTimers for use in route handlers ──────────────────
  static clearTimers(alertId: number) {
    clearTimers(alertId);
  }

  /**
   * Phase 1 — Immediate:
   *   Create alert + send WhatsApp (with confirmation link) to all contacts.
   *   Status: pending → sms_sent.
   *   Schedules Phase 2 at (timerDuration - 10s) — fires BEFORE the timer runs out.
   *
   * Phase 2 — 10 seconds before timer ends (min 5s from SOS):
   *   Voice calls to each contact via Twilio (uses <Play> if audio uploaded).
   *   Status: calling_cloud.
   *   Schedules Phase 3 after another timerDuration seconds.
   *
   * Phase 3 — timerDuration seconds after Phase 2 (i.e. well after timer ended):
   *   Calls EMERGENCY_DESTINATION_NUMBER if contact never responded. Status: authorities_notified.
   *   Skipped if alert was resolved by contact in any earlier phase.
   */
  static async createAndEscalate(data: {
    userId: number;
    latitude?: number | null;
    longitude?: number | null;
    timerDuration?: number;
  }) {
    const timerDuration = Math.max(MIN_TIMER_SECONDS, data.timerDuration ?? MIN_TIMER_SECONDS);

    const alert = await AlertModel.create({
      userId: data.userId,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      timerDuration,
      status: "pending",
    });

    const [contacts, userRow] = await Promise.all([
      db.select().from(emergencyContactsTable).where(eq(emergencyContactsTable.userId, data.userId)),
      db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, data.userId)),
    ]);

    const userName = userRow[0]?.name ?? "Uma usuária";
    const mapsUrl = buildMapsUrl(data.latitude, data.longitude);
    const baseUrl = getApiBaseUrl();

    // ── Phase 1: WhatsApp with confirm link (non-blocking) ───────────────────
    AlertService.sendSOSWhatsApp(alert.id, contacts, userName, mapsUrl, baseUrl).catch((err) => {
      logger.error({ err, alertId: alert.id }, "Phase 1 — WhatsApp dispatch error");
    });

    const updatedAlert = await AlertModel.updateStatus(alert.id, "sms_sent");

    // Phase 2 fires 10s before the app timer reaches zero, so the contact receives the
    // voice call while the countdown is still visible — never after it ends.
    // Fire Phase 2 at (timerDuration - 10s), minimum 2s so Twilio has time to ring before the countdown ends.
    const phase2Delay = Math.max(2, timerDuration - 10);

    const receivedAt = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    logger.info(
      { alertId: alert.id, contactCount: contacts.length, timerDuration, phase2Delay },
      `SOS recebido às ${receivedAt}. Ligação agendada para daqui a ${phase2Delay}s (timer: ${timerDuration}s).`
    );

    const contactIds = contacts.map((c) => c.id);
    const contactPhones = contacts.map((c) => c.phone);

    // ── Schedule Phase 2 (before timer ends) ─────────────────────────────────
    const phase2Timer = setTimeout(() => {
      AlertService.escalateToVoiceCalls(
        alert.id, data.userId, contactIds, contactPhones, userName, mapsUrl, timerDuration
      ).catch((err) => logger.error({ err, alertId: alert.id }, "Phase 2 escalation failed"));
    }, phase2Delay * 1000);

    addTimer(alert.id, phase2Timer);

    return updatedAlert ?? alert;
  }

  // ── Phase 1: SOS WhatsApp with confirmation link ──────────────────────────
  static async sendSOSWhatsApp(
    alertId: number,
    contacts: Array<{ id: number; phone: string; name: string }>,
    userName: string,
    mapsUrl: string | null,
    baseUrl: string
  ) {
    if (contacts.length === 0) {
      logger.warn({ alertId }, "Phase 1 — no contacts, WhatsApp skipped");
      return;
    }

    const client = getTwilioClient();
    const confirmBase = `${baseUrl}/api/alerts/${alertId}/confirm`;

    const locationLine = mapsUrl
      ? `📍 *Localização em tempo real:*\n${mapsUrl}`
      : `📍 Localização: não disponível (GPS desativado)`;

    for (const contact of contacts) {
      await AlertModel.createNotification({ alertId, contactId: contact.id, channel: "whatsapp" });

      // Normalize to E.164 so legacy contacts stored without +55 don't route to wrong country.
      const phone = normalizeE164(contact.phone);
      const confirmLink = `${confirmBase}?phone=${encodeURIComponent(phone)}`;

      const body = [
        `🚨 *SOS MULHER — ALERTA DE EMERGÊNCIA*`,
        ``,
        `*${userName}* acionou o botão de emergência e pode estar em perigo imediato.`,
        ``,
        locationLine,
        ``,
        `✅ *Confirme que está a caminho clicando no link abaixo:*`,
        confirmLink,
        ``,
        `📞 Ou ligue imediatamente para *190* (Polícia) ou *180* (Central da Mulher).`,
        ``,
        `_Mensagem automática — SOS Mulher_`,
      ].join("\n");

      if (!client) {
        logger.warn({ contactPhone: phone }, "Phase 1 — Twilio not configured, WhatsApp skipped (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)");
        continue;
      }

      const statusCallbackUrl = `${baseUrl}/api/twilio/whatsapp-status`;

      // For Brazilian numbers, send to BOTH formats (with and without the "9" digit).
      // Twilio error 63015 ("not reachable via WhatsApp") is async — we don't know which
      // format is registered on the contact's WhatsApp until after delivery. Sending both
      // ensures delivery: whichever format is wrong will fail silently (63015), the correct
      // one will deliver. No duplicate arrives because only one format is on WhatsApp.
      const phonesToSend = [phone];
      const altPhone = brazilPhoneAlternate(phone);
      if (altPhone) phonesToSend.push(altPhone);

      for (const p of phonesToSend) {
        try {
          const msg = await client.messages.create({
            from: WHATSAPP_FROM,
            to: `whatsapp:${p}`,
            body,
            statusCallback: statusCallbackUrl,
          });
          logger.info({ sid: msg.sid, to: p, alertId, altFormat: p !== phone }, "Phase 1 — SOS WhatsApp dispatched");
        } catch (err: unknown) {
          const e = err as { code?: number; message?: string };
          logger.warn({ code: e.code, message: e.message, phone: p, alertId }, "Phase 1 — WhatsApp dispatch error (sync)");
        }
      }
    }
  }

  // ── Welcome WhatsApp on contact registration ──────────────────────────────
  static async sendWelcomeWhatsApp(userName: string, contactPhone: string): Promise<void> {
    const client = getTwilioClient();
    if (!client) {
      logger.warn({ contactPhone }, "Welcome WhatsApp — Twilio not configured, skipped");
      return;
    }

    const body = [
      `👋 Olá! *${userName}* cadastrou o seu número no aplicativo de segurança *SOS Mulher*.`,
      ``,
      `Caso ela entre em modo de emergência e você receba uma ligação automática do sistema,`,
      `*atenda e pressione 1* no teclado do celular para confirmar que está a caminho.`,
      ``,
      `Você faz parte da rede de segurança dela. Obrigada! 💙`,
      ``,
      `_SOS Mulher — Segurança na palma da mão_`,
    ].join("\n");

    const baseUrl = getApiBaseUrl();
    const statusCallbackUrl = `${baseUrl}/api/twilio/whatsapp-status`;
    const normalizedPhone = normalizeE164(contactPhone);
    const phonesToSend = [normalizedPhone];
    const altPhone = brazilPhoneAlternate(normalizedPhone);
    if (altPhone) phonesToSend.push(altPhone);

    for (const p of phonesToSend) {
      try {
        const msg = await client.messages.create({
          from: WHATSAPP_FROM,
          to: `whatsapp:${p}`,
          body,
          statusCallback: statusCallbackUrl,
        });
        logger.info({ sid: msg.sid, to: p, altFormat: p !== contactPhone }, "Welcome WhatsApp dispatched to new contact");
      } catch (err: unknown) {
        const e = err as { code?: number; message?: string };
        logger.warn({ code: e.code, message: e.message, phone: p }, "Welcome WhatsApp dispatch error (sync)");
      }
    }
  }

  // ── Phase 2: Voice calls to emergency contacts ────────────────────────────
  static async escalateToVoiceCalls(
    alertId: number,
    userId: number,
    contactIds: number[],
    contactPhones: string[],
    userName: string,
    mapsUrl: string | null,
    timerDuration: number
  ) {
    const current = await AlertModel.findById(alertId);
    if (!current || current.status === "resolved_by_contact" || current.status === "cancelled") {
      logger.info({ alertId, status: current?.status }, "Phase 2 skipped — alert already resolved or cancelled");
      return;
    }

    for (const contactId of contactIds) {
      await AlertModel.createNotification({ alertId, contactId, channel: "voice_call" });
    }
    await AlertModel.updateStatus(alertId, "calling_cloud");

    logger.info({ alertId, contactCount: contactPhones.length }, "Phase 2 — placing voice calls to contacts");

    const client = getTwilioClient();
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"];
    const baseUrl = getApiBaseUrl();

    if (!client || !fromNumber) {
      logger.warn({ alertId }, "Phase 2 — Twilio not configured, voice calls skipped");
    } else {
      for (const rawPhone of contactPhones) {
        const phone = normalizeE164(rawPhone);
        try {
          const callbackUrl = `${baseUrl}/api/voice-callback?alertId=${alertId}&userId=${userId}`;
          const call = await client.calls.create({
            to: phone,
            from: fromNumber,
            url: callbackUrl,
            method: "POST",
          });
          registerCallSid(alertId, call.sid);
          logger.info({ callSid: call.sid, to: phone, alertId }, "Phase 2 — voice call placed");
        } catch (err) {
          logger.error({ err, phone, alertId }, "Phase 2 — voice call failed");
        }
      }
    }

    // ── Schedule Phase 3 ─────────────────────────────────────────────────────
    const phase3Timer = setTimeout(() => {
      AlertService.escalateToAuthorities(alertId, userId, userName, mapsUrl).catch((err) =>
        logger.error({ err, alertId }, "Phase 3 escalation failed")
      );
    }, timerDuration * 1000);

    addTimer(alertId, phase3Timer);
  }

  // ── Phase 3: Call EMERGENCY_DESTINATION_NUMBER ────────────────────────────
  static async escalateToAuthorities(
    alertId: number,
    userId: number,
    userName: string,
    mapsUrl: string | null
  ) {
    const current = await AlertModel.findById(alertId);
    if (!current || current.status === "resolved_by_contact" || current.status === "cancelled") {
      logger.info({ alertId, status: current?.status }, "Phase 3 skipped — alert already resolved or cancelled");
      return;
    }

    await AlertModel.updateStatus(alertId, "authorities_notified");
    logger.info({ alertId }, "Phase 3 — calling emergency destination number");

    const client = getTwilioClient();
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"];
    const authorityNumber = process.env["EMERGENCY_DESTINATION_NUMBER"];

    if (!client || !fromNumber || !authorityNumber) {
      logger.warn({ alertId }, "Phase 3 — missing Twilio config or EMERGENCY_DESTINATION_NUMBER");
      return;
    }

    // Skip Phase 3 if EMERGENCY_DESTINATION_NUMBER is the same as a contact phone —
    // prevents double-calling the same person who was already called in Phase 2.
    const userContacts = await db
      .select({ phone: emergencyContactsTable.phone })
      .from(emergencyContactsTable)
      .where(eq(emergencyContactsTable.userId, userId));
    const digits = (n: string) => n.replace(/\D/g, "");
    const sameAsContact = userContacts.some(c => digits(c.phone) === digits(authorityNumber));
    if (sameAsContact) {
      logger.info({ alertId, authorityNumber }, "Phase 3 skipped — emergency number matches a contact, avoiding duplicate call");
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const encodedMaps = mapsUrl ? encodeURIComponent(mapsUrl) : "";
      const callbackUrl =
        `${baseUrl}/api/voice-callback/authority` +
        `?alertId=${alertId}&userId=${userId}&mapsUrl=${encodedMaps}`;

      const call = await client.calls.create({
        to: authorityNumber,
        from: fromNumber,
        url: callbackUrl,
        method: "POST",
      });
      registerCallSid(alertId, call.sid);
      logger.info({ callSid: call.sid, to: authorityNumber, alertId }, "Phase 3 — authority call placed");
    } catch (err) {
      logger.error({ err, alertId }, "Phase 3 — authority call failed");
    }
  }

  /**
   * Resolve via WhatsApp link click (GET /api/alerts/:id/confirm).
   * Clears all pending timers immediately.
   */
  static async confirmViaLink(alertId: number): Promise<boolean> {
    const current = await AlertModel.findById(alertId);
    if (!current || current.status === "resolved_by_contact") return false;

    clearTimers(alertId);
    await AlertModel.updateStatus(alertId, "resolved_by_contact");
    logger.info({ alertId }, "Alert resolved via WhatsApp confirmation link");
    return true;
  }

  /**
   * Resolve via voice digit "1" (Twilio webhook).
   * Clears all pending timers immediately.
   */
  static async handleWebhookResponse(alertId: number, digit: string) {
    if (digit !== "1") return { resolved: false, alert: null };

    clearTimers(alertId);
    const alert = await AlertModel.updateStatus(alertId, "resolved_by_contact");

    const notifications = await AlertModel.listNotificationsByAlert(alertId);
    const pending = notifications.find(
      (n) => (n.channel === "voice_call" || n.channel === "cloud_call") && !n.responseDigit
    );
    if (pending) await AlertModel.updateNotificationResponse(pending.id, digit);

    logger.info({ alertId }, "Alert resolved via voice digit 1");
    return { resolved: true, alert };
  }

  /**
   * Cancel alert from app (user explicitly presses cancel / "Estou segura").
   * Clears all pending timers immediately, marks as cancelled.
   */
  static async cancelAlert(alertId: number) {
    clearTimers(alertId);
    // Terminate any Twilio calls already in progress (Phase 2 / Phase 3)
    await cancelActiveCalls(alertId);
    const alert = await AlertModel.updateStatus(alertId, "cancelled");
    logger.info({ alertId }, "Alert cancelled by user — timers cleared and active calls terminated");
    return alert;
  }

  /**
   * Manual resolve from app (legacy / "Estou segura" path).
   * Clears all pending timers immediately.
   */
  static async manualResolve(alertId: number) {
    clearTimers(alertId);
    const alert = await AlertModel.updateStatus(alertId, "resolved_by_contact");
    logger.info({ alertId }, "Alert manually resolved by user");
    return alert;
  }
}
