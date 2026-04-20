# Integration Tests — Navigation Tools

## Status
completed

## Priority
medium

## Milestone
M3

## Description
Create `test/integration/navigation.test.ts` covering the three navigation tools:
`browser_navigate`, `browser_traverse_history`, and `browser_close`.

Lifecycle:
- `beforeAll`: start HTTP server (task 004) + start MCP client with no mask args (task 005)
- `afterAll`: disconnect MCP client + stop HTTP server
- Jest timeout for this file: 30 000 ms per test (`jest.setTimeout(30_000)`)

Test scenarios (I1–I4):

| ID | Tool | Scenario |
|----|------|---------|
| I1 | `browser_navigate` | Navigate to `test-page.html`; response text contains the URL and "Test Page" |
| I2 | `browser_traverse_history` | Navigate to test-page, then second-page; call with direction "back"; verify response or subsequent snapshot references test-page content |
| I3 | `browser_traverse_history` | After I2 sequence (back to test-page), call with direction "forward"; verify response references second-page |
| I4 | `browser_close` | Call browser_close; response text confirms closure |

All tool calls use `client.callTool({ name, arguments })` from the MCP SDK. Assert on
`result.content[0].text` (string) or `result.isError` (boolean).

## Acceptance Criteria
- [x] Given the server is running and the HTTP server is serving fixtures, when
  `browser_navigate` is called with `test-page.html` URL, then the response content
  text contains both the URL and the string "Test Page".
- [x] Given the browser has visited `test-page.html` then `second-page.html`, when
  `browser_traverse_history` is called with direction "back", then the response text is "Navigated back" (no isError).
- [x] Given the browser has gone back to `test-page.html`, when `browser_traverse_history`
  is called with direction "forward", then the response text is "Navigated forward" (no isError).
- [x] Given the browser is open, when `browser_close` is called, then the response text
  contains "Browser closed" and `isError` is falsy.
- [x] Given all four tests, when the suite completes, then no orphan processes remain
  (cleanup in afterAll runs successfully).

## Dependencies
004, 005, 006

## Implementation Notes
Created `test/integration/navigation.test.ts` covering 4 navigation tools (I1–I4). Uses `startServer` + `startMcpClient` (no masks) in `beforeAll`; `afterAll` disconnects gracefully. Tests I1–I4 run sequentially within a single describe block; I3 establishes its own complete browser history precondition for independence.

## Testing Findings
- **Overall**: PASS
- **Criterion 1** (browser_navigate → URL + "Test Page"): PASS — Test I1 in `navigation.test.ts` asserts `text.toContain(url)` and `text.toContain('Test Page')`. Passed in the suite run (4/4 tests, 0 failures).
- **Criterion 2** (browser_traverse_history (back) → "Navigated back"): PASS — Test I2 navigates test-page → second-page then calls `browser_traverse_history` with direction "back" and asserts `text.toContain('Navigated back')` with `isError` falsy. Passed.
- **Criterion 3** (browser_traverse_history (forward) → "Navigated forward"): PASS — Test I3 calls `browser_traverse_history` with direction "forward" after I2's back and asserts `text.toContain('Navigated forward')` with `isError` falsy. Passed.
- **Criterion 4** (browser_close → "Browser closed", isError falsy): PASS — Test I4 calls `browser_close` and asserts `text.toContain('Browser closed')` and `result.isError` falsy. Passed.
- **Criterion 5** (no orphan processes after suite): PASS — `afterAll` calls `mcpHandle.disconnect()` and `httpServer.stop()`. All 4 integration suites ran to completion with `--forceExit` not triggered by a hang; Jest reported clean exit.
