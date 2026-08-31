import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import { listSchemas } from '../services/pgQueryService.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerListSchemasTool(server: McpServer): void {
  const cfg = PG.TOOLS.LIST_SCHEMAS;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      database: z.string().optional().describe('Optional database name override'),
      profile: profileArg,
    },
    async ({ database, profile }) => {
      try {
        const schemas = await listSchemas(database, profile);
        if (schemas.length === 0) {
          return toolText('No user schemas found.');
        }
        return toolText(`Schemas (${schemas.length}):\n\n${schemas.map((s) => `- ${s}`).join('\n')}`);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
