import express from "express";
import ClienteController from "../controllers/ClienteController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);
router.post("/", ClienteController.criar);
router.get("/", ClienteController.listar);

export default router;
