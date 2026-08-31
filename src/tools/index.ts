import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerDescribeTableTool } from './describeTableTool.js';
import { registerListDatabasesTool } from './listDatabasesTool.js';
import { registerListSchemasTool } from './listSchemasTool.js';
import { registerListTablesTool } from './listTablesTool.js';
import { registerQueryTool } from './queryTool.js';
import { registerSetProfileTool } from './setProfileTool.js';
import { registerStatusTool } from './statusTool.js';

export function registerTools(server: McpServer): void {
  registerSetProfileTool(server);
  registerStatusTool(server);
  registerListDatabasesTool(server);
  registerListSchemasTool(server);
  registerListTablesTool(server);
  registerDescribeTableTool(server);
  registerQueryTool(server);
}
