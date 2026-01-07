import { pool } from "../database/db.js";

export default class VendaModel {
  static async criarVenda({ veiculo_id, cliente_id, usuario_id, preco_final }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1) Verifica status do veículo
      const v = await client.query("SELECT status FROM veiculos WHERE id = $1 FOR UPDATE", [veiculo_id]);
      if (!v.rows[0]) throw new Error("Veículo não encontrado");
      if (v.rows[0].status !== "DISPONIVEL") throw new Error("Veículo não está disponível para venda");

      // 2) Marca veículo como RESERVADO
      await client.query("UPDATE veiculos SET status = 'RESERVADO' WHERE id = $1", [veiculo_id]);

      // 3) Cria venda
      const venda = await client.query(
        `INSERT INTO vendas (veiculo_id, cliente_id, usuario_id, status, preco_final)
         VALUES ($1, $2, $3, 'NEGOCIACAO', $4)
         RETURNING id, veiculo_id, cliente_id, usuario_id, status, preco_final, criada_em`,
        [veiculo_id, cliente_id, usuario_id, preco_final]
      );

      await client.query("COMMIT");
      return venda.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async concluirVenda(venda_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query("SELECT id, veiculo_id, status FROM vendas WHERE id = $1 FOR UPDATE", [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda já está concluída");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda cancelada não pode ser concluída");

      await client.query("UPDATE vendas SET status = 'CONCLUIDA' WHERE id = $1", [venda_id]);
      await client.query("UPDATE veiculos SET status = 'VENDIDO' WHERE id = $1", [venda.rows[0].veiculo_id]);

      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async cancelarVenda(venda_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query("SELECT id, veiculo_id, status FROM vendas WHERE id = $1 FOR UPDATE", [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda já está cancelada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda concluída não pode ser cancelada");

      await client.query("UPDATE vendas SET status = 'CANCELADA' WHERE id = $1", [venda_id]);
      await client.query("UPDATE veiculos SET status = 'DISPONIVEL' WHERE id = $1", [venda.rows[0].veiculo_id]);

      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async adicionarPagamento({ venda_id, metodo, valor, pago_em }) {
    const result = await pool.query(
      `INSERT INTO pagamentos_venda (venda_id, metodo, valor, pago_em)
       VALUES ($1, $2, $3, $4)
       RETURNING id, venda_id, metodo, valor, pago_em`,
      [venda_id, metodo, valor, pago_em ?? null]
    );

    return result.rows[0];
  }
}
