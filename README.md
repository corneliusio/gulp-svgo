# gulp-svgo

[![NPM Version](https://img.shields.io/npm/v/gulp-svgo.svg?style=flat-square)](https://npmjs.com/package/gulp-svgo) [![NPM Downloads](https://img.shields.io/npm/dm/gulp-svgo.svg?style=flat-square&colorB=007ec6)](https://npmjs.com/package/gulp-svgo) [![Build Status](https://img.shields.io/github/actions/workflow/status/corneliusio/gulp-svgo/test.yml?branch=master&style=flat-square)](https://github.com/corneliusio/gulp-svgo/actions/workflows/test.yml)

Optimizing SVG vector graphics files with Gulp

A thin wrapper around [svgo](https://www.npmjs.com/package/svgo) for Gulp. Will pass through any non-svg files unaltered so you can use it in conjunction with other image optimization tools if you don't want a separate task for different file formats.

Requires Node.js 22.12 or newer.

## Install

```
$ pnpm add -D gulp-svgo
```

## Usage

```js
import gulp from 'gulp'
import svgo from 'gulp-svgo'

export const images = () => gulp.src('src/img/*').pipe(svgo()).pipe(gulp.dest('dest/img'))
```

CommonJS gulpfiles work too — `const svgo = require('gulp-svgo')`.

## Options

Options are passed directly to [svgo](https://www.npmjs.com/package/svgo) `optimize()` and use the svgo v4 [configuration format](https://svgo.dev/docs/preset-default/):

```js
svgo({
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeDoctype: false,
                },
            },
        },
    ],
})
```

## Behavior

- Null files (e.g. from `gulp.src(..., { read: false })`), pathless files, empty files, and non-svg files pass through untouched.
- Stream-backed file contents are not supported and emit an error.
- SVGs that fail to parse emit a stream error (with the original error as `cause`) instead of being silently dropped, so broken files fail your build.
- svgo is an optimizer, not a sanitizer. Do not treat optimized SVGs from untrusted sources as safe browser content.

## Migrating from v2

- Node.js 22.12+ is required.
- Options now use the svgo v2+ format shown above. The v1 shorthand (`plugins: [{ removeDoctype: false }]`) no longer works, and `cleanupIDs` is now `cleanupIds`.
- Malformed SVGs now fail the stream instead of being logged and dropped. Handle the error in your task if you want to continue past bad files.
- Optimized output differs from svgo 1.x (e.g. attributes are sorted, `viewBox` is preserved by default).
