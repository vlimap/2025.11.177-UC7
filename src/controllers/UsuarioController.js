import UsuarioModel from "../models/UsuarioModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export default class UsuarioController {
  static async cadastrar(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
      }

      const existente = await UsuarioModel.buscarPorEmail(email);
      if (existente) {
        return res.status(400).json({ erro: "E-mail já cadastrado!" });
      }

      const novoUsuario = await UsuarioModel.criar({ nome, email, senha });
      return res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: novoUsuario });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ erro: "email e senha são obrigatórios" });
      }

      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta" });
      }

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
    return res.json({
      mensagem: "Acesso autorizado!",
      usuario: req.usuario
    });
  }
}
