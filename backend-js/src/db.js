const { Sequelize } = require("sequelize");
const path = require("path");
const fs   = require("fs");

// Usa STANDALONE_DB_URL para não conflitar com o DATABASE_URL do ambiente Replit.
// Se não definido, usa SQLite local automaticamente.
const dbUrl = process.env.STANDALONE_DB_URL;

let sequelize;

if (!dbUrl || dbUrl.startsWith("sqlite:")) {
  const storagePath = dbUrl
    ? dbUrl.replace("sqlite:", "")
    : path.resolve("./data/sos.db");
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging:  false,
  });
} else {
  // PostgreSQL, MySQL, MariaDB, MSSQL — detectado automaticamente pela URL
  sequelize = new Sequelize(dbUrl, { logging: false });
}

module.exports = sequelize;
