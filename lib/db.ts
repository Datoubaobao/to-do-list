import { Pool, PoolClient, QueryResult } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __PG_POOL__: Pool | undefined;
}

let pool: Pool;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your PostgreSQL connection string."
    );
  }

  // 简单判断是否需要 SSL（例如 RDS 使用 sslmode=require）
  const useSSL =
    /sslmode=require/i.test(connectionString) ||
    process.env.DB_SSL === "true";

  if (!global.__PG_POOL__) {
    global.__PG_POOL__ = new Pool({
      connectionString,
      ssl: useSSL
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
                ? false
                : true,
          }
        : undefined,
    });
  }

  pool = global.__PG_POOL__;
  return pool;
}

export async function getDbClient(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await getDbClient();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}


