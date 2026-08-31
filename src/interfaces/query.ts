export interface PgQueryResult {
  rows: Record<string, unknown>[];
  fields: string[];
  rowCount: number;
  truncated: boolean;
  command?: string;
}

export interface PgColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
  ordinalPosition: number;
}
