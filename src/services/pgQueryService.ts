import type pg from 'pg';
import { env } from '../env.js';
import type { PgColumnInfo, PgQueryResult } from '../interfaces/query.js';
import { assertSqlAllowed } from '../utils/sqlPolicy.js';
import { withClient, type PgClientOptions } from './pgClient.js';

function mapRows(result: pg.QueryResult): Record<string, unknown>[] {
  return result.rows as Record<string, unknown>[];
}

function asOptions(
  databaseOrOptions?: string | PgClientOptions,
  profile?: string,
): PgClientOptions {
  if (typeof databaseOrOptions === 'string' || databaseOrOptions === undefined) {
    return { database: databaseOrOptions, profile };
  }
  return {
    database: databaseOrOptions.database,
    profile: databaseOrOptions.profile ?? profile,
  };
}

export async function ping(
  database?: string,
  profile?: string,
): Promise<{ ok: boolean; result: unknown }> {
  return withClient(async (client) => {
    const res = await client.query('SELECT 1 AS ok');
    return { ok: true, result: res.rows[0]?.ok ?? 1 };
  }, asOptions(database, profile));
}

export async function listDatabases(
  profile?: string,
): Promise<Array<{ name: string; allowConnections: boolean }>> {
  return withClient(async (client) => {
    const res = await client.query<{ datname: string; datallowconn: boolean }>(
      `SELECT datname, datallowconn
       FROM pg_database
       WHERE datistemplate = false
       ORDER BY datname`,
    );
    return res.rows.map((row) => ({
      name: row.datname,
      allowConnections: row.datallowconn,
    }));
  }, { profile });
}

export async function listSchemas(database?: string, profile?: string): Promise<string[]> {
  return withClient(async (client) => {
    const res = await client.query<{ schema_name: string }>(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
         AND schema_name NOT LIKE 'pg_temp_%'
         AND schema_name NOT LIKE 'pg_toast_temp_%'
       ORDER BY schema_name`,
    );
    return res.rows.map((row) => row.schema_name);
  }, asOptions(database, profile));
}

export async function listTables(
  schema = 'public',
  database?: string,
  profile?: string,
): Promise<Array<{ schema: string; name: string; type: string }>> {
  return withClient(async (client) => {
    const res = await client.query<{ table_schema: string; table_name: string; table_type: string }>(
      `SELECT table_schema, table_name, table_type
       FROM information_schema.tables
       WHERE table_schema = $1
       ORDER BY table_type, table_name`,
      [schema],
    );
    return res.rows.map((row) => ({
      schema: row.table_schema,
      name: row.table_name,
      type: row.table_type,
    }));
  }, asOptions(database, profile));
}

export async function describeTable(
  table: string,
  schema = 'public',
  database?: string,
  profile?: string,
): Promise<PgColumnInfo[]> {
  return withClient(async (client) => {
    const res = await client.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      ordinal_position: number;
    }>(
      `SELECT column_name, data_type, is_nullable, column_default, ordinal_position
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table],
    );
    return res.rows.map((row) => ({
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable,
      columnDefault: row.column_default,
      ordinalPosition: row.ordinal_position,
    }));
  }, asOptions(database, profile));
}

export async function runQuery(
  sql: string,
  options?: { database?: string; maxRows?: number; allowWrite?: boolean; profile?: string },
): Promise<PgQueryResult> {
  const allowWrite = options?.allowWrite ?? env.allowWrite;
  assertSqlAllowed(sql, allowWrite);

  const maxRows = options?.maxRows && options.maxRows > 0 ? options.maxRows : env.maxRows;
  const timeoutMs = env.queryTimeoutMs;

  return withClient(async (client) => {
    await client.query(`SET statement_timeout = ${Number(timeoutMs)}`);
    const result = await client.query(sql);
    const allRows = mapRows(result);
    const truncated = allRows.length > maxRows;
    const rows = truncated ? allRows.slice(0, maxRows) : allRows;
    const fields = result.fields?.map((f) => f.name) ?? (rows[0] ? Object.keys(rows[0]) : []);

    return {
      rows,
      fields,
      rowCount: typeof result.rowCount === 'number' ? result.rowCount : allRows.length,
      truncated,
      command: result.command,
    };
  }, { database: options?.database, profile: options?.profile });
}
