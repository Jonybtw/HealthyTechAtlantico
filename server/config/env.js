const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });

const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
  if (NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET não está definido ou usa o valor padrão. Defina JWT_SECRET no ficheiro .env antes de iniciar em produção.");
    process.exit(1);
  } else {
    console.warn("WARNING: JWT_SECRET não definido — a usar valor de desenvolvimento. Nunca use em produção.");
  }
}

module.exports = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV,
  JWT_SECRET: JWT_SECRET || "dev_secret_nao_usar_em_producao",
};
