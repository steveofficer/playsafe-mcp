# Integration Tests — Content Tools (No Masking)

## Status
completed

## Priority
medium

## Milestone
M3

## Description
Create `test/integration/content-tools.test.ts` covering the three content/observation
tools: `browser_screenshot`, `browser_snapshot`, and `browser_get_page_content`.

The MCP server is started with **no `--mask` arguments** so all elements are visible.

Lifecycle:
- `beforeAll`: start HTTP server + start MCP client (no masks) + navigate to `test-page.html`
- `afterAll`: disconnect client + stop HTTP server
- Jest timeout: 30 000 ms per test

Test scenarios (I5–I7):

| ID | Tool | Assertion |
|----|------|-----------|
| I5 | `browser_screenshot` | Response `content[0]` has `type === 'image'`, `mimeType === 'image/png'`, and a non-empty base64 `data` string |
| I6 | `browser_snapshot` | Response text is valid JSON; parsed object is non-null and contains recognisable page structure (e.g. the string "Login" appears somewhere in the JSON) |
| I7 | `browser_get_page_content` | Response text contains the literal string `.dangerous-btn` (element is present because masking is off) and contains `#admin-panel` |

## Acceptance Criteria
- [x] Given the browser is on `test-page.html` (no masking), when `browser_screenshot`
  is called, then `result.content[0].type` is `'image'`, `result.content[0].mimeType`
  is `'image/png'`, and `result.content[0].data` is a non-empty string.
- [x] Given the browser is on `test-page.html` (no masking), when `browser_snapshot`
  is called, then the response text can be parsed with `JSON.parse` without throwing and
  the resulting object is non-null.
- [x] Given `browser_snapshot` result, when the JSON string is inspected, then the
  string "Login" appears (confirming #login-btn content is included).
- [x] Given the browser is on `test-page.html` (no masking), when
  `browser_get_page_content` is called, then the response text contains the substring
  `dangerous-btn` (element not stripped when masking is off).
- [x] Given `browser_get_page_content` result with no masks, when the HTML is inspected,
  then the substring `admin-panel` is present.

## Dependencies
004, 005, 006

## Implementation Notes
Created `test/integration/content-tools.test.ts` covering 3 content tools (I5–I7) with no masking. Navigates to test-page.html in `beforeAll`; I7 split into two tests (one per selector) for precise failure reporting.

## Testing Findings
- **Overall**: PASS
- **Criterion 1** (screenshot → image, image/png, non-empty data): PASS — Test I5 asserts `item.type === 'image'`, `item.mimeType === 'image/png'`, `typeof item.data === 'string'`, and `item.data.length > 0`. Passed.
- **Criterion 2** (snapshot → valid non-null JSON): PASS — Test I6 wraps `JSON.parse(rawText)` in `expect(...).not.toThrow()` and asserts `parsed` is not null. Passed.
- **Criterion 3** (snapshot JSON contains "Login"): PASS — Test I6 also asserts `rawText.toContain('Login')`. Fixture has `<button id="login-btn">Login</button>`, confirming inclusion. Passed.
- **Criterion 4** (page content contains "dangerous-btn" without masking): PASS — Test I7 first case asserts `html.toContain('dangerous-btn')`. Passed.
- **Criterion 5** (page content contains "admin-panel" without masking): PASS — Test I7 second case asserts `html.toContain('admin-panel')`. Passed.
