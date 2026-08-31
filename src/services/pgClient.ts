import pg from 'pg';
import {
  getActiveConnection,
  resolveConnection,
  type PgConnectionConfig,
} from '../env.js';

const { Pool } = pg;

type PoolKey = string;

const pools = new Map<PoolKey, pg.Pool>();

export interface PgClientOptions {
  /** Logical DB name on the same server (e.g. transboard). */
  database?: string;
  /** One-shot profile override: dev | qa | default. Omits → sticky session profile. */
  profile?: string;
}

function poolKey(config: PgConnectionConfig, database?: string): string {
  const db = database?.trim() || config.database;
  if (config.connectionString && !database) {
    return `url:${config.connectionString}`;
  }
  return `${config.profile}|${config.host}|${config.port}|${config.user}|${db}`;
}

function buildPoolConfig(config: PgConnectionConfig, database?: string): pg.PoolConfig {
  const db = database?.trim() || config.database;
  if (config.connectionString && !database) {
    return {
      connectionString: config.connectionString,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      max: 4,
    };
  }

  return {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: db,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    max: 4,
  };
}

export function getPool(options?: PgClientOptions | string): pg.Pool {
  // Back-compat: withClient(fn, databaseString)
  const normalized: PgClientOptions =
    typeof options === 'string' ? { database: options } : options ?? {};
  const config = normalized.profile
    ? resolveConnection(normalized.profile)
    : getActiveConnection();
  const key = poolKey(config, normalized.database);
  let pool = pools.get(key);
  if (!pool) {
    pool = new Pool(buildPoolConfig(config, normalized.database));
    pools.set(key, pool);
  }
  return pool;
}

export async function withClient<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
  options?: PgClientOptions | string,
): Promise<T> {
  const pool = getPool(options);
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function closePools(): Promise<void> {
  const entries = [...pools.entries()];
  pools.clear();
  await Promise.all(entries.map(([, pool]) => pool.end().catch(() => undefined)));
}
