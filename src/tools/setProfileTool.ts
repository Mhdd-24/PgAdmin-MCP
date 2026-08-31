import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PG } from '../config/pgadmin.config.js';
import {
  getActiveProfile,
  maskSecret,
  parseProfileName,
  setActiveProfile,
} from '../env.js';
import { ping } from '../services/pgQueryService.js';
import { PROFILE_HELP } from '../utils/profileArg.js';
import { toolError, toolText } from '../utils/toolResponse.js';

export function registerSetProfileTool(server: McpServer): void {
  const cfg = PG.TOOLS.SET_PROFILE;
  server.tool(
    cfg.NAME,
    cfg.DESCRIPTION,
    {
      profile: z
        .string()
        .describe('Target profile: "dev" | "qa" | "default" (aliases: development, uat)'),
      verify: z
        .boolean()
        .optional()
        .describe('If true (default), run SELECT 1 against the new profile'),
    },
    async ({ profile, verify }) => {
      try {
        const parsed = parseProfileName(profile);
        if (!parsed) {
          return toolText(PG.MESSAGES.INVALID_PROFILE, true);
        }

        const previous = getActiveProfile();
        const connection = setActiveProfile(parsed);
        const shouldVerify = verify !== false;

        const lines = [
          `Sticky session profile set: ${previous} → ${connection.profile}`,
          PROFILE_HELP,
          `- host: ${connection.host}`,
          `- port: ${connection.port}`,
          `- user: ${connection.user}`,
          `- password: ${maskSecret(connection.password)}`,
          `- defaultDatabase: ${connection.database}`,
        ];

        if (shouldVerify) {
          const health = await ping();
          lines.push(
            `- health: ${health.ok ? 'ok' : 'failed'} (SELECT 1 = ${String(health.result)})`,
          );
        }

        lines.push('Subsequent pg_* tools will use this profile until changed.');
        return toolText(lines.join('\n'));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}
