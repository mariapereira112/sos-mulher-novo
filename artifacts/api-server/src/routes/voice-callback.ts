import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { getApiBaseUrl } from "../lib/url";

const router: IRouter = Router();

/**
 * Find the user's uploaded emergency audio file.
 * Returns the public URL if found, null otherwise.
 */
function getUserVoiceUrl(userId: string | undefined): string | null {
  if (!userId) return null;
  const uploadsDir = path.join(process.cwd(), "uploads", "voice");
  for (const ext of ["mp3", "wav", "m4a", "ogg"]) {
    const filePath = path.join(uploadsDir, `user_${userId}_voice.${ext}`);
    if (fs.existsSync(filePath)) {
      return `${getApiBaseUrl()}/api/voice-uploads/user_${userId}_voice.${ext}`;
    }
  }
  return null;
}

/**
 * POST /api/voice-callback
 *
 * Phase 2 — called by Twilio when placing a voice call to an emergency contact.
 * Plays the user's recorded audio (<Play>) if available, otherwise uses pt-BR TTS (<Say>).
 * After the audio, asks the contact to press 1 to confirm they are helping.
 * Pressing 1 triggers PUT /api/alerts/:id/webhook/respond which resolves the alert.
 *
 * Query params: alertId, userId
 */
router.post("/voice-callback", (req, res): void => {
  const alertId = (req.query["alertId"] as string) ?? "";
  const userId = (req.query["userId"] as string) ?? "";

  const baseUrl = getApiBaseUrl();
  const webhookUrl = `${baseUrl}/api/alerts/${alertId}/webhook/respond`;
  const userVoiceUrl = getUserVoiceUrl(userId);

  let audioBlock: string;
  if (userVoiceUrl) {
    // Play the user's own recorded voice
    audioBlock = `<Play>${userVoiceUrl}</Play>`;
  } else {
    // Fallback: Brazilian Portuguese TTS
    audioBlock = `<Say language="pt-BR" voice="alice">Atenção. Uma mulher acionou o sistema SOS Mulher e pode estar em perigo imediato. Por favor, responda imediatamente.</Say>`;
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioBlock}
  <Gather numDigits="1" action="${webhookUrl}" method="POST" timeout="10">
    <Say language="pt-BR" voice="alice">
      Se você pode ajudá-la agora, pressione 1. Caso contrário, ligue imediatamente para 190.
    </Say>
  </Gather>
  <Say language="pt-BR" voice="alice">
    Nenhuma resposta recebida. Por favor, ligue para 190 ou vá ao local imediatamente.
  </Say>
</Response>`;

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(twiml);
});

/**
 * POST /api/voice-callback/authority
 *
 * Phase 3 — called by Twilio when placing a call to EMERGENCY_DESTINATION_NUMBER.
 * Plays the user's recorded audio (<Play>) if available, then gives an emergency briefing.
 * No Gather needed — this is an informational alert call to simulate authorities.
 *
 * Query params: alertId, userId, mapsUrl (optional, URL-encoded)
 */
router.post("/voice-callback/authority", (req, res): void => {
  const alertId = (req.query["alertId"] as string) ?? "";
  const userId = (req.query["userId"] as string) ?? "";
  const mapsUrl = req.query["mapsUrl"] ? decodeURIComponent(req.query["mapsUrl"] as string) : null;

  const userVoiceUrl = getUserVoiceUrl(userId);

  const locationText = mapsUrl
    ? `A localização da vítima é: ${mapsUrl}`
    : `A localização da vítima não está disponível.`;

  let twiml: string;

  if (userVoiceUrl) {
    // Play the user's voice first, then give the authority briefing
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="alice">Atenção. Esta é uma chamada automática de emergência do sistema SOS Mulher. A seguir você ouvirá a mensagem gravada pela vítima.</Say>
  <Play>${userVoiceUrl}</Play>
  <Say language="pt-BR" voice="alice">
    Alerta de emergência ativo. Alerta número ${alertId}.
    ${locationText}
    Nenhum contato de emergência confirmou o atendimento dentro do prazo.
    Por favor, tome as providências necessárias imediatamente.
    Esta chamada foi gerada automaticamente pelo aplicativo SOS Mulher.
  </Say>
</Response>`;
  } else {
    // Pure TTS fallback in pt-BR
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="alice">
    Atenção. Esta é uma chamada automática de emergência do sistema SOS Mulher.
    Uma mulher acionou o botão de socorro e nenhum contato respondeu no tempo limite.
    Alerta número ${alertId}.
    ${locationText}
    Por favor, tome as providências necessárias imediatamente.
    Esta chamada foi gerada automaticamente pelo aplicativo SOS Mulher.
  </Say>
</Response>`;
  }

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.send(twiml);
});

/**
 * POST /api/twilio/test-whatsapp
 *
 * Dev/debug endpoint — sends a simple test WhatsApp message to verify Twilio is working.
 * Body: { phone: string }  — phone in E.164 format, e.g. "+5547988119650"
 */
router.post("/twilio/test-whatsapp", async (req, res): Promise<void> => {
  const { phone } = req.body as { phone?: string };
  if (!phone) {
    res.status(400).json({ error: "phone é obrigatório (ex: +5547988119650)" });
    return;
  }

  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) {
    res.status(500).json({ error: "Twilio não configurado (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN ausentes)" });
    return;
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);
  const WHATSAPP_FROM = "whatsapp:+14155238886";

  // For Brazilian numbers, always try both formats (with and without the "9" digit).
  // Error 63015 = number not reachable; 63016/63031 = not in sandbox or session expired.
  const phonesToTry = [phone];
  if (phone.startsWith("+55")) {
    const after55 = phone.slice(3);
    if (after55.length === 11 && after55[2] === "9") {
      // 13 digits: remove the leading "9" → try 12-digit format
      phonesToTry.push(`+55${after55.slice(0, 2)}${after55.slice(3)}`);
    } else if (after55.length === 10) {
      // 12 digits: add leading "9" → try 13-digit format
      phonesToTry.push(`+55${after55.slice(0, 2)}9${after55.slice(2)}`);
    }
  }

  const results: Array<{ phone: string; sid?: string; error?: string }> = [];

  // Send to ALL formats — async 63015 errors mean only the correct format will deliver.
  // No duplicates possible: only one format is registered on WhatsApp per number.
  for (const p of phonesToTry) {
    try {
      const msg = await client.messages.create({
        from: WHATSAPP_FROM,
        to: `whatsapp:${p}`,
        body: "✅ Teste SOS Mulher — Twilio WhatsApp funcionando! Esta mensagem confirma que o número está cadastrado no sandbox.",
      });
      req.log.info({ sid: msg.sid, to: p }, "Twilio test WhatsApp dispatched");
      results.push({ phone: p, sid: msg.sid });
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      req.log.warn({ phone: p, code: e.code, message: e.message }, "Twilio test WhatsApp sync error");
      results.push({ phone: p, error: `código ${e.code}: ${e.message}` });
    }
  }

  const dispatched = results.filter(r => r.sid);
  if (dispatched.length > 0) {
    res.json({ ok: true, dispatched, tried: results, note: "Erro 63015 é assíncrono — se um formato falhar, o outro entregará." });
  } else {
    res.status(502).json({ ok: false, tried: results });
  }
});

/**
 * POST /api/twilio/whatsapp-status
 *
 * Twilio delivery status webhook for WhatsApp messages.
 * Twilio calls this URL after every status change (queued → sent → delivered / failed / undelivered).
 * Logs the full status so we can see in server logs whether WhatsApp was actually delivered.
 */
router.post("/twilio/whatsapp-status", (req, res): void => {
  const {
    MessageSid,
    MessageStatus,
    To,
    From,
    ErrorCode,
    ErrorMessage,
  } = req.body as Record<string, string | undefined>;

  if (MessageStatus === "delivered") {
    req.log.info(
      { sid: MessageSid, status: MessageStatus, to: To },
      "Twilio WhatsApp — DELIVERED ✓"
    );
  } else if (MessageStatus === "failed" || MessageStatus === "undelivered") {
    req.log.error(
      { sid: MessageSid, status: MessageStatus, to: To, from: From, errorCode: ErrorCode, errorMessage: ErrorMessage },
      "Twilio WhatsApp — FALHA NA ENTREGA"
    );
  } else {
    req.log.info(
      { sid: MessageSid, status: MessageStatus, to: To },
      "Twilio WhatsApp — status update"
    );
  }

  res.sendStatus(200);
});

export default router;
