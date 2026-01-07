import { query } from "../database/db.js";

export default class VeiculoModel {
  static async listar() {
    // Lista veículos do mais recente para o mais antigo.
    const sql = `
      SELECT
        id,
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
        status,
        criado_em
      FROM veiculos
      ORDER BY criado_em DESC
    `;

    const result = await query(sql, []);
    return result.rows;
  }

  static async criar(dados) {
    const {
      vin,
      marca,
      modelo,
      ano_modelo,
      cor,
      km,
      preco_compra,
      preco_venda,
      status,
    } = dados;

    // Insere um novo veículo.
    // - km default: 0
    // - status default: DISPONIVEL
    const sql = `
      INSERT INTO veiculos (
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        vin,
        marca,
        modelo,
        ano_modelo,
        cor,
        km,
        preco_compra,
        preco_venda,
        status,
        criado_em
    `;

    const params = [
      vin,
      marca,
      modelo,
      ano_modelo,
      cor,
      km ?? 0,
      preco_compra,
      preco_venda,
      status ?? "DISPONIVEL",
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }
}
