import VeiculoModel from "../model/VeiculoModel.js";

// Controller de veículos.
// Responsável por validar entrada e chamar o Model.
export default class VeiculoController {
  static async criar(req, res) {
    try {
      const { vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda } = req.body;

      if (!vin || !marca || !modelo || !ano_modelo || !cor || preco_compra == null || preco_venda == null) {
        return res.status(400).json({
          erro: "Campos obrigatórios: vin, marca, modelo, ano_modelo, cor, preco_compra, preco_venda"
        });
      }

      const veiculo = await VeiculoModel.criar({ vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda });
      return res.status(201).json({ mensagem: "Veículo cadastrado no estoque!", veiculo });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      const veiculos = await VeiculoModel.listar();
      return res.json({ veiculos });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const veiculo = await VeiculoModel.buscarPorId(id);
      if (!veiculo) {
        return res.status(404).json({ erro: "Veículo não encontrado" });
      }

      return res.json({ veiculo });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status } = req.body;

      if (!vin || !marca || !modelo || !ano_modelo || !cor || preco_compra == null || preco_venda == null) {
        return res.status(400).json({
          erro: "Campos obrigatórios: vin, marca, modelo, ano_modelo, cor, preco_compra, preco_venda"
        });
      }

      const veiculo = await VeiculoModel.atualizar(id, {
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
        status,
      });

      if (!veiculo) {
        return res.status(404).json({ erro: "Veículo não encontrado" });
      }

      return res.json({ mensagem: "Veículo atualizado com sucesso!", veiculo });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async inativar(req, res) {
    try {
      const { id } = req.params;

      const veiculo = await VeiculoModel.inativar(id);
      if (!veiculo) {
        return res.status(404).json({ erro: "Veículo não encontrado" });
      }

      return res.json({ mensagem: "Veículo marcado como INATIVO.", veiculo });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }
}
