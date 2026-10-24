
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

// Pasta dos Ã¡udios de emergÃªncia do SOS
const voiceUploadsDir = path.join(process.cwd(), "uploads", "voice");
fs.mkdirSync(voiceUploadsDir, { recursive: true });

// Pasta separada para fotos e Ã¡udios da comunidade
const communityUploadsDir = path.join(
  process.cwd(),
  "uploads",
  "community"
);
fs.mkdirSync(communityUploadsDir, { recursive: true });

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ãudios utilizados nas chamadas de emergÃªncia
app.use(
  "/api/voice-uploads",
  express.static(voiceUploadsDir)
);

// Fotos e Ã¡udios publicados na comunidade
app.use(
  "/api/community-media",
  express.static(communityUploadsDir)
);

// Rotas da API
app.use("/api", router);

export default app;

