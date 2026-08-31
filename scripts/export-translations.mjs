import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { runQuery } from '../dist/services/pgQueryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../exports');
fs.mkdirSync(outDir, { recursive: true });

const sql = `
SELECT id, key, value, is_active, created_at, updated_at, language, tenant_id
FROM transc.translations
ORDER BY id
`;

const result = await runQuery(sql, { database: 'transboard', maxRows: 100000 });
const rows = result.rows ?? [];

console.log(`Fetched ${rows.length} rows (rowCount=${result.rowCount}, truncated=${result.truncated})`);

const sheetAll = XLSX.utils.json_to_sheet(rows);
const wbAll = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbAll, sheetAll, 'translations');
const allPath = path.join(outDir, 'transc_translations_all.xlsx');
XLSX.writeFile(wbAll, allPath);
console.log(`Wrote ${allPath}`);

/** Exact value match for duplicate detection (null kept distinct). */
function normalizeValue(v) {
  if (v === null || v === undefined) return { kind: 'null', text: null };
  return { kind: 'text', text: String(v) };
}

const groups = new Map();
for (const row of rows) {
  const n = normalizeValue(row.value);
  const key = n.kind === 'null' ? '__NULL__' : n.text;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const duplicateRows = [];
const duplicateSummary = [];
for (const [valueKey, group] of groups) {
  if (group.length < 2) continue;
  const displayValue = valueKey === '__NULL__' ? null : valueKey;
  duplicateSummary.push({
    value: displayValue,
    occurrence_count: group.length,
    distinct_keys: [...new Set(group.map((r) => r.key))].length,
    keys: [...new Set(group.map((r) => r.key))].join(' | '),
    ids: group.map((r) => r.id).join(', '),
  });
  for (const row of group) {
    duplicateRows.push({
      ...row,
      duplicate_value: displayValue,
      occurrence_count: group.length,
    });
  }
}

// Sort duplicates: by occurrence desc, then value, then key
duplicateRows.sort((a, b) => {
  if (b.occurrence_count !== a.occurrence_count) return b.occurrence_count - a.occurrence_count;
  const va = a.duplicate_value ?? '';
  const vb = b.duplicate_value ?? '';
  if (va !== vb) return String(va).localeCompare(String(vb));
  return String(a.key ?? '').localeCompare(String(b.key ?? ''));
});
duplicateSummary.sort((a, b) => b.occurrence_count - a.occurrence_count || String(a.value ?? '').localeCompare(String(b.value ?? '')));

const wbDup = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbDup, XLSX.utils.json_to_sheet(duplicateRows), 'duplicate_rows');
XLSX.utils.book_append_sheet(wbDup, XLSX.utils.json_to_sheet(duplicateSummary), 'duplicate_summary');
const dupPath = path.join(outDir, 'transc_translations_duplicate_values.xlsx');
XLSX.writeFile(wbDup, dupPath);

console.log(`Wrote ${dupPath}`);
console.log(`Duplicate value groups: ${duplicateSummary.length}`);
console.log(`Rows involved in duplicates: ${duplicateRows.length}`);
console.log(`Unique values total: ${groups.size}`);
console.log(`Unique values with no duplicates: ${groups.size - duplicateSummary.length}`);
process.exit(0);
