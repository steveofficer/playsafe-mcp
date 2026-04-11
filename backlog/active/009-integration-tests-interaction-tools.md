# Integration Tests — Interaction Tools (No Masking)

## Status
pending

## Priority
medium

## Milestone
M3

## Description
Create `test/integration/interaction-tools.test.ts` covering the six interaction tools:
`browser_click`, `browser_type`, `browser_fill`, `browser_select_option`,
`browser_hover`, and `browser_wait_for_selector`.

The MCP server is started with **no `--mask` arguments**.

Lifecycle:
- `beforeAll`: start HTTP server + start MCP client (no masks)
- `beforeEach`: navigate to `test-page.html` (ensures a clean page state per test)
- `afterAll`: disconnect client + stop HTTP server
- Jest timeout: 30 000 ms per test

Test scenarios (I8–I13):

| ID | Tool | Action | Expected |
|----|------|--------|---------|
| I8 | `browser_click` | Click `#login-btn` | Response text contains "Clicked element" |
| I9 | `browser_type` | Type "hello" into `#username` | Response text contains "Typed" and "hello" |
| I10 | `browser_fill` | Fill "world" into `#username` | Response text contains "Filled" and "world" |
| I11 | `browser_select_option` | Select value "blue" in `#color-select` | Response text contains "Selected option" |
| I12 | `browser_hover` | Hover `#hover-target` | Response text contains "Hovered" |
| I13 | `browser_wait_for_selector` | Wait for `#login-btn` (immediately present) | Response text contains "Element appeared" |

## Acceptance Criteria
- [ ] Given the browser is on `test-page.html` (no masking), when `browser_click`
  is called with selector `#login-btn`, then `result.isError` is falsy and
  `result.content[0].text` contains "Clicked element".
- [ ] Given the browser is on `test-page.html`, when `browser_type` is called with
  selector `#username` and text `"hello"`, then the response text contains both
  "Typed" and "hello" and `isError` is falsy.
- [ ] Given the browser is on `test-page.html`, when `browser_fill` is called with
  selector `#username` and value `"world"`, then the response text contains "Filled"
  and `isError` is falsy.
- [ ] Given the browser is on `test-page.html`, when `browser_select_option` is called
  with selector `#color-select` and value `"blue"`, then the response text contains
  "Selected option" and `isError` is falsy.
- [ ] Given the browser is on `test-page.html`, when `browser_hover` is called with
  selector `#hover-target`, then the response text contains "Hovered" and `isError`
  is falsy.
- [ ] Given the browser is on `test-page.html`, when `browser_wait_for_selector` is
  called with `#login-btn`, then the response text is "Element appeared: #login-btn"
  and `isError` is falsy.

## Dependencies
004, 005, 006

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
