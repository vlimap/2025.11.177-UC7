import ClienteModel from "../models/ClienteModel.js";

export default class ClienteController {
  static async criar(req, res) {
    try {
      const { nome, documento, email, telefone } = req.body;

      if (!nome || !documento) {
        return res.status(400).json({ erro: "nome e documento são obrigatórios" });
      }

      const cliente = await ClienteModel.criar({ nome, documento, email, telefone });
      return res.status(201).json({ mensagem: "Cliente criado com sucesso!", cliente });
    } catch (erro) {
      // Duplicidade de documento cai aqui (UNIQUE)
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      const clientes = await ClienteModel.listar();
      return res.json({ clientes });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }
}
