const app = require("./app");
const pool = require("./db");
const { PORT } = require("./config/env");
const { initRbac, getRbacState } = require("./utils/rbac");

const start = async () => {
  await initRbac(pool);
  const rbac = getRbacState();

  app.listen(PORT, () => {
    console.log(`AtlanticoFit API a correr na porta http://localhost:${PORT}/`);
    console.log(`RBAC source: ${rbac.source}`);
  });
};

start().catch((err) => {
  console.error("Falha ao iniciar API:", err.message);
  process.exit(1);
});
