import express from "express";
import VendaController from "../controllers/VendaController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas as rotas de venda exigem token.
router.use(autenticarToken);

// POST /vendas
// - inicia uma venda (negociação), reservando o veículo
router.post("/", VendaController.criar);

// PATCH /vendas/:id/concluir
// - conclui a venda e marca o veículo como vendido
router.patch("/:id/concluir", VendaController.concluir);

// PATCH /vendas/:id/cancelar
// - cancela a venda e libera o veículo
router.patch("/:id/cancelar", VendaController.cancelar);

// POST /vendas/:id/pagamentos
// - registra um pagamento para uma venda
router.post("/:id/pagamentos", VendaController.pagamento);

export default router;
