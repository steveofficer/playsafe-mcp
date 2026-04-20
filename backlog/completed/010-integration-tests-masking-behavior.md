# Integration Tests — Masking Behavior (Priority)

## Status
completed

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
| M5 | `browser_fill` | `#admin-input` (inside `#admin-panel`) | `isError: true` |
| M6 | `browser_select_option` | `#admin-select` (inside `#admin-panel`) | `isError: true` |
| M7 | `browser_hover` | `.dangerous-btn` | `isError: true` |
| M8 | `browser_snapshot` | — | JSON does NOT contain text from `.dangerous-btn` or `#admin-panel` children |
| M9 | `browser_get_page_content` | — | HTML does NOT contain `dangerous-btn` or `admin-panel` |
| M10 | `browser_screenshot` | — | Valid base64 PNG returned (image still taken with masked elements hidden) |
| M11 | `browser_wait_for_selector` | `.dangerous-btn` (exact masked selector) | `isError: true`, text contains "masked element" |
| M12 | `browser_wait_for_selector` | `#login-btn` (unmasked) | `isError` falsy, "Element appeared" |
| M14 | `browser_fill` | `#username` (unmasked) | `isError` falsy, success |

For M8: after calling `browser_snapshot`, parse the JSON and confirm neither "Danger"
(the text of `.dangerous-btn`) nor "Admin Action" (the text of `.admin-action`) appear
in the stringified JSON output.

For M9: assert that the HTML string does not contain the substring `dangerous-btn` and
does not contain `admin-panel`.

## Acceptance Criteria
- [x] Given the masked server, when `browser_click '.dangerous-btn'` is called, then
  `result.isError` is `true` and `result.content[0].text` contains "masked for safety".
- [x] Given the masked server, when `browser_click '.admin-action'` is called (descendant
  of masked `#admin-panel`), then `result.isError` is `true` (descendant blocking works).
- [x] Given the masked server, when `browser_click '#login-btn'` is called, then
  `result.isError` is falsy (unmasked elements are unaffected).
- [x] Given the masked server, when `browser_fill` targets `#admin-input`
  (inside `#admin-panel`), then `result.isError` is `true` for both calls.
- [x] Given the masked server, when `browser_snapshot` is called, then the response text
  does not contain the string "Danger" and does not contain "Admin Action".
- [x] Given the masked server, when `browser_get_page_content` is called, then the HTML
  does not contain the substring "dangerous-btn" and does not contain "admin-panel".
- [x] Given the masked server, when `browser_wait_for_selector '.dangerous-btn'` is called,
  then `result.isError` is `true` and text contains "masked element".
- [x] Given the masked server, when `browser_screenshot` is called, then `result.isError`
  is falsy and `result.content[0].type` is "image" (screenshot still succeeds).

## Dependencies
004, 005, 006

## Implementation Notes
Created `test/integration/masking.test.ts` with 14 tests (M1–M14) covering all masking guarantees. Server started with `--mask ".dangerous-btn" --mask "#admin-panel"`. Uses `beforeEach` navigation for clean state. M8 checks for JSON-quoted values to avoid false positives from "Dangerous Action" h2 text; M9 checks for element attribute markup to avoid false positives from HTML comments and CSS rules in the fixture.

## Testing Findings
- **Overall**: PASS
- **Criterion 1** (click .dangerous-btn → isError true, "masked for safety"): PASS — Test M1 asserts `result.isError === true` and `text.toContain('masked for safety')`. Passed.
- **Criterion 2** (click .admin-action descendant → isError true): PASS — Test M2 asserts `result.isError === true`. `.admin-action` is inside `#admin-panel` (masked). Passed.
- **Criterion 3** (click #login-btn unmasked → isError falsy): PASS — Test M3 asserts `result.isError` falsy and text contains "Clicked element". Passed.
- **Criterion 4** (browser_fill on #admin-input → isError true): PASS — Test M5 (fill) asserts `result.isError === true`. Passed.
- **Criterion 5** (snapshot does not contain "Danger" or "Admin Action"): PASS — Test M8 re-stringifies parsed JSON and asserts `not.toContain('"Danger"')` and `not.toContain('"Admin Action"')` (JSON-encoded values). Fixture text node for `.dangerous-btn` is "Danger" and for `.admin-action` is "Admin Action". Passed.
- **Criterion 6** (page content does not contain dangerous-btn or admin-panel): PASS — Test M9 checks `not.toContain('class="dangerous-btn"')` and `not.toContain('id="admin-panel"')`. Note: the test uses attribute-syntax checks rather than bare substrings to avoid false positives from CSS rules and HTML comments in the fixture that legitimately reference those selector strings. This is correct behavior and satisfies the criterion's intent. Passed.
- **Criterion 7** (wait_for_selector .dangerous-btn → isError true, "masked element"): PASS — Test M11 asserts `result.isError === true` and `text.toContain('masked element')`. Passed.
- **Criterion 8** (screenshot with masks → isError falsy, type "image"): PASS — Test M10 asserts `result.isError` falsy and `content[0].type === 'image'`. Passed.
