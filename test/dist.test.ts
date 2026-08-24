import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createRequire } from 'node:module'
import type { Transform } from 'node:stream'
import { test } from 'node:test'
import File from 'vinyl'

// Resolved at runtime rather than as an import so typechecking passes before dist/ is built.
const DIST = '../dist/index.js'
const require = createRequire(import.meta.url)

type Plugin = (options?: unknown) => Transform

const src = '<svg viewBox="0 0 1 1"><!--comment--><rect width="1" height="1"/></svg>'

const optimizeOne = (plugin: Plugin, file: File): Promise<File> =>
    new Promise((resolve, reject) => {
        const stream = plugin()
        const out: File[] = []

        stream.on('data', (data: File) => out.push(data))
        stream.on('error', reject)
        stream.on('end', () => {
            if (out.length === 1) {
                resolve(out[0])
            } else {
                reject(new Error(`expected 1 file from stream, got ${out.length}`))
            }
        })
        stream.end(file)
    })

test('dist works via CommonJS require', async () => {
    const plugin = require(DIST) as Plugin

    assert.equal(typeof plugin, 'function')

    const file = new File({ path: 'a.svg', contents: Buffer.from(src) })
    const result = await optimizeOne(plugin, file)
    const output = String(result.contents)

    assert.ok(output.startsWith('<svg'), output)
    assert.ok(!output.includes('<!--'))
})

test('dist works via ESM default import', async () => {
    const mod = (await import(DIST)) as { default: Plugin }

    assert.equal(typeof mod.default, 'function')

    const file = new File({ path: 'a.svg', contents: Buffer.from(src) })
    const result = await optimizeOne(mod.default, file)
    const output = String(result.contents)

    assert.ok(output.startsWith('<svg'), output)
    assert.ok(!output.includes('<!--'))
})
