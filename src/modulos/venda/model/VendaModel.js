import { pool } from "../../../database/db.js";

// Model de Venda.
// Aqui ficam as regras com transações e travas (FOR UPDATE).
export default class VendaModel {
  static async listar() {
    const sql = `
      SELECT
        v.id,
        v.veiculo_id,
        v.cliente_id,
        v.usuario_id,
        v.status,
        v.preco_final,
        v.criada_em,
        c.nome AS cliente_nome,
        u.nome AS usuario_nome,
        ve.marca AS veiculo_marca,
        ve.modelo AS veiculo_modelo,
        ve.vin AS veiculo_vin
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      JOIN usuarios u ON u.id = v.usuario_id
      JOIN veiculos ve ON ve.id = v.veiculo_id
      ORDER BY v.criada_em DESC
    `;

    const result = await pool.query(sql, []);
    return result.rows;
  }

  static async buscarPorId(venda_id) {
    const sqlVenda = `
      SELECT
        v.id,
        v.veiculo_id,
        v.cliente_id,
        v.usuario_id,
        v.status,
        v.preco_final,
        v.criada_em,
        c.nome AS cliente_nome,
        c.documento AS cliente_documento,
        c.email AS cliente_email,
        c.telefone AS cliente_telefone,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        ve.vin AS veiculo_vin,
        ve.marca AS veiculo_marca,
        ve.modelo AS veiculo_modelo,
        ve.ano_modelo AS veiculo_ano_modelo,
        ve.cor AS veiculo_cor,
        ve.km AS veiculo_km,
        ve.status AS veiculo_status
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      JOIN usuarios u ON u.id = v.usuario_id
      JOIN veiculos ve ON ve.id = v.veiculo_id
      WHERE v.id = $1
    `;

    const vendaResult = await pool.query(sqlVenda, [venda_id]);
    if (!vendaResult.rows[0]) return null;

    const sqlPagamentos = `
      SELECT
        id,
        venda_id,
        metodo,
        valor,
        pago_em
      FROM pagamentos_venda
      WHERE venda_id = $1
      ORDER BY pago_em NULLS LAST
    `;
    const pagamentos = await pool.query(sqlPagamentos, [venda_id]);

    // Retorno didático (sem "..." / spread):
    // pegamos a venda e adicionamos a lista de pagamentos.
    const venda = vendaResult.rows[0];
    venda.pagamentos = pagamentos.rows;
    return venda;
  }

  static async criarVenda({ veiculo_id, cliente_id, usuario_id, preco_final }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Travamos a linha do veículo para evitar duas vendas simultâneas.
      const sqlBuscarVeiculo = `
        SELECT status
        FROM veiculos
        WHERE id = $1
        FOR UPDATE
      `;
      const v = await client.query(sqlBuscarVeiculo, [veiculo_id]);
      if (!v.rows[0]) throw new Error("Veículo não encontrado");
      if (v.rows[0].status !== "DISPONIVEL") {
        throw new Error("Veículo não está disponível para venda");
      }

      // Reserva o veículo (vira RESERVADO enquanto a negociação existe)
      await client.query(
        `UPDATE veiculos SET status = 'RESERVADO' WHERE id = $1`,
        [veiculo_id]
      );

      const sqlCriarVenda = `
        INSERT INTO vendas (
          veiculo_id,
          cliente_id,
          usuario_id,
          status,
          preco_final
        )
        VALUES ($1, $2, $3, 'NEGOCIACAO', $4)
        RETURNING
          id,
          veiculo_id,
          cliente_id,
          usuario_id,
          status,
          preco_final,
          criada_em
      `;
      const venda = await client.query(sqlCriarVenda, [
        veiculo_id,
        cliente_id,
        usuario_id,
        preco_final,
      ]);

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

      const venda = await client.query(
        `
          SELECT id, veiculo_id, status
          FROM vendas
          WHERE id = $1
          FOR UPDATE
        `,
        [venda_id]
      );
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda já está concluída");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda cancelada não pode ser concluída");

      await client.query(`UPDATE vendas SET status = 'CONCLUIDA' WHERE id = $1`, [venda_id]);
      await client.query(`UPDATE veiculos SET status = 'VENDIDO' WHERE id = $1`, [venda.rows[0].veiculo_id]);

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

      const venda = await client.query(
        `
          SELECT id, veiculo_id, status
          FROM vendas
          WHERE id = $1
          FOR UPDATE
        `,
        [venda_id]
      );
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda já está cancelada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda concluída não pode ser cancelada");

      await client.query(`UPDATE vendas SET status = 'CANCELADA' WHERE id = $1`, [venda_id]);
      await client.query(`UPDATE veiculos SET status = 'DISPONIVEL' WHERE id = $1`, [venda.rows[0].veiculo_id]);

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
    const sql = `
      INSERT INTO pagamentos_venda (
        venda_id,
        metodo,
        valor,
        pago_em
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        venda_id,
        metodo,
        valor,
        pago_em
    `;
    const params = [venda_id, metodo, valor, pago_em ?? null];
    const result = await pool.query(sql, params);
    return result.rows[0];
  }

  static async atualizarPrecoFinal(venda_id, preco_final) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query(
        `
          SELECT id, status
          FROM vendas
          WHERE id = $1
          FOR UPDATE
        `,
        [venda_id]
      );
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status !== "NEGOCIACAO") {
        throw new Error("Só é possível editar preco_final enquanto a venda está em NEGOCIACAO");
      }

      const atualizado = await client.query(
        `
          UPDATE vendas
          SET preco_final = $2
          WHERE id = $1
          RETURNING id, veiculo_id, cliente_id, usuario_id, status, preco_final, criada_em
        `,
        [venda_id, preco_final]
      );

      await client.query("COMMIT");
      return atualizado.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async deletar(venda_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query(
        `
          SELECT id, status
          FROM vendas
          WHERE id = $1
          FOR UPDATE
        `,
        [venda_id]
      );
      if (!venda.rows[0]) return false;

      if (venda.rows[0].status === "CONCLUIDA") {
        throw new Error("Venda CONCLUIDA não pode ser removida");
      }
      if (venda.rows[0].status !== "CANCELADA") {
        throw new Error("Para remover uma venda, primeiro cancele (status CANCELADA)");
      }

      const pagamentos = await client.query(
        `SELECT COUNT(1)::int AS total FROM pagamentos_venda WHERE venda_id = $1`,
        [venda_id]
      );
      if ((pagamentos.rows[0]?.total ?? 0) > 0) {
        throw new Error("Não é permitido remover venda com pagamentos registrados");
      }

      await client.query(`DELETE FROM vendas WHERE id = $1`, [venda_id]);
      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
