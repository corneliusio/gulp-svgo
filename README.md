# gulp-svgo

[![NPM Version](https://img.shields.io/npm/v/gulp-svgo.svg?style=flat-square)](https://npmjs.com/package/gulp-svgo) [![NPM Downloads](https://img.shields.io/npm/dm/gulp-svgo.svg?style=flat-square&colorB=007ec6)](https://npmjs.com/package/gulp-svgo) [![Build Status](https://img.shields.io/github/actions/workflow/status/corneliusio/gulp-svgo/test.yml?branch=master&style=flat-square)](https://github.com/corneliusio/gulp-svgo/actions/workflows/test.yml)

Optimizing SVG vector graphics files with Gulp

A thin wrapper around [svgo](https://www.npmjs.com/package/svgo) for Gulp. Will pass through any non-svg files unaltered so you can use it in conjunction with other image optimization tools if you don't want a separate task for different file formats.

## Install

```
$ npm install --save-dev gulp-svgo
```

## Usage

```js
const gulp = require('gulp');
const svgo = require('gulp-svgo');

gulp.task('images', () => {

    return gulp.src('src/img/*')
        .pipe(svgo())
        .pipe(gulp.dest('dest/img'));
});
```

## Options

Options are passed directly to [svgo](https://www.npmjs.com/package/svgo).

This release wraps svgo 1.x, so options use the svgo 1.x plugin format:

```js
svgo({
    plugins: [
        { removeDoctype: false }
    ]
});
```

## Notes

- Files that fail to parse are logged to stderr and passed through **unchanged** — they are no longer silently dropped from the stream.
- Null files (e.g. from `gulp.src(..., { read: false })`), empty files, and stream-backed files are passed through untouched.
- svgo is an optimizer, not a sanitizer. Do not treat optimized SVGs from untrusted sources as safe browser content.
- svgo 1.x contains known vulnerabilities in its dependency tree that cannot be fixed without dropping old Node.js support. If you are on Node.js 22 or newer, upgrade to gulp-svgo v3, which wraps svgo 4.
