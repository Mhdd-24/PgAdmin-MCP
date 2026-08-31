import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import { getActiveProfile, resolveConnection } from '../env.js';
import { runQuery } from '../services/pgQueryService.js';
import { formatRowsAsText } from '../utils/formatRows.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerQueryTool(server: McpServer): void {
  const cfg = PG.TOOLS.QUERY;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      sql: z.string().describe('SQL statement to execute'),
      database: z.string().optional().describe('Optional database name override'),
      maxRows: z.number().int().positive().optional().describe('Max rows to return (default from PG_MAX_ROWS)'),
      profile: profileArg,
    },
    async ({ sql, database, maxRows, profile }) => {
      try {
        const c = resolveConnection(profile);
        const result = await runQuery(sql, { database, maxRows, profile });
        const meta = [
          `profile: ${c.profile} (sticky=${getActiveProfile()}${profile ? ', one-shot override' : ''})`,
          `host: ${c.host}`,
          `database: ${database?.trim() || c.database}`,
          result.command ? `command: ${result.command}` : undefined,
          `rowCount: ${result.rowCount}`,
        ]
          .filter(Boolean)
          .join('\n');
        const body = formatRowsAsText(result.rows, result.fields, result.truncated);
        return toolText(`${meta}\n\n${body}`);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
