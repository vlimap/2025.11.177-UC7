import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada no .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper: executar query (mantém padrão único)
export async function query(text, params) {
  return pool.query(text, params);
}
