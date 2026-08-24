# Changelog

## 3.0.1

Documentation only — no code changes.

- Restored the multiline pipe formatting in the README usage example.
- Clarified that the Node.js 22.18 requirement applies to gulp-svgo >=3.0.0; older runtimes should use 2.x.

## 3.0.0

### Breaking

- svgo upgraded from 1.x to ^4.1.0. Options now use the svgo v2+ configuration format (`preset-default` with `overrides`; `cleanupIDs` is now `cleanupIds`), and optimized output differs from svgo 1.x. This resolves every known vulnerability in the dependency tree.
- Requires Node.js >=22.18.
- Malformed SVGs now emit a stream error (with the underlying svgo error as `cause`) instead of being logged to stderr and passed through.
- Stream-backed file contents now emit a "streaming not supported" error instead of passing through unoptimized.
- The package is now ESM. CommonJS consumers on Node 22.18+ are still supported: `require('gulp-svgo')` keeps returning the plugin function directly.

### Changed

- Source migrated to TypeScript; the package now ships type declarations.
- Tests run on the built-in `node:test` runner.
- Linting and formatting via oxlint and oxfmt.
- CI tests Node 22/24/26 on Linux plus Node 24 on Windows, and a tag-triggered publish workflow uses npm trusted publishing (OIDC) — no npm token secret.

## 2.3.0

Compatible with all previously supported Node.js versions (>=8).

### Fixed

- No longer crashes on null files (`gulp.src(..., { read: false })`, directories) or pathless Vinyl files — they pass through untouched.
- Malformed SVGs are no longer silently dropped from the stream. The error is still logged, and the original file now passes through unchanged so downstream tasks and `gulp.dest` see it.

### Changed

- Removed `ava` in favor of a dependency-free test script (`node test.js`), eliminating every known vulnerability in the dev dependency tree.
- Replaced the defunct Travis CI setup with GitHub Actions (test matrix: Node 8–24).
- Added a `files` allowlist so npm releases only ship `index.js`.
- Switched package management from yarn to pnpm.

### Known issues

- The svgo `^1.0.0` production dependency carries known advisories (nth-check ReDoS, js-yaml, minimist, and svgo's own GHSA-2p49-hgcm-8545). These cannot be patched without svgo >=2, which drops old Node.js support — fixed in gulp-svgo 3.0.0.
