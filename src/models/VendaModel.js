import { pool } from "../database/db.js";

export default class VendaModel {
  static async criarVenda({ veiculo_id, cliente_id, usuario_id, preco_final }) {
    // Venda é uma operação “sensível” porque mexe em mais de uma tabela.
    // Por isso usamos TRANSAÇÃO:
    // - BEGIN: começa
    // - COMMIT: confirma tudo se deu certo
    // - ROLLBACK: desfaz tudo se algo deu errado
    //
    // Também usamos "FOR UPDATE" para travar a linha do veículo e evitar
    // duas vendas simultâneas do mesmo veículo (concorrência).
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1) Verifica status do veículo
      const sqlBuscarVeiculo = `
        SELECT
          status
        FROM veiculos
        WHERE id = $1
        FOR UPDATE
      `;
      const v = await client.query(sqlBuscarVeiculo, [veiculo_id]);
      if (!v.rows[0]) throw new Error("Veículo não encontrado");
      if (v.rows[0].status !== "DISPONIVEL")
        throw new Error("Veículo não está disponível para venda");

      // 2) Marca veículo como RESERVADO
      const sqlReservarVeiculo = `
        UPDATE veiculos
        SET status = 'RESERVADO'
        WHERE id = $1
      `;
      await client.query(sqlReservarVeiculo, [veiculo_id]);

      // 3) Cria venda
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
      const paramsCriarVenda = [
        veiculo_id,
        cliente_id,
        usuario_id,
        preco_final,
      ];
      const venda = await client.query(sqlCriarVenda, paramsCriarVenda);

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

      // Travamos a venda para evitar dois processos tentando concluir/cancelar ao mesmo tempo.
      const sqlBuscarVenda = `
        SELECT
          id,
          veiculo_id,
          status
        FROM vendas
        WHERE id = $1
        FOR UPDATE
      `;
      const venda = await client.query(sqlBuscarVenda, [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CONCLUIDA")
        throw new Error("Venda já está concluída");
      if (venda.rows[0].status === "CANCELADA")
        throw new Error("Venda cancelada não pode ser concluída");

      const sqlConcluirVenda = `
        UPDATE vendas
        SET status = 'CONCLUIDA'
        WHERE id = $1
      `;
      await client.query(sqlConcluirVenda, [venda_id]);

      const sqlMarcarVeiculoVendido = `
        UPDATE veiculos
        SET status = 'VENDIDO'
        WHERE id = $1
      `;
      await client.query(sqlMarcarVeiculoVendido, [venda.rows[0].veiculo_id]);

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

      // Travamos a venda para evitar concorrência entre cancelar e concluir.
      const sqlBuscarVenda = `
        SELECT
          id,
          veiculo_id,
          status
        FROM vendas
        WHERE id = $1
        FOR UPDATE
      `;
      const venda = await client.query(sqlBuscarVenda, [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CANCELADA")
        throw new Error("Venda já está cancelada");
      if (venda.rows[0].status === "CONCLUIDA")
        throw new Error("Venda concluída não pode ser cancelada");

      const sqlCancelarVenda = `
        UPDATE vendas
        SET status = 'CANCELADA'
        WHERE id = $1
      `;
      await client.query(sqlCancelarVenda, [venda_id]);

      const sqlLiberarVeiculo = `
        UPDATE veiculos
        SET status = 'DISPONIVEL'
        WHERE id = $1
      `;
      await client.query(sqlLiberarVeiculo, [venda.rows[0].veiculo_id]);

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
    // Registrar pagamento é uma inserção simples.
    // (Aqui não abrimos transação porque é uma única operação.)
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
}
