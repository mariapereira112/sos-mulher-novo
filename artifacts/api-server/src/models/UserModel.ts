import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import type { InsertUser } from "@workspace/db";

export class UserModel {
  static async findById(id: number) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  }

  static async findByEmail(email: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user ?? null;
  }

  static async create(data: InsertUser) {
    const [user] = await db.insert(usersTable).values(data).returning();
    return user!;
  }

  static async update(id: number, data: Partial<typeof usersTable.$inferInsert>) {
    const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    return user ?? null;
  }
}
