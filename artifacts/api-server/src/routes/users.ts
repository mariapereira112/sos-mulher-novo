import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { AuthService } from "../services/AuthService";
import {
  CreateUserBody,
  UpdateUserBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(param: string | string[] | undefined): number {
  const raw = Array.isArray(param) ? param[0] : (param ?? "");
  return parseInt(raw, 10);
}

function toPublicUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _omit, ...pub } = user;
  return pub;
}

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    let passwordHash: string | null = null;
    if (parsed.data.password) {
      passwordHash = await AuthService.hashPassword(parsed.data.password);
    }
    const user = await AuthService.register({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      cpf: parsed.data.cpf ?? null,
      gender: parsed.data.gender ?? null,
      passwordHash,
    });
    res.status(201).json(toPublicUser(user));
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "GENDER_RESTRICTED" || (err instanceof Error && err.message === "GENDER_RESTRICTED")) {
      res.status(403).json({ error: "restricted", redirect: "/acesso-restrito" });
      return;
    }
    if (pgErr.code === "23505") {
      res.status(409).json({ error: "CPF já cadastrado. Use 'Já tenho cadastro' para entrar." });
      return;
    }
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Falha ao criar usuário." });
  }
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const userId = parseId(req.params["userId"]);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.patch("/users/:userId", async (req, res): Promise<void> => {
  const userId = parseId(req.params["userId"]);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof usersTable.$inferSelect> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email ?? null;
  if (parsed.data.cpf !== undefined) {
    updates.cpf = parsed.data.cpf ?? null;
  }
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender ?? null;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.delete("/users/:userId", async (req, res): Promise<void> => {
  const userId = parseId(req.params["userId"]);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, userId)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(204).send();
});

router.put("/users/update-email", async (req, res): Promise<void> => {
  const { userId, email } = req.body as { userId?: number; email?: string };
  if (!userId || !email) {
    res.status(400).json({ error: "userId e email são obrigatórios." });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing && existing.id !== userId) {
    res.status(409).json({ error: "E-mail já está sendo usado por outra conta." });
    return;
  }
  const [user] = await db.update(usersTable).set({ email }).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.put("/users/update-password", async (req, res): Promise<void> => {
  const { userId, currentPassword, newPassword } = req.body as {
    userId?: number;
    currentPassword?: string;
    newPassword?: string;
  };
  if (!userId || !currentPassword || !newPassword) {
    res.status(400).json({ error: "userId, currentPassword e newPassword são obrigatórios." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.passwordHash) {
    const valid = await AuthService.verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Senha atual incorreta." });
      return;
    }
  }

  const newHash = await AuthService.hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  res.json({ message: "Senha atualizada com sucesso." });
});

router.post("/users/:userId/complete-onboarding", async (req, res): Promise<void> => {
  const userId = parseId(req.params["userId"]);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ onboardingCompleted: true })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

export default router;
