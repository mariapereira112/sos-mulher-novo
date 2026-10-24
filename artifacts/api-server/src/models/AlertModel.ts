import { eq, desc, inArray } from "drizzle-orm";
import { db, alertsTable, alertNotificationsTable, emergencyContactsTable } from "@workspace/db";
import type { InsertAlert, InsertAlertNotification } from "@workspace/db";

export type NotifWithContact = {
  alertId: number;
  contactId: number;
  channel: string;
  responseDigit: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

export class AlertModel {
  static async create(data: Omit<InsertAlert, "id" | "createdAt" | "status"> & { status?: string }) {
    const [alert] = await db
      .insert(alertsTable)
      .values({ ...data, status: data.status ?? "pending" })
      .returning();
    return alert!;
  }

  static async findById(id: number) {
    const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
    return alert ?? null;
  }

  static async listByUser(userId: number) {
    return db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.userId, userId))
      .orderBy(desc(alertsTable.createdAt));
  }

  /** Returns alerts with per-contact notification rows (name, channel, response). */
  static async listByUserWithNotifications(userId: number) {
    const alerts = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.userId, userId))
      .orderBy(desc(alertsTable.createdAt));

    if (alerts.length === 0) {
      return alerts.map(a => ({ ...a, notifications: [] as NotifWithContact[] }));
    }

    const ids = alerts.map(a => a.id);
    const notifs: NotifWithContact[] = await db
      .select({
        alertId: alertNotificationsTable.alertId,
        contactId: alertNotificationsTable.contactId,
        channel: alertNotificationsTable.channel,
        responseDigit: alertNotificationsTable.responseDigit,
        contactName: emergencyContactsTable.name,
        contactPhone: emergencyContactsTable.phone,
      })
      .from(alertNotificationsTable)
      .leftJoin(emergencyContactsTable, eq(alertNotificationsTable.contactId, emergencyContactsTable.id))
      .where(inArray(alertNotificationsTable.alertId, ids));

    return alerts.map(a => ({
      ...a,
      notifications: notifs.filter(n => n.alertId === a.id),
    }));
  }

  static async updateStatus(id: number, status: string) {
    const [alert] = await db
      .update(alertsTable)
      .set({ status })
      .where(eq(alertsTable.id, id))
      .returning();
    return alert ?? null;
  }

  static async createNotification(data: Omit<InsertAlertNotification, "id" | "sentAt">) {
    const [notif] = await db.insert(alertNotificationsTable).values(data).returning();
    return notif!;
  }

  static async listNotificationsByAlert(alertId: number) {
    return db
      .select()
      .from(alertNotificationsTable)
      .where(eq(alertNotificationsTable.alertId, alertId));
  }

  static async updateNotificationResponse(id: number, responseDigit: string) {
    const [notif] = await db
      .update(alertNotificationsTable)
      .set({ responseDigit })
      .where(eq(alertNotificationsTable.id, id))
      .returning();
    return notif ?? null;
  }
}
