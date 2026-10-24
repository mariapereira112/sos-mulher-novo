import type { Request, Response } from "express";
import { RecoverAccountBody } from "@workspace/api-zod";
import { AuthService } from "../services/AuthService";

export class AuthController {
  static async recoverAccount(req: Request, res: Response): Promise<void> {
    const parsed = RecoverAccountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: String(parsed.error) });
      return;
    }
    const result = await AuthService.recoverAccount(parsed.data.email);
    if (!result) {
      res.status(404).json({ error: "E-mail não encontrado no sistema." });
      return;
    }
    res.json(result);
  }
}
