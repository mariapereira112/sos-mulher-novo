import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { CreateAlertBody, WebhookRespondBody } from "@workspace/api-zod";
import { AlertService } from "../services/AlertService";
import { AlertModel } from "../models/AlertModel";
import { getApiBaseUrl } from "../lib/url";

const execFileAsync = promisify(execFile);

function parseId(param: string | string[] | undefined): number {
  const raw = Array.isArray(param) ? param[0] : (param ?? "");
  return parseInt(raw, 10);
}

export class AlertController {
  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateAlertBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    try {
      const alert = await AlertService.createAndEscalate({
        userId: parsed.data.userId,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        timerDuration: parsed.data.timerDuration ?? 30,
      });
      res.status(201).json(alert);
    } catch (err) {
      req.log.error({ err }, "Failed to create alert");
      res.status(500).json({ error: "Falha ao criar alerta de emergência." });
    }
  }

  static async listByUser(req: Request, res: Response): Promise<void> {
    const userId = parseId(req.params["userId"]);
    if (isNaN(userId)) {
      res.status(400).json({ error: "userId inválido" });
      return;
    }
    const alerts = await AlertModel.listByUserWithNotifications(userId);
    res.json(Array.isArray(alerts) ? alerts : []);
  }

  /**
   * GET /api/alerts/:alertId/status
   * Returns current status of an alert — used by the mobile app to poll escalation phases.
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    const alertId = parseId(req.params["alertId"]);
    if (isNaN(alertId)) {
      res.status(400).json({ error: "alertId inválido" });
      return;
    }
    const alert = await AlertModel.findById(alertId);
    if (!alert) {
      res.status(404).json({ error: "Alerta não encontrado" });
      return;
    }
    const notifications = await AlertModel.listNotificationsByAlert(alertId);
    res.json({
      id: alert.id,
      status: alert.status,
      timerDuration: alert.timerDuration,
      createdAt: alert.createdAt,
      notifications: notifications.map((n) => ({
        channel: n.channel,
        sentAt: n.sentAt,
        responded: !!n.responseDigit,
      })),
    });
  }

  static async webhookRespond(req: Request, res: Response): Promise<void> {
    const alertId = parseId(req.params["alertId"]);
    if (isNaN(alertId)) {
      res.status(400).json({ error: "alertId inválido" });
      return;
    }
    const parsed = WebhookRespondBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const result = await AlertService.handleWebhookResponse(alertId, parsed.data.digit);
    res.json(result);
  }

  static async resolve(req: Request, res: Response): Promise<void> {
    const alertId = parseId(req.params["alertId"]);
    if (isNaN(alertId)) {
      res.status(400).json({ error: "alertId inválido" });
      return;
    }
    // manualResolve also calls clearTimers() to cancel pending Phase 2 / Phase 3 escalation
    const alert = await AlertService.manualResolve(alertId);
    if (!alert) {
      res.status(404).json({ error: "Alerta não encontrado" });
      return;
    }
    res.json(alert);
  }

  /**
   * POST /api/alerts/cancel
   * Called by the mobile app when the user explicitly cancels an active SOS.
   * Immediately clears all pending Phase 2 / Phase 3 timers (clearTimeout) and
   * resolves the alert so no Twilio call is ever placed after this point.
   */
  static async cancel(req: Request, res: Response): Promise<void> {
    const alertId = parseId(req.params["alertId"]);
    if (isNaN(alertId)) {
      res.status(400).json({ error: "alertId inválido" });
      return;
    }
    const alert = await AlertService.cancelAlert(alertId);
    if (!alert) {
      res.status(404).json({ error: "Alerta não encontrado" });
      return;
    }
    req.log.info({ alertId }, "Alert cancelled by user — all timers cleared");
    res.json(alert);
  }

  /**
   * POST /api/alerts/trigger-voice
   * Called by the mobile app when the on-screen countdown reaches zero.
   * This endpoint does NOT place any Twilio call directly — the backend escalation
   * chain (AlertService setTimeout) is the single source of truth for Phase 2 and 3.
   * This endpoint only signals the client that the timer expired and opens the native dialer.
   */
  static async triggerVoice(req: Request, res: Response): Promise<void> {
    const { alertId } = req.body as { alertId?: number; userName?: string; phone?: string | null };

    if (!alertId) {
      res.status(400).json({ error: "alertId é obrigatório." });
      return;
    }

    // No Twilio call here — backend timer (AlertService) handles Phase 2 and Phase 3.
    req.log.info({ alertId }, "trigger-voice: countdown expired on client, backend timer is active");
    res.json({
      status: "timer_expired",
      message: "Cronômetro expirou. As ligações automáticas estão sendo gerenciadas pelo servidor.",
    });
  }

  /**
   * POST /api/alerts/voice-upload
   * Receive and save the user's personal emergency audio recording.
   * Body: { userId: number, audioBase64: string, mimeType?: string }
   */
  static async voiceUpload(req: Request, res: Response): Promise<void> {
    const { userId, audioBase64, mimeType } = req.body as {
      userId?: number;
      audioBase64?: string;
      mimeType?: string;
    };

    if (!userId || !audioBase64) {
      res.status(400).json({ error: "userId e audioBase64 são obrigatórios." });
      return;
    }

    const uploadsDir = path.join(process.cwd(), "uploads", "voice");

    try {
      fs.mkdirSync(uploadsDir, { recursive: true });

      // Determine source extension from mimeType
      const rawExt = mimeType?.includes("ogg") ? "ogg"
        : mimeType?.includes("wav") ? "wav"
        : mimeType?.includes("mp3") || mimeType?.includes("mpeg") ? "mp3"
        : "m4a";

      const buffer = Buffer.from(audioBase64, "base64");
      const finalFileName = `user_${userId}_voice.mp3`;
      const finalPath = path.join(uploadsDir, finalFileName);

      if (rawExt === "mp3") {
        // Already mp3 — save directly
        fs.writeFileSync(finalPath, buffer);
      } else {
        // Save raw file, convert to mp3 with ffmpeg, delete raw
        const tempPath = path.join(uploadsDir, `user_${userId}_voice_tmp.${rawExt}`);
        fs.writeFileSync(tempPath, buffer);
        try {
          await execFileAsync("ffmpeg", [
            "-y", "-i", tempPath,
            "-codec:a", "libmp3lame", "-q:a", "4",
            finalPath,
          ]);
        } finally {
          try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        }
      }

      // Remove any leftover non-mp3 versions from previous uploads
      for (const oldExt of ["m4a", "ogg", "wav"]) {
        const oldPath = path.join(uploadsDir, `user_${userId}_voice.${oldExt}`);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch { /* ignore */ }
      }

      const publicUrl = `${getApiBaseUrl()}/api/voice-uploads/${finalFileName}`;
      req.log.info({ userId, fileName: finalFileName, size: buffer.length }, "Voice recording uploaded and converted to mp3");
      res.json({ success: true, url: publicUrl, fileName: finalFileName });
    } catch (err) {
      req.log.error({ err }, "Voice upload failed");
      res.status(500).json({ error: "Falha ao salvar áudio de emergência." });
    }
  }
}
