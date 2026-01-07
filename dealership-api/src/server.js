import express from "express";
import dotenv from "dotenv";

import usuarioRoutes from "./routes/usuarioRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/usuarios", usuarioRoutes);
app.use("/clientes", clienteRoutes);
app.use("/veiculos", veiculoRoutes);
app.use("/vendas", vendaRoutes);

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});
