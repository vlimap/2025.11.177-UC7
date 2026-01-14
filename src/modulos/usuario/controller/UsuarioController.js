import UsuarioModel from "../model/UsuarioModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Carrega JWT_SECRET e JWT_EXPIRES_IN do .env
dotenv.config();

// Controller de usuários.
// Aqui ficam as entradas HTTP (req/res) e a validação básica.
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

      // Compara senha digitada com o hash salvo no banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: "E-mail ou enha incorreta" });
      }

      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email,
          perfil: usuario.perfil
        },
          process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN
        }
      );

      return res.json({ mensagem: "Login bem-sucedido!", token });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static perfil(req, res) {
    // req.usuario é preenchido pelo middleware autenticarToken.
    return res.json({
      mensagem: "Acesso autorizado!",
      usuario: req.usuario
    });
  }

  static async listar(req, res) {
    try {
      const usuarios = await UsuarioModel.listar();
      return res.json({ usuarios });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuarioModel.buscarPorId(id);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      return res.json({ usuario });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email } = req.body;
      if (!nome || !email) {
        return res.status(400).json({ erro: "nome e email são obrigatórios" });
      }

      const existente = await UsuarioModel.buscarPorEmail(email);
      if (existente && existente.id !== id) {
        return res.status(400).json({ erro: "E-mail já cadastrado!" });
      }

      const usuario = await UsuarioModel.atualizar(id, { nome, email });
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      return res.json({ mensagem: "Usuário atualizado com sucesso!", usuario });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UsuarioModel.deletar(id);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      return res.json({ mensagem: "Usuário removido com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }
}
