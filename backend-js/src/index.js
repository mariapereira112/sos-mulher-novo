require("dotenv").config();

const sequelize      = require("./db");
require("./models/User");
require("./models/Alert");
require("./models/Contact");
require("./models/Post");
require("./models/Settings");

const express        = require("express");
const cors           = require("cors");

const usersRouter    = require("./routes/users");
const alertsRouter   = require("./routes/alerts");
const contactsRouter = require("./routes/contacts");
const postsRouter    = require("./routes/posts");
const settingsRouter = require("./routes/settings");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/healthz", (_req, res) => res.json({ status: "ok", app: "SOS Mulher API" }));

app.use("/api/users",    usersRouter);
app.use("/api/alerts",   alertsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/posts",    postsRouter);
app.use("/api/settings", settingsRouter);

app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();

  const dbInfo = process.env.STANDALONE_DB_URL
    ? process.env.STANDALONE_DB_URL.replace(/:\/\/.*@/, "://<credenciais>@")
    : "SQLite local (./data/sos.db)";

  app.listen(PORT, () => {
    console.log(`✅ SOS Mulher API rodando em http://localhost:${PORT}`);
    console.log(`🗄️  Banco: ${dbInfo}`);
    console.log(`📋 Endpoints:`);
    console.log(`   POST   /api/users              → Criar usuário`);
    console.log(`   POST   /api/users/login         → Login`);
    console.log(`   GET    /api/users/:id           → Buscar usuário`);
    console.log(`   PATCH  /api/users/:id           → Atualizar usuário`);
    console.log(`   POST   /api/alerts              → Criar alerta SOS`);
    console.log(`   GET    /api/alerts/user/:id     → Histórico de alertas`);
    console.log(`   PUT    /api/alerts/:id/resolve  → Resolver alerta`);
    console.log(`   POST   /api/contacts            → Criar contato`);
    console.log(`   GET    /api/contacts/:userId    → Listar contatos`);
    console.log(`   DELETE /api/contacts/:id        → Remover contato`);
    console.log(`   GET    /api/posts               → Listar posts`);
    console.log(`   POST   /api/posts               → Criar post`);
    console.log(`   GET    /api/settings/:userId    → Buscar configurações`);
    console.log(`   PUT    /api/settings/:userId    → Salvar configurações`);
  });
}

start().catch(err => { console.error("Erro ao iniciar:", err.message); process.exit(1); });
