import { query } from "../database/db.js";

export default class ClienteModel {
  static async listar() {
    // Lista clientes do mais recente para o mais antigo.
    // Usamos colunas explícitas (em vez de SELECT *) para:
    // - evitar trazer dados desnecessários
    // - deixar claro para o aluno quais campos existem
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

  static async criar({ nome, documento, email, telefone }) {
    // Insere um novo cliente.
    // $1..$4 são placeholders: os valores reais vão no array de parâmetros.
    // email/telefone são opcionais: se não vierem, enviamos NULL para o banco.
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
}
