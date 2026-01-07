import express from "express";
import VendaController from "../controllers/VendaController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);

router.post("/", VendaController.criar);
router.patch("/:id/concluir", VendaController.concluir);
router.patch("/:id/cancelar", VendaController.cancelar);
router.post("/:id/pagamentos", VendaController.pagamento);

export default router;
