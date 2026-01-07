import express from "express";
import dotenv from "dotenv";

import usuarioRoutes from "./routes/usuarioRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";

// Carrega variáveis do arquivo .env para process.env
// Ex.: PORT, DATABASE_URL, JWT_SECRET, etc.
dotenv.config();

// Cria a aplicação Express (nosso servidor HTTP)
const app = express();

// Middleware para o Express entender JSON no corpo da requisição.
// Sem isso, req.body vem undefined em POST/PUT/PATCH com JSON.
app.use(express.json());

// Endpoint simples para verificar se a API está no ar.
// Útil para testes e para monitoramento.
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Rotas do sistema, separadas por domínio.
// A URL base (prefixo) fica aqui e as rotas específicas ficam nos arquivos de routes/.
app.use("/usuarios", usuarioRoutes);
app.use("/clientes", clienteRoutes);
app.use("/veiculos", veiculoRoutes);
app.use("/vendas", vendaRoutes);

// Inicia o servidor. A porta vem do .env (process.env.PORT).
app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});
