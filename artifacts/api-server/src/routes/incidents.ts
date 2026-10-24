import { Router, type IRouter } from "express";
import { IncidentModel } from "../models/IncidentModel";

const router: IRouter = Router();

function parseId(param: string | string[] | undefined): number {
  const raw = Array.isArray(param) ? param[0] : (param ?? "");
  return parseInt(raw, 10);
}

router.post("/incidents", async (req, res): Promise<void> => {
  const { userId, nomeCompleto, cpf, narrative, attachments, audioUrl, witnesses } = req.body as {
    userId?: number;
    nomeCompleto?: string;
    cpf?: string | null;
    narrative?: string;
    attachments?: string[];
    audioUrl?: string | null;
    witnesses?: string[];
  };

  if (!userId || !nomeCompleto || !narrative) {
    res.status(400).json({ error: "userId, nomeCompleto e narrative são obrigatórios." });
    return;
  }

  try {
    const incident = await IncidentModel.create({
      userId,
      nomeCompleto,
      cpf: cpf ?? null,
      narrative,
      attachments: Array.isArray(attachments) ? attachments : [],
      audioUrl: audioUrl ?? null,
      witnesses: Array.isArray(witnesses) ? witnesses : [],
    });
    res.status(201).json(incident);
  } catch (err) {
    req.log.error({ err }, "Failed to create incident");
    res.status(500).json({ error: "Falha ao registrar incidente." });
  }
});

router.get("/users/:userId/incidents", async (req, res): Promise<void> => {
  const userId = parseId(req.params["userId"]);
  if (isNaN(userId)) {
    res.status(400).json({ error: "userId inválido" });
    return;
  }
  const incidents = await IncidentModel.listByUser(userId);
  res.json(Array.isArray(incidents) ? incidents : []);
});

router.delete("/incidents/:incidentId", async (req, res): Promise<void> => {
  const incidentId = parseId(req.params["incidentId"]);
  const { userId } = req.body as { userId?: number };
  if (isNaN(incidentId)) {
    res.status(400).json({ error: "incidentId inválido" });
    return;
  }
  const deleted = await IncidentModel.delete(incidentId, userId ?? 0);
  if (!deleted) {
    res.status(404).json({ error: "Incidente não encontrado" });
    return;
  }
  res.status(204).send();
});

export default router;
