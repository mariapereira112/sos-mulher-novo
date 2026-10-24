import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  gpsEnabled: boolean("gps_enabled").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  cameraMicEnabled: boolean("camera_mic_enabled").notNull().default(false),
  discreteMode: boolean("discrete_mode").notNull().default(false),
  biometricsEnabled: boolean("biometrics_enabled").notNull().default(false),
  coercionCode: text("coercion_code"),
  sosTimer: text("sos_timer").notNull().default("1500"),
  photoUrl: text("photo_url"),
  highContrast: boolean("high_contrast").notNull().default(false),
  largeText: boolean("large_text").notNull().default(false),
  reduceMotion: boolean("reduce_motion").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
