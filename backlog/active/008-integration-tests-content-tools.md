# Integration Tests — Content Tools (No Masking)

## Status
pending

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
- [ ] Given the browser is on `test-page.html` (no masking), when `browser_screenshot`
  is called, then `result.content[0].type` is `'image'`, `result.content[0].mimeType`
  is `'image/png'`, and `result.content[0].data` is a non-empty string.
- [ ] Given the browser is on `test-page.html` (no masking), when `browser_snapshot`
  is called, then the response text can be parsed with `JSON.parse` without throwing and
  the resulting object is non-null.
- [ ] Given `browser_snapshot` result, when the JSON string is inspected, then the
  string "Login" appears (confirming #login-btn content is included).
- [ ] Given the browser is on `test-page.html` (no masking), when
  `browser_get_page_content` is called, then the response text contains the substring
  `dangerous-btn` (element not stripped when masking is off).
- [ ] Given `browser_get_page_content` result with no masks, when the HTML is inspected,
  then the substring `admin-panel` is present.

## Dependencies
004, 005, 006

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
