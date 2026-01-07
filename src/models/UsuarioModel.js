import { query } from "../database/db.js";
import bcrypt from "bcryptjs";

export default class UsuarioModel {
  static async buscarPorEmail(email) {
    // Busca um usuário pelo email.
    // Aqui retornamos apenas as colunas que o sistema realmente usa.
    // (SELECT * é comum em exemplos, mas tende a esconder quais campos existem.)
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
    // Guardamos apenas o hash (resultado de uma função de criptografia para senhas).
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
}
