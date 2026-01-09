import { query } from "../../../database/db.js";

// Model de Veículo.
// Centraliza todas as queries do estoque.
export default class VeiculoModel {
  static async listar() {
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

  static async buscarPorId(id) {
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
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }

  static async criar(dados) {
    const {
      vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status
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
      status ?? "DISPONIVEL"
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async atualizar(id, dados) {
    // Regra simples: não permitimos editar veículo RESERVADO/VENDIDO via PUT.
    const atual = await query(
      `SELECT status FROM veiculos WHERE id = $1`,
      [id]
    );
    if (!atual.rows[0]) return null;

    if (atual.rows[0].status === "RESERVADO") {
      throw new Error("Veículo RESERVADO não pode ser editado");
    }
    if (atual.rows[0].status === "VENDIDO") {
      throw new Error("Veículo VENDIDO não pode ser editado");
    }

    const {
      vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status
    } = dados;

    // Permitimos mudar status apenas entre DISPONIVEL e INATIVO.
    if (status && !["DISPONIVEL", "INATIVO"].includes(status)) {
      throw new Error("status inválido (use DISPONIVEL ou INATIVO)");
    }

    const sql = `
      UPDATE veiculos
      SET
        vin = $2,
        marca = $3,
        modelo = $4,
        ano_modelo = $5,
        cor = $6,
        km = $7,
        preco_compra = $8,
        preco_venda = $9,
        status = $10
      WHERE id = $1
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
      id,
      vin,
      marca,
      modelo,
      ano_modelo,
      cor,
      km ?? 0,
      preco_compra,
      preco_venda,
      status ?? atual.rows[0].status,
    ];

    const result = await query(sql, params);
    return result.rows[0] ?? null;
  }

  static async inativar(id) {
    // Soft delete: marca como INATIVO.
    const atual = await query(
      `SELECT status FROM veiculos WHERE id = $1`,
      [id]
    );
    if (!atual.rows[0]) return null;

    if (atual.rows[0].status === "RESERVADO") {
      throw new Error("Veículo RESERVADO não pode ser inativado");
    }
    if (atual.rows[0].status === "VENDIDO") {
      throw new Error("Veículo VENDIDO não pode ser inativado");
    }

    const sql = `
      UPDATE veiculos
      SET status = 'INATIVO'
      WHERE id = $1
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

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }
}
