import ClienteModel from "../models/ClienteModel.js";

// Controller de clientes.
// Observação: a autenticação já é aplicada nas rotas (/clientes) via router.use(autenticarToken).
export default class ClienteController {
  static async criar(req, res) {
    try {
      // Dados enviados no body (JSON)
      const { nome, documento, email, telefone } = req.body;

      // Validação básica
      if (!nome || !documento) {
        return res
          .status(400)
          .json({ erro: "nome e documento são obrigatórios" });
      }

      // Chama o Model para inserir no banco
      const cliente = await ClienteModel.criar({
        nome,
        documento,
        email,
        telefone,
      });
      return res
        .status(201)
        .json({ mensagem: "Cliente criado com sucesso!", cliente });
    } catch (erro) {
      // Erros comuns aqui:
      // - Duplicidade de documento (constraint UNIQUE no banco)
      // Para simplificar a didática, respondemos 400 com a mensagem do erro.
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      // Busca lista no banco
      const clientes = await ClienteModel.listar();
      return res.json({ clientes });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }
}
