import { query } from "../database/db.js";

export default class ClienteModel {
  static async listar() {
    const result = await query(
      "SELECT id, nome, documento, email, telefone, criado_em FROM clientes ORDER BY criado_em DESC",
      []
    );
    return result.rows;
  }

  static async criar({ nome, documento, email, telefone }) {
    const result = await query(
      `INSERT INTO clientes (nome, documento, email, telefone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, documento, email, telefone, criado_em`,
      [nome, documento, email ?? null, telefone ?? null]
    );
    return result.rows[0];
  }
}
