import VendaModel from "../model/VendaModel.js";

// Controller de vendas.
// Regras de concorrência/transação ficam no Model.
export default class VendaController {
  static async listar(req, res) {
    try {
      const vendas = await VendaModel.listar();
      return res.json({ vendas });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async criar(req, res) {
    try {
      const { veiculo_id, cliente_id, preco_final } = req.body;

      if (!veiculo_id || !cliente_id || preco_final == null) {
        return res
          .status(400)
          .json({
            erro: "veiculo_id, cliente_id e preco_final são obrigatórios",
          });
      }

      const venda = await VendaModel.criarVenda({
        veiculo_id,
        cliente_id,
        usuario_id: req.usuario.id,
        preco_final,
      });

      return res
        .status(201)
        .json({ mensagem: "Venda criada (negociação iniciada).", venda });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async concluir(req, res) {
    try {
      await VendaModel.concluirVenda(req.params.id);
      return res.json({ mensagem: "Venda concluída com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async cancelar(req, res) {
    try {
      await VendaModel.cancelarVenda(req.params.id);
      return res.json({ mensagem: "Venda cancelada com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async pagamento(req, res) {
    try {
      const { metodo, valor, pago_em } = req.body;

      if (!metodo || valor == null) {
        return res
          .status(400)
          .json({ erro: "metodo e valor são obrigatórios" });
      }

      const pagamento = await VendaModel.adicionarPagamento({
        venda_id: req.params.id,
        metodo,
        valor,
        pago_em,
      });

      return res
        .status(201)
        .json({ mensagem: "Pagamento registrado!", pagamento });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const venda = await VendaModel.buscarPorId(id);
      if (!venda) {
        return res.status(404).json({ erro: "Venda não encontrada" });
      }

      return res.json({ venda });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { preco_final } = req.body;
      if (preco_final == null) {
        return res.status(400).json({ erro: "preco_final é obrigatório" });
      }

      const venda = await VendaModel.atualizarPrecoFinal(id, preco_final);
      return res.json({ mensagem: "Venda atualizada com sucesso!", venda });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const ok = await VendaModel.deletar(id);
      if (!ok) {
        return res.status(404).json({ erro: "Venda não encontrada" });
      }

      return res.json({ mensagem: "Venda removida com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }
}
