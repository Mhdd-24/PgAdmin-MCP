import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import { listTables } from '../services/pgQueryService.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerListTablesTool(server: McpServer): void {
  const cfg = PG.TOOLS.LIST_TABLES;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      schema: z.string().optional().describe('Schema name (default: public)'),
      database: z.string().optional().describe('Optional database name override'),
      profile: profileArg,
    },
    async ({ schema, database, profile }) => {
      try {
        const schemaName = schema?.trim() || 'public';
        const tables = await listTables(schemaName, database, profile);
        if (tables.length === 0) {
          return toolText(`No tables/views in schema "${schemaName}".`);
        }
        const lines = tables.map((t) => `- ${t.schema}.${t.name} (${t.type})`);
        return toolText(`Tables/views in ${schemaName} (${tables.length}):\n\n${lines.join('\n')}`);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
