const app = require("./app");
const { PORT } = require("./config/env");

app.listen(PORT, () => {
  console.log(`AtlanticoFit API a correr na porta ${PORT}`);
});
