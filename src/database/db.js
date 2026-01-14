import pg from "pg";
import dotenv from "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada no .env");
}

// Pool = gerenciador de conexões com o Postgres.
// Ele reaproveita conexões e evita abrir/fechar a cada query.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper simples para executar SQL parametrizado.
// - text: string com o SQL (use $1, $2, ...)
// - params: array com os valores na mesma ordem dos placeholders
 
// Por que usar parâmetros?
// - Evita SQL Injection
// - Deixa o SQL mais legível e seguro
export async function query(text, params) {
  return pool.query(text, params);
}
