import { Router, type IRouter } from "express";
import { AlertController } from "../controllers/alertController";
import { AlertService } from "../services/AlertService";
import { AlertModel } from "../models/AlertModel";

const router: IRouter = Router();

router.post("/alerts", AlertController.create);
router.get("/alerts/user/:userId", AlertController.listByUser);
router.get("/alerts/:alertId/status", AlertController.getStatus);
router.put("/alerts/:alertId/webhook/respond", AlertController.webhookRespond);
router.put("/alerts/:alertId/resolve", AlertController.resolve);
router.post("/alerts/:alertId/cancel", AlertController.cancel);
router.post("/alerts/trigger-voice", AlertController.triggerVoice);
router.post("/alerts/voice-upload", AlertController.voiceUpload);

/**
 * GET /api/alerts/:alertId/confirm
 *
 * WhatsApp confirmation link — tapped by an emergency contact who received the SOS message.
 * Resolves the alert immediately, clears all pending escalation timers (Phase 2 + Phase 3),
 * and returns an HTML page confirming receipt.
 *
 * Query param: ?phone=<contactPhone> (optional, for logging)
 */
router.get("/alerts/:alertId/confirm", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.alertId) ? req.params.alertId[0] : req.params.alertId;
  const alertId = parseInt(raw, 10);

  if (isNaN(alertId)) {
    res.status(400).send("<h2>Link inválido.</h2>");
    return;
  }

  const alert = await AlertModel.findById(alertId);

  if (!alert) {
    res.status(404).send(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>SOS Mulher</title>
      <style>body{font-family:sans-serif;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;}</style>
      </head><body>
      <p style="font-size:48px">❓</p>
      <h2 style="color:#e63946">Alerta não encontrado</h2>
      <p style="color:#64748b">Este link pode ter expirado.</p>
      </body></html>
    `);
    return;
  }

  const alreadyResolved = alert.status === "resolved_by_contact";
  if (!alreadyResolved) {
    await AlertService.confirmViaLink(alertId);
  }

  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>SOS Mulher — Confirmado</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f172a;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          text-align: center;
        }
        .card {
          background: #1e293b;
          border-radius: 20px;
          padding: 36px 28px;
          max-width: 400px;
          width: 100%;
          border: 1px solid #334155;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; font-weight: 700; color: #22c55e; margin-bottom: 12px; }
        p { font-size: 16px; color: #94a3b8; line-height: 1.6; margin-bottom: 10px; }
        .badge {
          display: inline-block;
          background: #22c55e20;
          color: #22c55e;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 20px;
          margin-top: 16px;
          border: 1px solid #22c55e40;
        }
        .emergency {
          margin-top: 24px;
          padding: 16px;
          background: #e6394620;
          border-radius: 12px;
          border: 1px solid #e6394640;
          font-size: 15px;
          color: #fca5a5;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${alreadyResolved ? "✅" : "🛡️"}</div>
        <h1>${alreadyResolved ? "Alerta já resolvido" : "Confirmação recebida!"}</h1>
        <p>
          ${alreadyResolved
            ? "Este alerta de emergência já foi encerrado anteriormente."
            : "O sistema registrou que você está a caminho. As ligações automáticas foram canceladas."}
        </p>
        ${!alreadyResolved ? `<div class="badge">✓ Alerta nº ${alertId} encerrado</div>` : ""}
        <div class="emergency">
          📞 Se a situação for grave, ligue imediatamente para <strong>190</strong> (Polícia) ou <strong>180</strong> (Central da Mulher).
        </div>
      </div>
    </body>
    </html>
  `);
});

export default router;
