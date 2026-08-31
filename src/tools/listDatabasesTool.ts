import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PG } from '../config/pgadmin.config.js';
import { getActiveProfile, resolveConnection } from '../env.js';
import { listDatabases } from '../services/pgQueryService.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerListDatabasesTool(server: McpServer): void {
  const cfg = PG.TOOLS.LIST_DATABASES;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      profile: profileArg,
    },
    async ({ profile }) => {
      try {
        const c = resolveConnection(profile);
        const databases = await listDatabases(profile);
        if (databases.length === 0) {
          return toolText('No databases found.');
        }
        const lines = databases.map(
          (db) => `- ${db.name}${db.allowConnections ? '' : ' (connections disabled)'}`,
        );
        const header =
          `Databases on ${c.profile} (${c.host}:${c.port}) — sticky=${getActiveProfile()}` +
          ` (${databases.length}):\n\n`;
        return toolText(`${header}${lines.join('\n')}`);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
