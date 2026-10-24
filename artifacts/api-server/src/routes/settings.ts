import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpsertSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId/settings", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
  if (!settings) {
    res.json({
      id: 0,
      userId,
      gpsEnabled: true,
      notificationsEnabled: true,
      cameraMicEnabled: false,
      discreteMode: false,
      biometricsEnabled: false,
      coercionCode: null,
      sosTimer: "1500",
      photoUrl: null,
    });
    return;
  }
  res.json(settings);
});

router.put("/users/:userId/settings", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const parsed = UpsertSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));

  let result;
  if (existing) {
    [result] = await db
      .update(settingsTable)
      .set({ ...parsed.data })
      .where(eq(settingsTable.userId, userId))
      .returning();
  } else {
    [result] = await db
      .insert(settingsTable)
      .values({ userId, ...parsed.data })
      .returning();
  }

  res.json(result);
});

export default router;
