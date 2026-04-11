# Active Tasks

## Milestones

| ID | Title | Description | Tasks |
|----|-------|-------------|-------|
| M1 | Test Infrastructure & Unit Tests | Jest + ts-jest configured, parseMaskedSelectors extracted and fully unit-tested. Delivers a passing `npm run test:unit`. | 001, 002, 003 |
| M2 | Integration Test Scaffolding | Shared MCP client helper, HTTP fixture server helper, and HTML test fixtures in place. All integration tests can be wired up against real infrastructure. | 004, 005, 006 |
| M3 | Full Integration Test Suite + CI | All 13 tools exercised end-to-end, masking behaviour fully validated, and GitHub Actions CI workflow wired up. | 007, 008, 009, 010, 011 |

## Parallel Tracks

Tasks with no mutual dependencies that can execute concurrently (max 3 per batch):

| After | Parallel Tasks | Milestone |
|-------|---------------|----------|
| Nothing (start) | 001, 002, 006 | M1 / M2 |
| 001 + 002 complete | 003, 004, 005 | M1 / M2 |
| 004 + 005 + 006 complete | 007, 008, 009 | M3 |
| 007 + 008 + 009 complete | 010, 011 | M3 |

## Tasks

| # | Task | Milestone | Priority | Status | Dependencies |
|---|------|-----------|----------|--------|--------------|
| 001 | [Jest infrastructure setup](001-jest-infrastructure.md) | M1 | high | **completed** | None |
| 002 | [Extract parseMaskedSelectors to src/cli.ts](002-extract-parse-masked-selectors.md) | M1 | high | **completed** | None |
| 003 | [Unit tests — parseMaskedSelectors](003-unit-tests-parse-masked-selectors.md) | M1 | high | **completed** | 001, 002 |
| 004 | [HTTP server test helper](004-http-server-test-helper.md) | M2 | high | pending | 001 |
| 005 | [MCP client test helper](005-mcp-client-test-helper.md) | M2 | high | pending | 001 |
| 006 | [HTML test fixtures](006-html-test-fixtures.md) | M2 | medium | pending | None |
| 007 | [Integration tests — navigation tools](007-integration-tests-navigation.md) | M3 | medium | pending | 004, 005, 006 |
| 008 | [Integration tests — content tools](008-integration-tests-content-tools.md) | M3 | medium | pending | 004, 005, 006 |
| 009 | [Integration tests — interaction tools (no masking)](009-integration-tests-interaction-tools.md) | M3 | medium | pending | 004, 005, 006 |
| 010 | [Integration tests — masking behavior](010-integration-tests-masking-behavior.md) | M3 | high | pending | 004, 005, 006 |
| 011 | [GitHub Actions CI workflow](011-github-actions-ci-workflow.md) | M3 | medium | pending | None |
