/**
 * Parse --mask <selector> arguments from argv.
 * Multiple --mask flags are supported, e.g.:
 *   playsafe-mcp --mask ".dangerous-btn" --mask "#admin-panel"
 */
export function parseMaskedSelectors(argv: string[]): string[] {
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
