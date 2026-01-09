import { query } from "../../../database/db.js";
import bcrypt from "bcryptjs";

// Model de Usuário.
// Observação: nunca retornamos senha_hash nos métodos de listagem/detalhe.
export default class UsuarioModel {
  static async listar() {
    const sql = `
      SELECT
        id,
        nome,
        email,
        criado_em
      FROM usuarios
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
        email,
        criado_em
      FROM usuarios
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }

  static async buscarPorEmail(email) {
    // Para login, precisamos do senha_hash.
    const sql = `
      SELECT
        id,
        nome,
        email,
        senha_hash,
        criado_em
      FROM usuarios
      WHERE email = $1
    `;

    const result = await query(sql, [email]);
    return result.rows[0] ?? null;
  }

  static async criar({ nome, email, senha }) {
    // Nunca salvamos a senha “pura” no banco.
    const senhaHash = await bcrypt.hash(senha, 10);

    const sql = `
      INSERT INTO usuarios (
        nome,
        email,
        senha_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        nome,
        email,
        criado_em
    `;

    const params = [nome, email, senhaHash];
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async atualizar(id, { nome, email }) {
    const sql = `
      UPDATE usuarios
      SET
        nome = $2,
        email = $3
      WHERE id = $1
      RETURNING
        id,
        nome,
        email,
        criado_em
    `;

    const result = await query(sql, [id, nome, email]);
    return result.rows[0] ?? null;
  }

  static async deletar(id) {
    const sql = `
      DELETE FROM usuarios
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(sql, [id]);
    return result.rows[0] ?? null;
  }
}
