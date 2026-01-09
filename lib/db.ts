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

  // 解析 DATABASE_URL 以判断是否需要 SSL
  // 使用正则表达式提取 host 和 sslmode 参数（兼容各种 URL 格式）
  const hostMatch = connectionString.match(/@([^:/]+)/);
  const host = hostMatch ? hostMatch[1] : "";
  const sslmodeMatch = connectionString.match(/[?&]sslmode=([^&]+)/i);
  const sslmode = sslmodeMatch ? sslmodeMatch[1].toLowerCase() : null;

  // SSL 配置逻辑：
  // 1. 如果 URL 中包含 sslmode=disable => 强制不启用 SSL
  // 2. 如果是 localhost/127.0.0.1 => 默认不启用 SSL（本地/SSH 隧道）
  // 3. 否则（远程数据库）=> 默认启用 SSL（生产环境）
  let useSSL: boolean | { rejectUnauthorized: boolean } = false;

  if (sslmode === "disable") {
    // 明确禁用 SSL
    useSSL = false;
  } else if (host === "localhost" || host === "127.0.0.1") {
    // 本地连接默认不启用 SSL（避免某些本地库不支持 SSL）
    useSSL = false;
  } else {
    // 远程数据库默认启用 SSL（生产环境/云数据库）
    // 使用 rejectUnauthorized: false 以兼容云厂商/自签证书
    // 注意：在生产环境中，如果数据库使用受信任的 CA 签发的证书，
    // 可以改为 rejectUnauthorized: true 以提高安全性
    useSSL = {
      rejectUnauthorized: false,
    };
  }

  // 如果 URL 中包含 sslmode=require/verify-full 等，强制启用 SSL
  if (sslmode && sslmode !== "disable" && typeof useSSL === "boolean") {
    useSSL = {
      rejectUnauthorized: sslmode === "verify-full" || sslmode === "verify-ca",
    };
  }

  if (!global.__PG_POOL__) {
    global.__PG_POOL__ = new Pool({
      connectionString,
      ssl: useSSL || undefined,
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


