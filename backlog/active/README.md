# Active Tasks

## Milestones

| ID | Title | Description | Tasks |
|----|-------|-------------|-------|
| M3 | Full Integration Test Suite + CI | All 13 tools exercised end-to-end, masking behaviour fully validated, and GitHub Actions CI workflow wired up. | 007, 008, 009, 010, 011 |

## Parallel Tracks

Tasks with no mutual dependencies that can execute concurrently (max 3 per batch):

| After | Parallel Tasks | Milestone |
|-------|---------------|----------|
| 004 + 005 + 006 complete | 007, 008, 009 | M3 |
| 007 + 008 + 009 complete | 010, 011 | M3 |

## Tasks

| # | Task | Milestone | Priority | Status | Dependencies |
|---|------|-----------|----------|--------|--------------|
| 007 | [Integration tests — navigation tools](007-integration-tests-navigation.md) | M3 | medium | pending | 004, 005, 006 |
| 008 | [Integration tests — content tools](008-integration-tests-content-tools.md) | M3 | medium | pending | 004, 005, 006 |
| 009 | [Integration tests — interaction tools (no masking)](009-integration-tests-interaction-tools.md) | M3 | medium | pending | 004, 005, 006 |
| 010 | [Integration tests — masking behavior](010-integration-tests-masking-behavior.md) | M3 | high | pending | 004, 005, 006 |
| 011 | [GitHub Actions CI workflow](011-github-actions-ci-workflow.md) | M3 | medium | pending | None |
