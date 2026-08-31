import { PG } from '../config/pgadmin.config.js';

function normalizeSqlForPolicy(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:""|[^"])*"/g, '""')
    .trim()
    .replace(/\s+/g, ' ');
}

export function assertSqlAllowed(sql: string, allowWrite: boolean): void {
  const trimmed = sql?.trim();
  if (!trimmed) {
    throw new Error(PG.MESSAGES.EMPTY_SQL);
  }
  if (allowWrite) {
    return;
  }

  const normalized = normalizeSqlForPolicy(trimmed);
  const first = (normalized.split(/\s+/)[0] ?? '').toUpperCase();
  const readOnlyStarters = new Set(['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'VALUES']);

  if (!readOnlyStarters.has(first)) {
    throw new Error(PG.MESSAGES.WRITE_BLOCKED);
  }

  // Block write CTEs / hybrid statements while still allowing WITH … SELECT
  if (first === 'WITH' && /\b(INSERT|UPDATE|DELETE|MERGE)\b/i.test(normalized)) {
    throw new Error(PG.MESSAGES.WRITE_BLOCKED);
  }
}
