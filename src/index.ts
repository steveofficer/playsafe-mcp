#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { closeBrowser } from './browser.js';
import { registerTools } from './tools.js';
import { parseMaskedSelectors } from './cli.js';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const maskedSelectors = parseMaskedSelectors(argv);

  const server = new McpServer({
    name: 'playsafe-mcp',
    version: '1.0.0',
  });

  registerTools(server, maskedSelectors);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (maskedSelectors.length > 0) {
    process.stderr.write(
      `[playsafe-mcp] Server started. Masked selectors: ${maskedSelectors.join(', ')}\n`
    );
  } else {
    process.stderr.write('[playsafe-mcp] Server started. No elements masked.\n');
  }

  // Clean up on shutdown signals
  const shutdown = async () => {
    await closeBrowser();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err: unknown) => {
  process.stderr.write(`[playsafe-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
