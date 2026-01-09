import { query } from "../../../database/db.js";

// Model de Cliente.
// Responsabilidades:
// - executar SQL (queries parametrizadas)
// - não conhecer Express/req/res
export default class ClienteModel {
  static async listar() {
    // Lista clientes do mais recente para o mais antigo.
    // Usamos colunas explícitas (em vez de SELECT *) para deixar o schema claro.
    const sql = `
      SELECT
        id,
        nome,
        documento,
        email,
        telefone,
        criado_em
      FROM clientes
      ORDER BY criado_em DESC
    `;

    const result = await query(sql, []);
    return result.rows;
  }

  static async buscarPorId(id) {
    const sql = `
      SELECT
        id,
        nome,
        documento,
        email,
        telefone,
        criado_em
      FROM clientes
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }

  static async criar({ nome, documento, email, telefone }) {
    // Insere um novo cliente.
    // $1..$4 são placeholders: os valores reais vão no array de parâmetros.
    const sql = `
      INSERT INTO clientes (
        nome,
        documento,
        email,
        telefone
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nome,
        documento,
        email,
        telefone,
        criado_em
    `;

    const params = [nome, documento, email ?? null, telefone ?? null];
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async atualizar(id, { nome, documento, email, telefone }) {
    const sql = `
      UPDATE clientes
      SET
        nome = $2,
        documento = $3,
        email = $4,
        telefone = $5
      WHERE id = $1
      RETURNING
        id,
        nome,
        documento,
        email,
        telefone,
        criado_em
    `;

    const params = [id, nome, documento, email, telefone];
    const result = await query(sql, params);
    return result.rows[0] ?? null;
  }

  static async deletar(id) {
    const sql = `
      DELETE FROM clientes
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }
}
