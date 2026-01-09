import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

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

  // 解析 DATABASE_URL 提取 host，判断是否需要 SSL
  // 使用正则表达式提取 host（兼容各种 URL 格式）
  const hostMatch = connectionString.match(/@([^:/]+)/);
  const host = hostMatch ? hostMatch[1] : "";

  // SSL 配置逻辑（简化版）：
  // - localhost/127.0.0.1 => 不启用 SSL（SSH 隧道场景）
  // - 其他所有 host（包括 172.*、公网域名等）=> 强制启用 SSL
  let sslConfig: { rejectUnauthorized: boolean } | undefined;

  if (host === "localhost" || host === "127.0.0.1") {
    // 本地连接不启用 SSL（SSH 隧道本地转发）
    sslConfig = undefined;
  } else {
    // 远程数据库（172.* 或公网域名）强制启用 SSL
    // 使用 rejectUnauthorized: false 以兼容云厂商/自签证书
    sslConfig = {
      rejectUnauthorized: false,
    };
  }

  if (!global.__PG_POOL__) {
    global.__PG_POOL__ = new Pool({
      connectionString,
      // 显式传入 ssl 配置，确保 pg 客户端使用加密连接
      ssl: sslConfig,
    });
  }

  pool = global.__PG_POOL__;
  return pool;
}

export async function getDbClient(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
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


