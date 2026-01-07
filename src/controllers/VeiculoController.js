import VeiculoModel from "../models/VeiculoModel.js";

// Controller de veículos.
// Responsável por validar entrada e chamar o Model.
export default class VeiculoController {
  static async criar(req, res) {
    try {
      // Campos do veículo vindos no body (JSON)
      const {
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
      } = req.body;

      // Validação: campos essenciais para cadastrar no estoque
      if (
        !vin ||
        !marca ||
        !modelo ||
        !ano_modelo ||
        !cor ||
        preco_compra == null ||
        preco_venda == null
      ) {
        return res
          .status(400)
          .json({
            erro: "Campos obrigatórios: vin, marca, modelo, ano_modelo, cor, preco_compra, preco_venda",
          });
      }

      // Chama o Model para inserir no banco
      const veiculo = await VeiculoModel.criar({
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
      });
      return res
        .status(201)
        .json({ mensagem: "Veículo cadastrado no estoque!", veiculo });
    } catch (erro) {
      // Normalmente erros de validação de banco (ex.: vin duplicado) caem aqui
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      // Busca lista no banco
      const veiculos = await VeiculoModel.listar();
      return res.json({ veiculos });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }
}
