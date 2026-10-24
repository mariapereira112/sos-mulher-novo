import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, emergencyContactsTable, usersTable } from "@workspace/db";
import { CreateContactBody } from "@workspace/api-zod";
import { AlertService } from "../services/AlertService";

const router: IRouter = Router();

router.get("/users/:userId/contacts", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }
  const contacts = await db.select().from(emergencyContactsTable).where(eq(emergencyContactsTable.userId, userId));
  res.json(contacts);
});

router.post("/users/:userId/contacts", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [contact] = await db.insert(emergencyContactsTable).values({
    userId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    relationship: parsed.data.relationship,
  }).returning();

  // Fetch user name for the welcome message
  const [userRow] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const userName = userRow?.name ?? "Uma usuária";

  // Send welcome WhatsApp to the new contact (non-blocking)
  AlertService.sendWelcomeWhatsApp(userName, parsed.data.phone).catch((err) => {
    req.log.error({ err, contactPhone: parsed.data.phone }, "Welcome WhatsApp failed (non-fatal)");
  });

  res.status(201).json(contact);
});

router.delete("/users/:userId/contacts/:contactId", async (req, res): Promise<void> => {
  const rawUser = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawUser, 10);
  const rawContact = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
  const contactId = parseInt(rawContact, 10);
  if (isNaN(userId) || isNaN(contactId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(emergencyContactsTable)
    .where(and(eq(emergencyContactsTable.id, contactId), eq(emergencyContactsTable.userId, userId)))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Contact not found" }); return; }
  res.sendStatus(204);
});

export default router;
