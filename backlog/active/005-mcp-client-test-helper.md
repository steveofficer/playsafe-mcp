# MCP Client Test Helper

## Status
pending

## Priority
high

## Milestone
M2

## Description
Create `test/helpers/mcp-client.ts` — a shared utility that spawns the built MCP server
process (`node dist/index.js`) with optional `--mask` arguments, connects to it via the
MCP SDK Client + StdioClientTransport, and returns the connected client together with a
cleanup function.

Requirements:
- Spawn the process with `stdio: ['pipe', 'pipe', 'inherit']` so the parent can pipe
  stdin/stdout while stderr flows to the terminal for debugging.
- Use `@modelcontextprotocol/sdk/client/index.js` (`Client`) and
  `@modelcontextprotocol/sdk/client/stdio.js` (`StdioClientTransport`).
- `disconnect()` must: call `client.close()`, then send SIGTERM to the child process,
  then wait for the process to exit (with a 5-second hard kill fallback).
- The helper must not leave orphan processes if the test throws before `disconnect()` is
  called — tests are responsible for calling it in `afterAll`.

Export signature:
```ts
export interface McpTestClient {
  client: Client;
  disconnect: () => Promise<void>;
}

export async function startMcpClient(maskSelectors?: string[]): Promise<McpTestClient>
```

`maskSelectors` is an array of selector strings; the helper converts each to
`['--mask', selector]` pairs in the argv.

## Acceptance Criteria
- [ ] Given `dist/index.js` exists (built), when `startMcpClient()` is called, then
  the returned `client` can call `client.listTools()` and the result contains exactly
  13 tools.
- [ ] Given `startMcpClient(['.dangerous-btn', '#admin-panel'])`, when the client lists
  tools, then the server starts successfully (mask args are forwarded without error).
- [ ] Given a connected client, when `disconnect()` is called, then the child process
  exits within 5 seconds and the promise resolves.
- [ ] Given a test that calls `disconnect()` in `afterAll`, when the test suite
  completes, then no child `node` process remains running (no orphans).

## Dependencies
001

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
