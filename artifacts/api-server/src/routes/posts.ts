import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, communityPostsTable } from "@workspace/db";
import { CreatePostBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/posts", async (_req, res): Promise<void> => {
  try {
    const posts = await db
      .select()
      .from(communityPostsTable)
      .orderBy(desc(communityPostsTable.createdAt));

    res.json(posts);
  } catch (error) {
    console.error("Erro ao listar publicacoes:", error);
    res.status(500).json({ error: "Erro ao carregar publicacoes" });
  }
});

router.post("/posts", async (req, res): Promise<void> => {
  try {
    const parsed = CreatePostBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Dados invalidos" });
      return;
    }

    const { userId, userName, content, imageUrl, audioUrl } = parsed.data;

    const [post] = await db
      .insert(communityPostsTable)
      .values({
        userId,
        userName,
        content,
        imageUrl: imageUrl ?? null,
        audioUrl: audioUrl ?? null,
      })
      .returning();

    res.status(201).json(post);
  } catch (error) {
    console.error("Erro ao criar publicacao:", error);
    res.status(500).json({ error: "Erro ao publicar mensagem" });
  }
});

router.delete("/posts/:postId", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;

    const postId = Number(raw);

    if (!Number.isSafeInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "ID invalido" });
      return;
    }

    const [deleted] = await db
      .delete(communityPostsTable)
      .where(eq(communityPostsTable.id, postId))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Publicacao nao encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir publicacao:", error);
    res.status(500).json({ error: "Erro ao excluir publicacao" });
  }
});

export default router;
