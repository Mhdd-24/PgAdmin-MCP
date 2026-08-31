import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import { describeTable } from '../services/pgQueryService.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerDescribeTableTool(server: McpServer): void {
  const cfg = PG.TOOLS.DESCRIBE_TABLE;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      table: z.string().describe('Table or view name'),
      schema: z.string().optional().describe('Schema name (default: public)'),
      database: z.string().optional().describe('Optional database name override'),
      profile: profileArg,
    },
    async ({ table, schema, database, profile }) => {
      try {
        const schemaName = schema?.trim() || 'public';
        const columns = await describeTable(table.trim(), schemaName, database, profile);
        if (columns.length === 0) {
          return toolText(`No columns found for ${schemaName}.${table}.`, true);
        }
        const lines = columns.map(
          (c) =>
            `- ${c.columnName} ${c.dataType} nullable=${c.isNullable}` +
            (c.columnDefault != null ? ` default=${c.columnDefault}` : ''),
        );
        return toolText(`${schemaName}.${table} columns (${columns.length}):\n\n${lines.join('\n')}`);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
