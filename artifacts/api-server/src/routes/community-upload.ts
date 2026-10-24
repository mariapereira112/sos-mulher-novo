import { Router, type IRouter } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads", "community");

const tiposPermitidos: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/wav": ".wav",
  "audio/webm": ".webm",
};

const limiteBytes = 7 * 1024 * 1024;

router.post("/community/upload", async (req, res): Promise<void> => {
  try {
    const { file, mimeType } = req.body ?? {};

    if (typeof file !== "string" || typeof mimeType !== "string") {
      res.status(400).json({ error: "Arquivo ou formato ausente" });
      return;
    }

    const extensao = tiposPermitidos[mimeType.toLowerCase()];

    if (!extensao) {
      res.status(400).json({ error: "Formato de arquivo nao permitido" });
      return;
    }

    const base64 = file.replace(/^data:[^,]+,/, "");

    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 !== 0) {
      res.status(400).json({ error: "Arquivo invalido" });
      return;
    }

    if (base64.length > Math.ceil(limiteBytes / 3) * 4) {
      res.status(413).json({ error: "Arquivo muito grande" });
      return;
    }

    const buffer = Buffer.from(base64, "base64");

    if (buffer.length === 0 || buffer.length > limiteBytes) {
      res.status(413).json({ error: "Arquivo vazio ou muito grande" });
      return;
    }

    const nomeArquivo = `${randomUUID()}${extensao}`;

    await fs.mkdir(uploadDir, { recursive: true });

    await fs.writeFile(
      path.join(uploadDir, nomeArquivo),
      buffer,
      { flag: "wx" }
    );

    res.status(201).json({
      url: `/api/community-media/${nomeArquivo}`,
    });
  } catch (error) {
    console.error("Erro no upload da comunidade:", error);
    res.status(500).json({ error: "Nao foi possivel enviar o arquivo" });
  }
});

export default router;
