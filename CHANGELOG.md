# Changelog

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
