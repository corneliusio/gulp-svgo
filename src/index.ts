import { Buffer } from 'node:buffer'
import path from 'node:path'
import { Transform } from 'node:stream'
import { optimize, type Config } from 'svgo'
import type File from 'vinyl'

const gulpSvgo = (options: Config = {}): Transform =>
    new Transform({
        objectMode: true,
        transform(file: File, encoding, next) {
            if (!file.path || file.isNull() || path.extname(file.path).toLowerCase() !== '.svg') {
                next(null, file)

                return
            }

            if (file.isStream()) {
                next(new Error('gulp-svgo: streaming not supported'))

                return
            }

            if (!file.isBuffer() || file.contents.length === 0) {
                next(null, file)

                return
            }

            try {
                const result = optimize(file.contents.toString('utf8'), {
                    ...options,
                    path: file.path,
                })

                file.contents = Buffer.from(result.data)
                next(null, file)
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)

                next(new Error(`gulp-svgo: ${file.relative}: ${message}`, { cause: error }))
            }
        },
    })

export default gulpSvgo
export { gulpSvgo as 'module.exports' }
