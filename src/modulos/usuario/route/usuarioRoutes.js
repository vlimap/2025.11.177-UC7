import express from "express";
import UsuarioController from "../controller/UsuarioController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

// Router de Usuário.
// Observação: mantemos cadastro/login públicos.
// CRUD e perfil ficam protegidos por JWT.
const router = express.Router();

// POST /usuarios/cadastro
router.post("/cadastro", UsuarioController.cadastrar);

// POST /usuarios/login
router.post("/login", UsuarioController.login);

// A partir daqui, todas as rotas exigem autenticação.
router.use(autenticarToken);

// GET /usuarios/perfil
router.get("/perfil", UsuarioController.perfil);

// GET /usuarios
router.get("/", UsuarioController.listar);

// GET /usuarios/:id
router.get("/:id", UsuarioController.buscarPorId);

// PUT /usuarios/:id
router.put("/:id", UsuarioController.atualizar);

// DELETE /usuarios/:id
router.delete("/:id", UsuarioController.deletar);

export default router;
