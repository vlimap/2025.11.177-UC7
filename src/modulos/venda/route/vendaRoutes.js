import express from "express";
import VendaController from "../controller/VendaController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

// Router de Venda.
// Todas as rotas de venda exigem token.
const router = express.Router();

router.use(autenticarToken);

// GET /vendas
router.get("/", VendaController.listar);

// POST /vendas
router.post("/", VendaController.criar);

// GET /vendas/:id
router.get("/:id", VendaController.buscarPorId);

// PUT /vendas/:id
router.put("/:id", VendaController.atualizar);

// PATCH /vendas/:id/concluir
router.patch("/:id/concluir", VendaController.concluir);

// PATCH /vendas/:id/cancelar
router.patch("/:id/cancelar", VendaController.cancelar);

// POST /vendas/:id/pagamentos
router.post("/:id/pagamentos", VendaController.pagamento);

// DELETE /vendas/:id
router.delete("/:id", VendaController.deletar);

export default router;
