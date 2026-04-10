#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { closeBrowser } from './browser.js';
import { registerTools } from './tools.js';

/**
 * Parse --mask <selector> arguments from argv.
 * Multiple --mask flags are supported, e.g.:
 *   playsafe-mcp --mask ".dangerous-btn" --mask "#admin-panel"
 */
function parseMaskedSelectors(argv: string[]): string[] {
  const masked: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--mask' && i + 1 < argv.length) {
      const selector = argv[i + 1].trim();
      if (selector) {
        masked.push(selector);
      }
      i++; // skip next arg (the selector value)
    }
  }
  return masked;
}

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
