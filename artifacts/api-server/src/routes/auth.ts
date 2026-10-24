import { Router, type IRouter } from "express";
import { ilike } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { AuthController } from "../controllers/authController";
import { AuthService } from "../services/AuthService";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    res.status(400).json({ error: "E-mail/nome e senha são obrigatórios." });
    return;
  }

  const trimmed = identifier.trim();
  const isEmail = trimmed.includes("@");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isEmail
        ? ilike(usersTable.email, trimmed)
        : ilike(usersTable.name, trimmed)
    );

  if (!user) {
    res.status(404).json({
      error: isEmail
        ? "E-mail não encontrado. Verifique o endereço ou crie uma conta."
        : "Nome não encontrado. Verifique o nome ou use seu e-mail.",
    });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "Esta conta não possui senha. Use 'Redefinir senha'." });
    return;
  }

  const valid = await AuthService.verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Senha incorreta. Tente novamente." });
    return;
  }

  res.json({ userId: user.id, userName: user.name, phone: user.phone });
});

router.post("/auth/recover", AuthController.recoverAccount);

export default router;
