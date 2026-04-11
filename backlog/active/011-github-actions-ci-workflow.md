# GitHub Actions CI Workflow

## Status
pending

## Priority
medium

## Milestone
M3

## Description
Create `.github/workflows/test.yml` — a CI workflow that runs the full test suite on
every push to `main` and every pull request targeting `main`.

Workflow specification:

```yaml
name: Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['20']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm test
```

Notes:
- `npm ci` installs exact locked versions (including Jest + ts-jest devDependencies).
- `npx playwright install --with-deps chromium` installs Chromium and its OS-level
  dependencies in the Ubuntu runner (required for headless Playwright tests).
- `npm run build` must succeed before `npm test` because integration tests spawn
  `node dist/index.js`.
- The `cache: 'npm'` option caches the npm cache directory for faster subsequent runs.
- Do not add `continue-on-error` — a test failure must fail the workflow.

The `.github/` directory already exists in the repository (contains agent/skill configs),
so only the `workflows/` subdirectory needs to be created.

## Acceptance Criteria
- [ ] Given `.github/workflows/test.yml` exists, when parsed as YAML, then it is valid
  YAML with no syntax errors.
- [ ] Given the workflow file, when the `on` key is inspected, then it triggers on both
  `push` to `main` and `pull_request` to `main`.
- [ ] Given the workflow file, when the steps are enumerated, then `npm ci`,
  `npx playwright install --with-deps chromium`, `npm run build`, and `npm test`
  all appear as distinct run steps in the correct order.
- [ ] Given the workflow file, when the Node version matrix is inspected, then it
  includes Node 20.
- [ ] Given the workflow runs in CI with all tests passing, when the workflow completes,
  then the job exits with status 0 (success).

## Dependencies
None

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
