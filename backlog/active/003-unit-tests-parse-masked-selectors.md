# Unit Tests — parseMaskedSelectors

## Status
pending

## Priority
high

## Milestone
M1

## Description
Create `test/unit/parse-masked-selectors.test.ts` with eight test cases covering all
scenarios specified in R3. Import `parseMaskedSelectors` from `../../src/cli` (ts-jest
compiles from source, no build step required).

All tests must be purely synchronous — no Playwright, no browser, no network. Each test
corresponds to one scenario from the spec table (U1–U8):

| ID | argv input | expected output |
|----|-----------|----------------|
| U1 | `['--mask', '.btn']` | `['.btn']` |
| U2 | `['--mask', '.btn', '--mask', '#panel']` | `['.btn', '#panel']` |
| U3 | `[]` | `[]` |
| U4 | `['--mask']` (dangling, no value) | `[]` |
| U5 | `['--mask', '  .btn  ']` | `['.btn']` (trimmed) |
| U6 | `['--mask', '']` | `[]` |
| U7 | `['--other', 'val', '--mask', '.x']` | `['.x']` |
| U8 | `['--mask', '   ']` | `[]` |

## Acceptance Criteria
- [ ] Given `npm run test:unit`, when all 8 test cases run, then all 8 pass with zero
  failures.
- [ ] Given argv `['--mask', '.btn']` (U1), when `parseMaskedSelectors` is called, then
  the return value strictly equals `['.btn']`.
- [ ] Given argv `['--mask', '.btn', '--mask', '#panel']` (U2), when called, then return
  value strictly equals `['.btn', '#panel']`.
- [ ] Given argv `['--mask']` with no following value (U4), when called, then return value
  is an empty array (no crash, no out-of-bounds access).
- [ ] Given argv `['--mask', '  .btn  ']` (U5), when called, then the returned selector
  is `'.btn'` with surrounding whitespace stripped.
- [ ] Given argv `['--mask', '   ']` (U8), when called, then return value is `[]`
  (whitespace-only values are excluded).

## Dependencies
001, 002

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
