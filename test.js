const svgo = require('.');
const ava = require('ava');
const File = require('vinyl');

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

function test(msg, stream, file, assertion) {
    return ava(msg, t => new Promise(resolve => {
        const output = [];
        const stderr = process.stderr.write;

        const fallback = setTimeout(() => {
            process.stderr.write = stderr;

            resolve(assertion(t, null, file, output));
        }, 32);

        stream.on('data', data => {
            process.stderr.write = stderr;

            clearTimeout(fallback);
            resolve(assertion(t, data, file, output));
        });

        stream.on('error', error => {
            process.stderr.write = stderr;

            clearTimeout(fallback);
            resolve(assertion(t, error, file, output));
        });

        process.stderr.write = (str, ...args) => {
            output.push(str);
            stderr.apply(process.stderr, [str, ...args]);
        };

        stream.write(file);
    }));
}

test('passes through non-svg files unaltered', svgo(), new File({
    path: 'some.jpg',
    contents: Buffer.from([])
}), (t, data, file) => {
    t.is(data.contents.toString(), file.contents.toString());
});

test('minifies svg', svgo(), new File({
    path: 'some.svg',
    contents: Buffer.from(src)
}), (t, data, file) => {
    t.is(data.contents.toString(), expected);
});

test('handles error for malformed svg', svgo(), new File({
    path: `${__dirname}/malformed.svg`,
    contents: Buffer.from(malformed)
}), (t, data, file, output) => {
    const message = `[33mgulp-svgo:[31m Error in parsing SVG: Unclosed root tag\n\t[0mFile: malformed.svg\n\tLine: 0\n\tColumn: 468\n\tChar:\n`;
    const [error] = output;

    t.is(error, message);
});

test('handles svgo options', svgo({
    plugins: [
        { removeDoctype: false }
    ]
}), new File({
    path: 'some.svg',
    contents: Buffer.from(src)
}), (t, data, file) => {
    t.true(data.contents.toString().includes(svg.doctype));
});

test('passes path for prefixing', svgo({
    plugins: [
        { prefixIds: true },
        { cleanupIDs: false }
    ]
}), new File({
    path: 'some.svg',
    contents: Buffer.from(src)
}), (t, data, file) => {
    t.is(data.contents.toString(), expectedWithPrefix);
});
