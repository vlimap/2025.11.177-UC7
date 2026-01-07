import UsuarioModel from "../models/UsuarioModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Carrega JWT_SECRET e JWT_EXPIRES_IN do .env
dotenv.config();

// Controller = camada HTTP.
// Responsabilidades típicas:
// - ler req (params/body/headers)
// - validar entrada
// - chamar a camada de Model (banco)
// - retornar resposta com status code e JSON
export default class UsuarioController {
  static async cadastrar(req, res) {
    try {
      // Dados do corpo da requisição (JSON)
      const { nome, email, senha } = req.body;

      // Validação mínima: evita gravar registros incompletos
      if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
      }

      // Regra de negócio: email deve ser único
      const existente = await UsuarioModel.buscarPorEmail(email);
      if (existente) {
        return res.status(400).json({ erro: "E-mail já cadastrado!" });
      }

      // Cria o usuário no banco
      const novoUsuario = await UsuarioModel.criar({ nome, email, senha });
      return res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: novoUsuario });
    } catch (erro) {
      // Erro inesperado (ex.: falha no banco)
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Validação mínima
      if (!email || !senha) {
        return res.status(400).json({ erro: "email e senha são obrigatórios" });
      }

      // 1) Busca usuário no banco
      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // 2) Compara senha digitada com o hash salvo no banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta" });
      }

      // 3) Gera o JWT.
      // O payload do token é o que vai parar em req.usuario (no middleware).
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "1h" }
      );

      return res.json({ mensagem: "Login bem-sucedido!", token });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static perfil(req, res) {
    // req.usuario é preenchido pelo middleware autenticarToken.
    // Se chegou aqui, o token é válido.
    return res.json({
      mensagem: "Acesso autorizado!",
      usuario: req.usuario
    });
  }
}
