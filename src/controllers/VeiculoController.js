import VeiculoModel from "../models/VeiculoModel.js";

export default class VeiculoController {
  static async criar(req, res) {
    try {
      const { vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda } = req.body;

      if (!vin || !marca || !modelo || !ano_modelo || !cor || preco_compra == null || preco_venda == null) {
        return res.status(400).json({ erro: "Campos obrigatórios: vin, marca, modelo, ano_modelo, cor, preco_compra, preco_venda" });
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
}
