# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Add `test/fixtures/test-page.html` — comprehensive HTML fixture containing all elements
  required by integration tests: login form (`#username`, `#password`, `#login-btn`),
  dangerous button (`.dangerous-btn`), admin panel (`#admin-panel`) with nested
  `.admin-action` button, `#admin-input`, and `#admin-select`, a `#color-select` with a
  `value="blue"` option, a `#hover-target` div, and a link to `second-page.html`.
- Add `test/fixtures/second-page.html` — minimal navigation-target fixture with title
  "Second Page", visible body text, and a back-link to `test-page.html`.

---

## [0.3.0] — Jest infrastructure & unit tests (Milestone M1)

### Added
- Add Jest + ts-jest infrastructure (`jest.config.ts`, `test/tsconfig.json`) with separate
  `unit` and `integration` Jest projects and 30-second per-test timeout.
- Add `npm test`, `npm run test:unit`, and `npm run test:integration` scripts.
- Extract `parseMaskedSelectors` into `src/cli.ts` as a named export so it can be imported
  by tests without launching a browser or MCP server.
- Add eight unit tests (`test/unit/parse-masked-selectors.test.ts`) covering all
  `parseMaskedSelectors` edge cases (U1–U8): single selector, multiple selectors, empty
  argv, dangling `--mask` flag, whitespace trimming, whitespace-only values, and
  interleaved unrelated flags.
