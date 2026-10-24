import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  nomeCompleto: text("nome_completo").notNull(),
  cpf: text("cpf"),
  narrative: text("narrative").notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  audioUrl: text("audio_url"),
  witnesses: jsonb("witnesses").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Incident = typeof incidentsTable.$inferSelect;
export type InsertIncident = typeof incidentsTable.$inferInsert;
