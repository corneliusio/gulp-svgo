const assert = require('assert');
const { Readable } = require('stream');
const File = require('vinyl');
const svgo = require('.');

const svg = {
    head: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    doctype: '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    body: '<svg width="100%" height="100%" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"> <rect id="some-id" x="0" y="0" width="42" height="42"/> </svg>',
    malformed: '<svg width="100%" height="100%" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"> <rect id="some-id" x="0" y="0" width="42" height="42"/>'
};

const malformed = `${svg.head} ${svg.doctype} ${svg.malformed}`;
const src = `${svg.head} ${svg.doctype} <!--comment--> ${svg.body}`;
const expected = '<svg viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414"><path d="M0 0h42v42H0z"/></svg>';
const expectedWithPrefix = '<svg viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414"><path id="some_svg__some-id" d="M0 0h42v42H0z"/></svg>';

function run(stream, file) {
    return new Promise((resolve, reject) => {
        const captured = [];
        const files = [];
        const write = process.stderr.write;
        let settled = false;

        const done = (error, data) => {
            if (settled) {
                return;
            }

            settled = true;
            process.stderr.write = write;

            if (error) {
                reject(error);
            } else {
                resolve({ data, stderr: captured.join('') });
            }
        };

        process.stderr.write = str => {
            captured.push(str);

            return true;
        };

        stream.on('data', data => files.push(data));
        stream.on('error', error => done(error));
        stream.on('end', () => {
            if (files.length === 1) {
                done(null, files[0]);
            } else {
                done(new Error(`expected 1 file from stream, got ${files.length}`));
            }
        });
        stream.end(file);
    });
}

function runAll(stream, files) {
    return new Promise((resolve, reject) => {
        const out = [];
        const captured = [];
        const write = process.stderr.write;
        let settled = false;

        const done = (error, result) => {
            if (settled) {
                return;
            }

            settled = true;
            process.stderr.write = write;

            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        };

        process.stderr.write = str => {
            captured.push(str);

            return true;
        };

        stream.on('data', data => out.push(data));
        stream.on('error', error => done(error));
        stream.on('end', () => done(null, out));

        try {
            files.forEach(file => stream.write(file));
            stream.end();
        } catch (error) {
            done(error);
        }
    });
}

const tests = [];

function test(name, fn) {
    tests.push({ name, fn });
}

test('passes through non-svg files unaltered', () => {
    const file = new File({ path: 'some.jpg', contents: Buffer.from('jpg data') });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.contents.toString(), 'jpg data');
    });
});

test('passes through null files', () => {
    const file = new File({ path: 'some.svg', contents: null });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.contents, null);
    });
});

test('passes through pathless files', () => {
    const file = new File({ contents: Buffer.from(src) });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.contents.toString(), src);
    });
});

test('passes through empty svg files', () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from('') });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.contents.length, 0);
    });
});

test('passes through stream-backed files', () => {
    const file = new File({ path: 'some.svg', contents: new Readable({ read() {} }) });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.isStream(), true);
    });
});

test('minifies svg', () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data.contents.toString(), expected);
    });
});

test('minifies uppercase .SVG extension', () => {
    const file = new File({ path: 'some.SVG', contents: Buffer.from(src) });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data.contents.toString(), expected);
    });
});

test('logs error and passes malformed svg through unchanged', () => {
    const file = new File({ path: `${__dirname}/malformed.svg`, contents: Buffer.from(malformed) });

    return run(svgo(), file).then(result => {
        assert.strictEqual(result.data, file);
        assert.strictEqual(result.data.contents.toString(), malformed);
        assert.ok(result.stderr.indexOf('gulp-svgo:') !== -1, `stderr missing plugin name: ${result.stderr}`);
        assert.ok(result.stderr.indexOf('Unclosed root tag') !== -1, `stderr missing parse error: ${result.stderr}`);
    });
});

test('handles svgo options', () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) });
    const stream = svgo({ plugins: [{ removeDoctype: false }] });

    return run(stream, file).then(result => {
        assert.ok(result.data.contents.toString().indexOf(svg.doctype) !== -1);
    });
});

test('emits every file in order', () => {
    const files = [
        new File({ path: 'a.svg', contents: Buffer.from(src) }),
        new File({ path: 'b.jpg', contents: Buffer.from('jpg data') }),
        new File({ path: 'c.svg', contents: Buffer.from(malformed) }),
        new File({ path: 'd.svg', contents: Buffer.from(src) })
    ];

    return runAll(svgo(), files).then(out => {
        assert.strictEqual(out.length, 4);
        assert.deepStrictEqual(out.map(file => file.path), ['a.svg', 'b.jpg', 'c.svg', 'd.svg']);
        assert.strictEqual(out[0].contents.toString(), expected);
        assert.strictEqual(out[1].contents.toString(), 'jpg data');
        assert.strictEqual(out[2].contents.toString(), malformed);
        assert.strictEqual(out[3].contents.toString(), expected);
    });
});

test('passes path for prefixing', () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) });
    const stream = svgo({ plugins: [{ prefixIds: true }, { cleanupIDs: false }] });

    return run(stream, file).then(result => {
        assert.strictEqual(result.data.contents.toString(), expectedWithPrefix);
    });
});

tests.reduce((chain, item) => chain.then(() => {
    return Promise.resolve().then(item.fn).then(() => {
        console.log(`ok - ${item.name}`);
    }, error => {
        process.exitCode = 1;
        console.error(`not ok - ${item.name}`);
        console.error(error && error.stack ? error.stack : error);
    });
}), Promise.resolve()).then(() => {
    if (process.exitCode) {
        console.error('\nFAILED');
    } else {
        console.log(`\n${tests.length} tests passed`);
    }
});
