import { PG } from '../config/pgadmin.config.js';

export function formatRowsAsText(
  rows: Record<string, unknown>[],
  fields: string[],
  truncated: boolean,
): string {
  if (rows.length === 0) {
    return PG.MESSAGES.NO_ROWS;
  }

  const json = JSON.stringify(rows, (_key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Buffer.isBuffer(value)) {
      return `\\x${value.toString('hex')}`;
    }
    return value;
  }, 2);

  const header = [
    `rows: ${rows.length}${truncated ? ' (truncated)' : ''}`,
    fields.length ? `columns: ${fields.join(', ')}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  const body = json.length > PG.LIMITS.OUTPUT_SLICE
    ? `${json.slice(0, PG.LIMITS.OUTPUT_SLICE)}\n…(output truncated)`
    : json;

  return `${header}\n\n${body}`;
}
