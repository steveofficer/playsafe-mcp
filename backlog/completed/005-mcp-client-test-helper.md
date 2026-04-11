# MCP Client Test Helper

## Status
completed

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
- [x] Given `dist/index.js` exists (built), when `startMcpClient()` is called, then
  the returned `client` can call `client.listTools()` and the result contains exactly
  13 tools.
- [x] Given `startMcpClient(['.dangerous-btn', '#admin-panel'])`, when the client lists
  tools, then the server starts successfully (mask args are forwarded without error).
- [x] Given a connected client, when `disconnect()` is called, then the child process
  exits within 5 seconds and the promise resolves.
- [x] Given a test that calls `disconnect()` in `afterAll`, when the test suite
  completes, then no child `node` process remains running (no orphans).

## Dependencies
001

## Implementation Notes
- Spawns `node dist/index.js` via `StdioClientTransport` with `stderr: 'inherit'`; each `maskSelectors` entry is expanded to a `--mask <selector>` pair using `flatMap`.
- Captures the transport's internal `_process` reference immediately after `client.connect()` and throws a loud error if the SDK API changes and the reference is absent.
- `disconnect()` calls `client.close()` first, then `killAndWait()`: sends SIGTERM and waits for the process to exit, escalating to SIGKILL after a 5-second timeout.
- Registers a `process.once('exit', emergencyCleanup)` handler on the parent at connect time and removes it inside `disconnect()`, ensuring child processes are killed even if a test throws before `afterAll` runs.

## Testing Findings
- **Overall**: PASS
- **Criterion 1 (M1 — 13 tools)**: PASS — Four sub-tests cover this criterion. `M1: returned object exposes a Client instance` confirms the return type; `M1: listTools() resolves without throwing` confirms no error; `M1: listTools() result contains exactly 13 tools` asserts `result.tools.toHaveLength(13)` (matching the 13 `server.tool()` calls in `src/tools.ts`); `M1: each tool in the list has a name and description` validates shape. All pass. `dist/index.js` exists and was built prior to the run.
- **Criterion 2 (M2 — mask args forwarded)**: PASS — Two sub-tests cover this. `M2: server starts successfully when mask selectors are supplied` confirms `startMcpClient(['.dangerous-btn', '#admin-panel'])` resolves without error (server stderr shows `[playsafe-mcp] Server started. Masked selectors: .dangerous-btn, #admin-panel`); `M2: listTools() still returns the same 13 tools when mask args are present` confirms tool count is unaffected. Implementation converts each selector to `['--mask', selector]` pairs via `flatMap`. Both pass.
- **Criterion 3 (M3 — disconnect within 5 s)**: PASS — Two sub-tests cover this. `M3: disconnect() resolves within 5 seconds` races `handle.disconnect()` against a 5-second rejection timer and asserts the disconnect wins; measured at 358 ms. `M3: disconnect() can be awaited without throwing` asserts the promise resolves to `undefined`. Implementation calls `client.close()` then `killAndWait(proc, 5000)` with SIGTERM→SIGKILL escalation. Both pass.
- **Criterion 4 (M4 — no orphan processes)**: PASS — Two sub-tests cover this. `M4: no node dist/index.js processes remain after disconnect()` establishes a baseline via `ps aux`, starts one client, verifies the count increases, disconnects, and confirms the count returns to baseline (597 ms). `M4: starting and stopping multiple clients leaves no orphan processes` does the same with three concurrent clients (887 ms). Implementation registers a `process.once('exit', emergencyCleanup)` handler and removes it in `disconnect()` before calling `killAndWait`. Both pass.
- **Observation**: Jest emits a "worker process has failed to exit gracefully" warning after the full run. This is a known Jest/ts-jest teardown artefact (likely an open handle from the MCP SDK's transport layer after the last test suite finishes) and does not affect test correctness — the exit code is 0 and all 10 tests pass. The M4 orphan checks confirm no child `node` processes leak.
