# Jest Infrastructure Setup

## Status
completed

## Priority
high

## Milestone
M1

## Description
Install Jest, ts-jest, and @types/jest as devDependencies. Create `jest.config.ts` at the
project root configuring two Jest projects: one for unit tests (`test/unit/**/*.test.ts`)
and one for integration tests (`test/integration/**/*.test.ts`) with a 30-second per-test
timeout. Create `test/tsconfig.json` so ts-jest can compile test files independently of
`src/` (extending the root tsconfig but setting `rootDir` to `test/`, including both
`test/**/*` and referencing `src/` types as needed). Update `package.json` with three
scripts:
- `"test"`: `jest` (runs all projects)
- `"test:unit"`: `jest --selectProjects unit`
- `"test:integration"`: `jest --selectProjects integration`

The root `tsconfig.json` must remain unchanged (still compiles only `src/`).

Relevant versions at time of writing: typescript ^6.0.2, node ^20 LTS.
ts-jest must be configured to use the `test/tsconfig.json` via `tsconfig` option in
`jest.config.ts`.

## Acceptance Criteria
- [ ] Given the installed devDependencies, when `npx jest --version` is run, then it prints
  a Jest version number without error.
- [ ] Given `jest.config.ts` exists, when `npm test` is run with no test files present,
  then Jest exits without a config parse error (exit 0 or "no tests found" — not a crash).
- [ ] Given a file at `test/unit/sample.test.ts` containing a passing test, when
  `npm run test:unit` is run, then only that file executes and it passes.
- [ ] Given a file at `test/integration/sample.test.ts` containing a passing test, when
  `npm run test:integration` is run, then only that file executes and it passes.
- [ ] Given `npm run test:unit`, when integration test files also exist, then no integration
  test file is executed.
- [ ] Given `test/tsconfig.json`, when `tsc --project test/tsconfig.json --noEmit` is run,
  then it compiles without error.

## Dependencies
None

## Implementation Notes
<!-- Populated by the implementing agent -->

## Testing Findings
<!-- Populated by the acceptance tester -->
