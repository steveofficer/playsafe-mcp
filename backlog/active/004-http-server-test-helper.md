# HTTP Server Test Helper

## Status
pending

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
- [ ] Given `startServer()` is called, when the promise resolves, then `port` is a
  positive integer between 1024 and 65535.
- [ ] Given a running server, when an HTTP GET request is made to
  `http://localhost:{port}/test-page.html`, then the response status is 200 and
  `Content-Type` contains `text/html`.
- [ ] Given a running server, when an HTTP GET request is made to a nonexistent path,
  then the response status is 404 (server does not crash).
- [ ] Given a running server, when `stop()` is called, then the returned promise
  resolves and subsequent connection attempts to the same port are refused.
- [ ] Given two sequential `startServer()` calls (stop between them), then each binds
  to a valid port (no "EADDRINUSE" error).

## Dependencies
001

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
