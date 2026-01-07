import express from "express";
import VeiculoController from "../controllers/VeiculoController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);
router.post("/", VeiculoController.criar);
router.get("/", VeiculoController.listar);

export default router;
