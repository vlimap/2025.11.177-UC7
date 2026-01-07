import { query } from "../database/db.js";
import bcrypt from "bcryptjs";

export default class UsuarioModel {
  static async buscarPorEmail(email) {
    const result = await query("SELECT * FROM usuarios WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  }

  static async criar({ nome, email, senha }) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );

    return result.rows[0];
  }
}
