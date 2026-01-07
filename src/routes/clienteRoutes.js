import express from "express";
import ClienteController from "../controllers/ClienteController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tudo abaixo exige autenticação.
// Em vez de repetir autenticarToken em cada rota, usamos router.use.
router.use(autenticarToken);

// POST /clientes
router.post("/", ClienteController.criar);

// GET /clientes
router.get("/", ClienteController.listar);

export default router;
