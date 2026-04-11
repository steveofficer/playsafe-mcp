# Extract parseMaskedSelectors to src/cli.ts

## Status
pending

## Priority
high

## Milestone
M1

## Description
The `parseMaskedSelectors` function in `src/index.ts` (lines 12–24) is pure logic but
cannot be imported in isolation because `src/index.ts` calls `main()` at module level
(line 58), which launches the MCP server and connects Playwright.

Extract `parseMaskedSelectors` into a new file `src/cli.ts` and export it as a named
export. Import it back into `src/index.ts` to preserve identical runtime behaviour.

The function signature and logic must remain byte-for-byte identical:
```ts
export function parseMaskedSelectors(argv: string[]): string[] { ... }
```

No other changes to `src/index.ts`, `src/browser.ts`, `src/masking.ts`, or
`src/tools.ts`.

## Acceptance Criteria
- [ ] Given `src/cli.ts`, when `import { parseMaskedSelectors } from './cli'` is used in
  a test, then the function is importable without launching a browser or MCP server.
- [ ] Given the refactored code, when `npm run build` is run, then TypeScript compiles
  without errors and `dist/cli.js` is emitted alongside `dist/index.js`.
- [ ] Given `dist/index.js`, when the server is started with
  `node dist/index.js --mask ".btn" --mask "#panel"`, then stderr contains
  `Masked selectors: .btn, #panel` (behaviour unchanged).
- [ ] Given `dist/index.js`, when the server is started with no `--mask` args, then
  stderr contains `No elements masked.` (behaviour unchanged).

## Dependencies
None

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
