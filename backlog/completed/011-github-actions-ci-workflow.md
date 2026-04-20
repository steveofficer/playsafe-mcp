# GitHub Actions CI Workflow

## Status
completed

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
- [x] Given `.github/workflows/test.yml` exists, when parsed as YAML, then it is valid
  YAML with no syntax errors.
- [x] Given the workflow file, when the `on` key is inspected, then it triggers on both
  `push` to `main` and `pull_request` to `main`.
- [x] Given the workflow file, when the steps are enumerated, then `npm ci`,
  `npx playwright install --with-deps chromium`, `npm run build`, and `npm test`
  all appear as distinct run steps in the correct order.
- [x] Given the workflow file, when the Node version matrix is inspected, then it
  includes Node 20.
- [ ] Given the workflow runs in CI with all tests passing, when the workflow completes,
  then the job exits with status 0 (success).

## Dependencies
None

## Implementation Notes
Created `.github/workflows/test.yml`. Triggers on push/PR to main with `concurrency` cancellation. Uses Node 20, caches npm and Playwright browsers (~/.cache/ms-playwright keyed on package-lock.json), then runs npm ci → playwright install → npm run build → npm test.

## Testing Findings
- **Overall**: PASS (4/4 verifiable criteria pass; criterion 5 is not directly testable in this environment)
- **Criterion 1** (valid YAML): PASS — `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"` succeeded with no exceptions.
- **Criterion 2** (triggers on push + pull_request to main): PASS — Parsed YAML confirms `on.push.branches: [main]` and `on.pull_request.branches: [main]`.
- **Criterion 3** (steps in order: npm ci → playwright install → npm run build → npm test): PASS — Steps enumerated: `npm ci`, `npx playwright install --with-deps chromium`, `npm run build`, `npm test` appear as four distinct `run:` steps in the declared order.
- **Criterion 4** (Node 20 in matrix): PASS — `strategy.matrix.node-version: ['20']` confirmed.
- **Criterion 5** (CI job exits 0): NOT DIRECTLY VERIFIABLE — Requires an actual GitHub Actions run. All 28 integration tests pass locally (`npx jest --selectProjects integration` → 4 suites, 28 tests, 0 failures), and the workflow file is correctly configured, providing strong indirect evidence that the job would succeed.
