import express from "express";
import ClienteController from "../controller/ClienteController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

// Router de Cliente.
// Ele define as URLs do domínio "cliente" e chama os métodos do Controller.
//
// IMPORTANTE: este arquivo NÃO acessa banco diretamente.
// Quem acessa o banco é o Model.
const router = express.Router();

// Tudo abaixo exige autenticação.
// Em vez de repetir autenticarToken em cada rota, usamos router.use.
router.use(autenticarToken);

// POST /clientes
router.post("/", ClienteController.criar);

// GET /clientes
router.get("/", ClienteController.listar);

// GET /clientes/:id
router.get("/:id", ClienteController.buscarPorId);

// PUT /clientes/:id
router.put("/:id", ClienteController.atualizar);

// DELETE /clientes/:id
router.delete("/:id", ClienteController.deletar);

export default router;
