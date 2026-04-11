# HTML Test Fixtures

## Status
completed

## Priority
medium

## Milestone
M2

## Description
Create two static HTML fixture files under `test/fixtures/`:

### test/fixtures/test-page.html
A comprehensive test page containing all elements needed by integration tests.
Required elements (IDs/classes are exact — tests reference them directly):

| Element | Selector | Notes |
|---------|----------|-------|
| Page title | `<title>` | Value: "Test Page" |
| Text input | `#username` | type="text", placeholder="Username" |
| Password input | `#password` | type="password", placeholder="Password" |
| Safe button | `#login-btn` | text: "Login" |
| Dangerous button | `.dangerous-btn` | text: "Danger" — will be masked in masking tests |
| Admin panel div | `#admin-panel` | Contains the three child elements below |
| Admin action button | `.admin-action` | Inside `#admin-panel`, text: "Admin Action" |
| Admin input | `#admin-input` | Inside `#admin-panel`, type="text" |
| Admin select | `#admin-select` | Inside `#admin-panel`, with ≥2 options |
| Color select | `#color-select` | Outside `#admin-panel`, options include value="blue" |
| Hover target | `#hover-target` | A `<div>` with visible text |
| Link to second page | `a[href="second-page.html"]` | Visible link text |

### test/fixtures/second-page.html
A minimal page with:
- `<title>` value: "Second Page" (distinct from "Test Page")
- A link back: `<a href="test-page.html">Back</a>`
- Visible body text so navigation assertions can confirm page identity

The existing `test/index.html` may remain in place (it is not referenced by any new tests)
or be moved to `test/fixtures/` — leave it as-is unless it conflicts.

## Acceptance Criteria
- [x] Given `test/fixtures/test-page.html`, when parsed as HTML, then all eight required
  selectors (`#username`, `#password`, `#login-btn`, `.dangerous-btn`, `#admin-panel`,
  `.admin-action`, `#admin-input`, `#admin-select`, `#color-select`, `#hover-target`)
  resolve to exactly one element each.
- [x] Given `#admin-panel` in `test-page.html`, when queried for children, then
  `.admin-action`, `#admin-input`, and `#admin-select` are all descendants of it.
- [x] Given `#color-select` in `test-page.html`, when its options are enumerated, then
  at least one option has `value="blue"`.
- [x] Given `test/fixtures/second-page.html`, when its `<title>` is read, then it equals
  "Second Page".
- [ ] Given both fixtures are served by the HTTP server helper (task 004), when fetching
  each file, then both return HTTP 200.

## Dependencies
None

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings

- **Overall**: PASS (all verifiable criteria pass; one criterion deferred pending Task 004)

- **Criterion 1 — All required selectors resolve to exactly one element each**: PASS
  Each of the 10 selectors appears exactly once in `test/fixtures/test-page.html`:
  - `#username` → line 22: `<input id="username" type="text" placeholder="Username" />`
  - `#password` → line 23: `<input id="password" type="password" placeholder="Password" />`
  - `#login-btn` → line 24: `<button id="login-btn">Login</button>`
  - `.dangerous-btn` → line 31: `<button class="dangerous-btn">Danger</button>`
  - `#admin-panel` → line 36: `<section id="admin-panel">`
  - `.admin-action` → line 38: `<button class="admin-action">Admin Action</button>`
  - `#admin-input` → line 39: `<input id="admin-input" type="text" ...>`
  - `#admin-select` → line 40: `<select id="admin-select">`
  - `#color-select` → line 50: `<select id="color-select">`
  - `#hover-target` → line 60: `<div id="hover-target">Hover over me</div>`
  `grep -c` confirms 10 matching lines, one per selector.

- **Criterion 2 — `.admin-action`, `#admin-input`, `#admin-select` are descendants of `#admin-panel`**: PASS
  `<section id="admin-panel">` opens at line 36 and closes at line 45. All three elements
  (lines 38, 39, 40) are nested inside that section as direct children.

- **Criterion 3 — `#color-select` has at least one option with `value="blue"`**: PASS
  Line 53: `<option value="blue">Blue</option>` is present inside `#color-select` (lines 50–55),
  which is outside `#admin-panel`.

- **Criterion 4 — `second-page.html` `<title>` equals "Second Page"**: PASS
  Line 6 of `test/fixtures/second-page.html`: `<title>Second Page</title>`.

- **Criterion 5 — Both fixtures served by HTTP server helper return HTTP 200**: DEFERRED
  This criterion depends on the HTTP server helper from Task 004. The HTML files exist on
  disk and are structurally valid, but runtime HTTP serving cannot be verified until the
  Task 004 server helper is available. File content is correct and ready for serving.

- **Bonus — Navigation links (from task description)**: PASS
  - `test-page.html` line 66: `<a href="second-page.html">Go to second page</a>` ✓
  - `second-page.html` line 14: `<a href="test-page.html">Back</a>` ✓
