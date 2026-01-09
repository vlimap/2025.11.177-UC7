import express from "express";
import VeiculoController from "../controller/VeiculoController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

// Router de Veículo.
// Todas as rotas aqui são protegidas (estoque só para usuário logado).
const router = express.Router();

router.use(autenticarToken);

// POST /veiculos
router.post("/", VeiculoController.criar);

// GET /veiculos
router.get("/", VeiculoController.listar);

// GET /veiculos/:id
router.get("/:id", VeiculoController.buscarPorId);

// PUT /veiculos/:id
router.put("/:id", VeiculoController.atualizar);

// DELETE /veiculos/:id
// Em vez de apagar do banco, marcamos como INATIVO (soft delete).
router.delete("/:id", VeiculoController.inativar);

export default router;
