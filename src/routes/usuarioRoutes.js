import express from "express";
import UsuarioController from "../controllers/UsuarioController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

// Router = um "mini app" do Express.
// Mantém as rotas organizadas por assunto (usuários, clientes, etc.).
const router = express.Router();

// POST /usuarios/cadastro
// - cria um usuário novo
router.post("/cadastro", UsuarioController.cadastrar);

// POST /usuarios/login
// - valida credenciais e retorna um JWT
router.post("/login", UsuarioController.login);

// GET /usuarios/perfil
// - rota protegida: só acessa se tiver token válido
router.get("/perfil", autenticarToken, UsuarioController.perfil);

export default router;
