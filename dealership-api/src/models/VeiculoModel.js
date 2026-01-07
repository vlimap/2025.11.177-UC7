import { query } from "../database/db.js";

export default class VeiculoModel {
  static async listar() {
    const result = await query(
      `SELECT id, vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status, criado_em
       FROM veiculos
       ORDER BY criado_em DESC`,
      []
    );
    return result.rows;
  }

  static async criar(dados) {
    const {
      vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status
    } = dados;

    const result = await query(
      `INSERT INTO veiculos (vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status, criado_em`,
      [vin, marca, modelo, ano_modelo, cor, km ?? 0, preco_compra, preco_venda, status ?? "DISPONIVEL"]
    );
    return result.rows[0];
  }
}
