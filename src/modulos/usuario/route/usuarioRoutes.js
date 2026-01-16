import express from "express";
import UsuarioController from "../controller/UsuarioController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";
import autorization from "../../../middlewares/autorizationMiddleware.js";

// Router de Usuário.
// Observação: mantemos cadastro/login públicos.
// CRUD e perfil ficam protegidos por JWT.
const router = express.Router();

// POST /usuarios/cadastro - rotas publicas
router.post("/cadastro", UsuarioController.cadastrar);

// POST /usuarios/login - rotas publicas
router.post("/login", UsuarioController.login);

// GET /usuarios/perfil - rota privada
router.get("/perfil", autenticarToken, UsuarioController.perfil);

// GET /usuarios
router.get("/", autenticarToken, autorization["admin"] , UsuarioController.listar);

// GET /usuarios/3
router.get("/:id", autenticarToken, autorization["admin"], UsuarioController.buscarPorId);

// PUT /usuarios/:id
router.put("/:id", UsuarioController.atualizar);

// DELETE /usuarios/:id
router.delete("/:id", UsuarioController.deletar);

export default router;
