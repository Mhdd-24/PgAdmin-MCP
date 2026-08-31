import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import { env, getActiveProfile, maskSecret, resolveConnection } from '../env.js';
import { ping } from '../services/pgQueryService.js';
import { profileArg } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerStatusTool(server: McpServer): void {
  const cfg = PG.TOOLS.STATUS;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      database: z.string().optional().describe('Optional database override for the health check'),
      profile: profileArg,
    },
    async ({ database, profile }) => {
      try {
        const c = resolveConnection(profile);
        const health = await ping(database, profile);
        const sticky = getActiveProfile();
        const lines = [
          'pgAdmin MCP status:',
          `- stickySessionProfile: ${sticky}`,
          `- usingProfile: ${c.profile}${profile ? ' (one-shot override)' : ''}`,
          `- host: ${c.host}`,
          `- port: ${c.port}`,
          `- user: ${c.user}`,
          `- password: ${maskSecret(c.password)}`,
          `- database: ${database?.trim() || c.database}`,
          `- connectionString: ${c.connectionString ? '(set)' : '(not set)'}`,
          `- allowWrite: ${env.allowWrite}`,
          `- queryTimeoutMs: ${env.queryTimeoutMs}`,
          `- maxRows: ${env.maxRows}`,
          `- startupProfile (mcp.json PG_PROFILE): ${env.startupProfile}`,
          `- health: ${health.ok ? 'ok' : 'failed'} (SELECT 1 = ${String(health.result)})`,
        ];
        return toolText(lines.join('\n'));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
