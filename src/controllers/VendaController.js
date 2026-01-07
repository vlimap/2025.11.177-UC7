import VendaModel from "../models/VendaModel.js";

// Controller de vendas.
// Aqui ficam as regras de entrada/saída HTTP.
// As regras de concorrência/transação ficam no Model (VendaModel).
export default class VendaController {
  static async criar(req, res) {
    try {
      const { veiculo_id, cliente_id, preco_final } = req.body;

      // Validação básica
      if (!veiculo_id || !cliente_id || preco_final == null) {
        return res
          .status(400)
          .json({
            erro: "veiculo_id, cliente_id e preco_final são obrigatórios",
          });
      }

      // req.usuario vem do middleware de autenticação.
      // Assim conseguimos registrar qual usuário (vendedor) criou a venda.
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
      // Erros comuns aqui vêm do Model (ex.: veículo não disponível)
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async concluir(req, res) {
    try {
      // id vem da URL: /vendas/:id/concluir
      await VendaModel.concluirVenda(req.params.id);
      return res.json({ mensagem: "Venda concluída com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async cancelar(req, res) {
    try {
      // id vem da URL: /vendas/:id/cancelar
      await VendaModel.cancelarVenda(req.params.id);
      return res.json({ mensagem: "Venda cancelada com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async pagamento(req, res) {
    try {
      const { metodo, valor, pago_em } = req.body;

      // Validação básica
      if (!metodo || valor == null) {
        return res
          .status(400)
          .json({ erro: "metodo e valor são obrigatórios" });
      }

      // id da venda vem da URL: /vendas/:id/pagamentos
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
}
