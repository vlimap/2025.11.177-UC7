import express from "express";
import VeiculoController from "../controllers/VeiculoController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rotas de veículo são protegidas.
router.use(autenticarToken);

// POST /veiculos
router.post("/", VeiculoController.criar);

// GET /veiculos
router.get("/", VeiculoController.listar);

export default router;
