import { Pool, type QueryResult } from "pg";

let pool: Pool | null = null;
let poolReady: Promise<void> | null = null;

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.DIABOT_DB_URL;
  if (!url) {
    throw new Error("DATABASE_URL (or DIABOT_DB_URL) is required at runtime");
  }
  return url;
}

function createPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getDbUrl(), max: 4 });
  }
  return pool;
}

async function ensurePoolReady(): Promise<void> {
  createPool();
  if (!pool) return;

  if (!poolReady) {
    poolReady = pool
      .query("SELECT 1")
      .then(() => {
        console.info("[db] primary connection ready");
      })
      .catch((err: any) => {
        console.error("[db] DB_CONNECT_FAIL:", err?.message ?? err);
        poolReady = null;
        throw err;
      });
  }

  return poolReady;
}

export async function ensureDbConnection() {
  await ensurePoolReady();
}

export function getPool(): Pool {
  return createPool();
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const db = getPool();
  await ensurePoolReady();
  return db.query<T>(text, params);
}

// Fire a background readiness check so issues surface in logs early.
ensureDbConnection().catch(() => {
  /* the error is already logged inside ensurePoolReady */
});
