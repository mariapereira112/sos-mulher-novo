import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { alertsTable } from "./alerts";
import { emergencyContactsTable } from "./emergencyContacts";

export const alertNotificationsTable = pgTable("alert_notifications", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull().references(() => alertsTable.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").notNull().references(() => emergencyContactsTable.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  responseDigit: text("response_digit"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AlertNotification = typeof alertNotificationsTable.$inferSelect;
export type InsertAlertNotification = typeof alertNotificationsTable.$inferInsert;
