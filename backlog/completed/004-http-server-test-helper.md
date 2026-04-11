# HTTP Server Test Helper

## Status
completed

## Priority
high

## Milestone
M2

## Description
Create `test/helpers/http-server.ts` — a shared utility that starts a static file server
for the `test/fixtures/` directory and returns the port it bound to, along with a stop
function.

Use Node's built-in `http` module (no extra deps). Bind to port 0 (OS assigns a free
port). The server must:
- Serve files from `test/fixtures/` with correct MIME types (`text/html` for `.html`).
- Return HTTP 404 for missing files (do not crash).
- Close cleanly when `stop()` is called (all connections drained).

Export signature:
```ts
export interface TestServer {
  port: number;
  stop: () => Promise<void>;
}

export async function startServer(): Promise<TestServer>
```

Integration test lifecycle (for reference — implemented in each test suite):
```ts
let server: TestServer;
beforeAll(async () => { server = await startServer(); });
afterAll(async () => { await server.stop(); });
```

## Acceptance Criteria
- [x] Given `startServer()` is called, when the promise resolves, then `port` is a
  positive integer between 1024 and 65535.
- [x] Given a running server, when an HTTP GET request is made to
  `http://localhost:{port}/test-page.html`, then the response status is 200 and
  `Content-Type` contains `text/html`.
- [x] Given a running server, when an HTTP GET request is made to a nonexistent path,
  then the response status is 404 (server does not crash).
- [x] Given a running server, when `stop()` is called, then the returned promise
  resolves and subsequent connection attempts to the same port are refused.
- [x] Given two sequential `startServer()` calls (stop between them), then each binds
  to a valid port (no "EADDRINUSE" error).

## Dependencies
001

## Implementation Notes
- Binds to port `0` so the OS assigns a free ephemeral port; the resolved port is returned as `TestServer.port`.
- Serves files from `test/fixtures/` with `text/html; charset=utf-8` for `.html` files; all other missing or unrecognised paths return HTTP 404 without crashing.
- Path traversal is blocked: any resolved `absPath` that is neither `FIXTURES_DIR` itself nor a child of it is rejected before `fs.readFile` is called.
- `stop()` drains open connections by calling `server.closeAllConnections()` (Node ≥ 18) with a manual socket-tracking fallback, then awaits `server.close()` — guarantees the port is released before the promise resolves.
- Error listener is removed from the server immediately after a successful `listen` to prevent dangling handlers across the test suite.

## Testing Findings
- **Overall**: PASS
- **Criterion 1 (H1 — port range)**: PASS — Test `H1` asserts `Number.isInteger(server.port)`, `port >= 1024`, and `port <= 65535`. Implementation binds with `server.listen(0, '127.0.0.1', ...)` so the OS assigns an ephemeral port. Test passes in 9 ms.
- **Criterion 2 (H2 — 200 + text/html)**: PASS — Test `H2` issues a GET to `http://127.0.0.1:{port}/test-page.html` and asserts `statusCode === 200` and `contentType` matches `/text\/html/i`. Implementation serves `test/fixtures/test-page.html` (file confirmed to exist) with `Content-Type: text/html; charset=utf-8`. Note: the AC uses `localhost` but the implementation and tests both use `127.0.0.1`; functionally equivalent and the test passes.
- **Criterion 3 (H3 — 404 + no crash)**: PASS — Test `H3` requests `/this-path-does-not-exist-xyz.html`, asserts `statusCode === 404`, then follows up with a successful request to `/test-page.html` to confirm the server is still alive. Implementation returns 404 via `fs.readFile` error handler. Test passes in 4 ms.
- **Criterion 4 (H4 — stop() releases port)**: PASS — Test `H4` confirms the port is reachable via a raw TCP connect, calls `stop()`, then confirms `ECONNREFUSED`. Implementation destroys all tracked sockets and calls `server.close()`. Test passes in 3 ms.
- **Criterion 5 (H5 — no EADDRINUSE)**: PASS — Test `H5` calls `startServer()` / `stop()` twice in sequence, asserting valid port ranges for both. OS port-0 binding guarantees no reuse collision. Test passes in 1 ms.
- **Observation**: Jest reports a "worker process has failed to exit gracefully" warning after the full suite (including mcp-client tests). This is a Jest infrastructure note unrelated to http-server correctness; all 5 http-server tests complete cleanly.
