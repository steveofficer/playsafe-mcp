# HTML Test Fixtures

## Status
pending

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
- [ ] Given `test/fixtures/test-page.html`, when parsed as HTML, then all eight required
  selectors (`#username`, `#password`, `#login-btn`, `.dangerous-btn`, `#admin-panel`,
  `.admin-action`, `#admin-input`, `#admin-select`, `#color-select`, `#hover-target`)
  resolve to exactly one element each.
- [ ] Given `#admin-panel` in `test-page.html`, when queried for children, then
  `.admin-action`, `#admin-input`, and `#admin-select` are all descendants of it.
- [ ] Given `#color-select` in `test-page.html`, when its options are enumerated, then
  at least one option has `value="blue"`.
- [ ] Given `test/fixtures/second-page.html`, when its `<title>` is read, then it equals
  "Second Page".
- [ ] Given both fixtures are served by the HTTP server helper (task 004), when fetching
  each file, then both return HTTP 200.

## Dependencies
None

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
