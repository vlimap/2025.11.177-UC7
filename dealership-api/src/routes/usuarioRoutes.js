import express from "express";
import UsuarioController from "../controllers/UsuarioController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/cadastro", UsuarioController.cadastrar);
router.post("/login", UsuarioController.login);
router.get("/perfil", autenticarToken, UsuarioController.perfil);

export default router;
