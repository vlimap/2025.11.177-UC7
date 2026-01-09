import ClienteModel from "../model/ClienteModel.js";

// Controller de clientes.
// Responsabilidades (didático):
// - ler dados de req (params/body)
// - validar entrada
// - chamar o Model (banco)
// - devolver resposta HTTP (status + JSON)
export default class ClienteController {
  static async criar(req, res) {
    try {
      // Dados enviados no body (JSON)
      const { nome, documento, email, telefone } = req.body;

      // Validação básica
      if (!nome || !documento) {
        return res.status(400).json({ erro: "nome e documento são obrigatórios" });
      }

      // Chama o Model para inserir no banco
      const cliente = await ClienteModel.criar({ nome, documento, email, telefone });
      return res.status(201).json({ mensagem: "Cliente criado com sucesso!", cliente });
    } catch (erro) {
      // Erros comuns aqui:
      // - Duplicidade de documento (constraint UNIQUE no banco)
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

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const cliente = await ClienteModel.buscarPorId(id);
      if (!cliente) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }

      return res.json({ cliente });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, documento, email, telefone } = req.body;

      // PUT = atualização completa (mantemos o exemplo didático simples).
      if (!nome || !documento) {
        return res.status(400).json({ erro: "nome e documento são obrigatórios" });
      }

      const cliente = await ClienteModel.atualizar(id, {
        nome,
        documento,
        email: email ?? null,
        telefone: telefone ?? null,
      });

      if (!cliente) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }

      return res.json({ mensagem: "Cliente atualizado com sucesso!", cliente });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const removido = await ClienteModel.deletar(id);
      if (!removido) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }

      return res.json({ mensagem: "Cliente removido com sucesso!" });
    } catch (erro) {
      // Se o cliente estiver referenciado em vendas, o Postgres pode bloquear o DELETE.
      return res.status(400).json({ erro: erro.message });
    }
  }
}
