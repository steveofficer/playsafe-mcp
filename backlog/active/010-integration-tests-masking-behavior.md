# Integration Tests — Masking Behavior (Priority)

## Status
pending

## Priority
high

## Milestone
M3

## Description
Create `test/integration/masking.test.ts` — the highest-priority integration test file,
validating that all masking guarantees hold end-to-end.

The MCP server is started with:
```
--mask ".dangerous-btn" --mask "#admin-panel"
```

This means `.dangerous-btn` and everything inside `#admin-panel` (including
`.admin-action`, `#admin-input`, `#admin-select`) must be blocked.

Lifecycle:
- `beforeAll`: start HTTP server + start MCP client with masks `['.dangerous-btn', '#admin-panel']`
- `beforeEach`: navigate to `test-page.html`
- `afterAll`: disconnect client + stop HTTP server
- Jest timeout: 30 000 ms per test

Test scenarios (M1–M14) — all from the spec:

| ID | Tool | Target | Expected |
|----|------|--------|---------|
| M1 | `browser_click` | `.dangerous-btn` (direct match) | `isError: true`, text contains "masked for safety" |
| M2 | `browser_click` | `.admin-action` (descendant of `#admin-panel`) | `isError: true`, text contains "masked for safety" |
| M3 | `browser_click` | `#login-btn` (unmasked) | `isError` falsy, success text |
| M4 | `browser_type` | `#admin-input` (inside `#admin-panel`) | `isError: true` |
| M5 | `browser_fill` | `#admin-input` (inside `#admin-panel`) | `isError: true` |
| M6 | `browser_select_option` | `#admin-select` (inside `#admin-panel`) | `isError: true` |
| M7 | `browser_hover` | `.dangerous-btn` | `isError: true` |
| M8 | `browser_snapshot` | — | JSON does NOT contain text from `.dangerous-btn` or `#admin-panel` children |
| M9 | `browser_get_page_content` | — | HTML does NOT contain `dangerous-btn` or `admin-panel` |
| M10 | `browser_screenshot` | — | Valid base64 PNG returned (image still taken with masked elements hidden) |
| M11 | `browser_wait_for_selector` | `.dangerous-btn` (exact masked selector) | `isError: true`, text contains "masked element" |
| M12 | `browser_wait_for_selector` | `#login-btn` (unmasked) | `isError` falsy, "Element appeared" |
| M13 | `browser_type` | `#username` (unmasked) | `isError` falsy, success |
| M14 | `browser_fill` | `#username` (unmasked) | `isError` falsy, success |

For M8: after calling `browser_snapshot`, parse the JSON and confirm neither "Danger"
(the text of `.dangerous-btn`) nor "Admin Action" (the text of `.admin-action`) appear
in the stringified JSON output.

For M9: assert that the HTML string does not contain the substring `dangerous-btn` and
does not contain `admin-panel`.

## Acceptance Criteria
- [ ] Given the masked server, when `browser_click '.dangerous-btn'` is called, then
  `result.isError` is `true` and `result.content[0].text` contains "masked for safety".
- [ ] Given the masked server, when `browser_click '.admin-action'` is called (descendant
  of masked `#admin-panel`), then `result.isError` is `true` (descendant blocking works).
- [ ] Given the masked server, when `browser_click '#login-btn'` is called, then
  `result.isError` is falsy (unmasked elements are unaffected).
- [ ] Given the masked server, when `browser_type` or `browser_fill` targets `#admin-input`
  (inside `#admin-panel`), then `result.isError` is `true` for both calls.
- [ ] Given the masked server, when `browser_snapshot` is called, then the response text
  does not contain the string "Danger" and does not contain "Admin Action".
- [ ] Given the masked server, when `browser_get_page_content` is called, then the HTML
  does not contain the substring "dangerous-btn" and does not contain "admin-panel".
- [ ] Given the masked server, when `browser_wait_for_selector '.dangerous-btn'` is called,
  then `result.isError` is `true` and text contains "masked element".
- [ ] Given the masked server, when `browser_screenshot` is called, then `result.isError`
  is falsy and `result.content[0].type` is "image" (screenshot still succeeds).

## Dependencies
004, 005, 006

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
