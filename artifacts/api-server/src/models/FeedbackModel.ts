import { db, feedbacksTable } from "@workspace/db";
import type { InsertFeedback } from "@workspace/db";

export class FeedbackModel {
  static async create(data: Omit<InsertFeedback, "id" | "createdAt">) {
    const [feedback] = await db.insert(feedbacksTable).values(data).returning();
    return feedback!;
  }
}
