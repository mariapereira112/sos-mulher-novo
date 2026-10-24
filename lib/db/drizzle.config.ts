
import { defineConfig } from "drizzle-kit";
import path from "path";
import { config } from "dotenv";

// Carrega o arquivo .env do backend
config({
  path: path.resolve(__dirname, "../../artifacts/api-server/.env"),
});

// Verifica se a conexão com o banco foi configurada
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não foi configurada no arquivo artifacts/api-server/.env"
  );
}

// Configuração do Drizzle com PostgreSQL
export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
