import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { Readable, type Transform } from 'node:stream'
import { test } from 'node:test'
import type { Config } from 'svgo'
import File from 'vinyl'
import svgo from '../src/index.ts'

const head = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
const doctype =
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
const body =
    '<svg width="100%" height="100%" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"> <rect id="some-id" x="0" y="0" width="42" height="42"/> </svg>'

const src = `${head} ${doctype} <!--comment--> ${body}`
const malformed = `${head} ${doctype} ${body.slice(0, -6)}`

const runAll = (stream: Transform, files: File[]): Promise<File[]> =>
    new Promise((resolve, reject) => {
        const out: File[] = []

        stream.on('data', (data: File) => out.push(data))
        stream.on('error', reject)
        stream.on('end', () => resolve(out))

        for (const file of files) {
            stream.write(file)
        }

        stream.end()
    })

const run = async (stream: Transform, file: File): Promise<File> => {
    const out = await runAll(stream, [file])

    assert.equal(out.length, 1, `expected 1 file from stream, got ${out.length}`)

    return out[0]
}

test('passes through non-svg files unaltered', async () => {
    const file = new File({ path: 'some.jpg', contents: Buffer.from('jpg data') })
    const result = await run(svgo(), file)

    assert.equal(result, file)
    assert.equal(result.contents?.toString(), 'jpg data')
})

test('passes through null files', async () => {
    const file = new File({ path: 'some.svg', contents: null })
    const result = await run(svgo(), file)

    assert.equal(result, file)
    assert.equal(result.contents, null)
})

test('passes through pathless files', async () => {
    const file = new File({ contents: Buffer.from(src) })
    const result = await run(svgo(), file)

    assert.equal(result, file)
    assert.equal(result.contents?.toString(), src)
})

test('passes through empty svg files', async () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from('') })
    const result = await run(svgo(), file)

    assert.equal(result, file)
    assert.equal(file.isBuffer() && file.contents.length, 0)
})

test('rejects stream-backed files', async () => {
    const file = new File({ path: 'some.svg', contents: new Readable({ read() {} }) })

    await assert.rejects(run(svgo(), file), /streaming not supported/)
})

test('minifies svg', async () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) })
    const result = await run(svgo(), file)
    const output = String(result.contents)

    assert.ok(output.startsWith('<svg'), `unexpected output: ${output}`)
    assert.ok(output.includes('viewBox="0 0 42 42"'))
    assert.ok(!output.includes('<!DOCTYPE'))
    assert.ok(!output.includes('<!--'))
    assert.ok(output.length < src.length)
})

test('minifies uppercase .SVG extension', async () => {
    const file = new File({ path: 'some.SVG', contents: Buffer.from(src) })
    const result = await run(svgo(), file)

    assert.ok(String(result.contents).startsWith('<svg'))
    assert.ok(!String(result.contents).includes('<!DOCTYPE'))
})

test('fails the stream on malformed svg', async () => {
    const file = new File({ path: 'malformed.svg', contents: Buffer.from(malformed) })

    await assert.rejects(run(svgo(), file), (error: Error) => {
        assert.match(error.message, /^gulp-svgo: malformed\.svg:/)
        assert.ok(error.cause instanceof Error)

        return true
    })
})

test('handles svgo options', async () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) })
    const stream = svgo({
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
    const result = await run(stream, file)

    assert.ok(String(result.contents).includes(doctype))
})

test('emits every file in order', async () => {
    const files = [
        new File({ path: 'a.svg', contents: Buffer.from(src) }),
        new File({ path: 'b.jpg', contents: Buffer.from('jpg data') }),
        new File({ path: 'c.svg', contents: Buffer.from(src) }),
    ]
    const out = await runAll(svgo(), files)

    assert.deepEqual(
        out.map(file => file.path),
        ['a.svg', 'b.jpg', 'c.svg'],
    )
    assert.ok(String(out[0].contents).startsWith('<svg'))
    assert.equal(String(out[1].contents), 'jpg data')
    assert.ok(String(out[2].contents).startsWith('<svg'))
})

test('a malformed file fails the stream even with other files queued', async () => {
    const files = [
        new File({ path: 'good.svg', contents: Buffer.from(src) }),
        new File({ path: 'bad.svg', contents: Buffer.from(malformed) }),
        new File({ path: 'later.svg', contents: Buffer.from(src) }),
    ]

    await assert.rejects(runAll(svgo(), files), /bad\.svg/)
})

test('invalid svgo configuration fails the stream', async () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) })
    // deliberately invalid plugin name, hence the cast
    const stream = svgo({ plugins: ['notARealPlugin'] } as unknown as Config)

    await assert.rejects(run(stream, file), /some\.svg/)
})

test('passes path for prefixing', async () => {
    const file = new File({ path: 'some.svg', contents: Buffer.from(src) })
    const stream = svgo({
        plugins: [
            {
                name: 'preset-default',
                params: {
                    overrides: {
                        cleanupIds: false,
                    },
                },
            },
            'prefixIds',
        ],
    })
    const result = await run(stream, file)

    assert.ok(String(result.contents).includes('some_svg__some-id'), String(result.contents))
})
