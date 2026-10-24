import { Router, type IRouter } from "express";
import { FeedbackModel } from "../models/FeedbackModel";

const router: IRouter = Router();

router.post("/feedbacks", async (req, res): Promise<void> => {
  const { userId, message } = req.body as { userId?: number; message?: string };

  if (!userId || !message) {
    res.status(400).json({ error: "userId e mensagem são obrigatórios." });
    return;
  }

  try {
    const feedback = await FeedbackModel.create({ userId, message });
    res.status(201).json(feedback);
  } catch (err) {
    req.log.error({ err }, "Failed to create feedback");
    res.status(500).json({ error: "Falha ao enviar feedback." });
  }
});

export default router;
