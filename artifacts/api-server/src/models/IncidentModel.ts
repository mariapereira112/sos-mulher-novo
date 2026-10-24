import { eq, desc } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import type { InsertIncident } from "@workspace/db";

export class IncidentModel {
  static async create(data: Omit<InsertIncident, "id" | "createdAt">) {
    const [incident] = await db.insert(incidentsTable).values(data).returning();
    return incident!;
  }

  static async listByUser(userId: number) {
    return db
      .select()
      .from(incidentsTable)
      .where(eq(incidentsTable.userId, userId))
      .orderBy(desc(incidentsTable.createdAt));
  }

  static async findById(id: number) {
    const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
    return incident ?? null;
  }

  static async delete(id: number, userId: number) {
    const [deleted] = await db
      .delete(incidentsTable)
      .where(eq(incidentsTable.id, id))
      .returning();
    return deleted ?? null;
  }
}
