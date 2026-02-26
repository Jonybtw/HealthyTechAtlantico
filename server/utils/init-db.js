const fs = require("fs");
const path = require("path");

/**
 * Applies server/schema.sql against the database.
 * The schema uses IF NOT EXISTS / ON CONFLICT DO NOTHING so it is
 * safe to run on every startup — it creates tables and seeds demo
 * data only if they don't already exist.
 *
 * @param {import("pg").Pool} [poolOverride]  Pass a pool to use; defaults to ./db
 */
const initDb = async (poolOverride) => {
  const pool = poolOverride || require("../db");
  const schemaPath = path.join(__dirname, "..", "schema.sql");

  let sql;
  try {
    sql = fs.readFileSync(schemaPath, "utf8");
  } catch (err) {
    console.warn("[init-db] schema.sql not found — skipping DB init:", err.message);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("[init-db] Schema aplicado com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[init-db] Erro ao aplicar schema:", err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = initDb;
