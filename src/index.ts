#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PG } from './config/pgadmin.config.js';
import { validateEnv } from './env.js';
import { registerTools } from './tools/index.js';

validateEnv();

const server = new McpServer({ name: PG.SERVER.NAME, version: PG.SERVER.VERSION });
registerTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(PG.SERVER.STARTUP_MESSAGE);
}

main().catch((error) => {
  console.error(PG.SERVER.FATAL_PREFIX, error);
  process.exit(1);
});
