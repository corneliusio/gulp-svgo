const path = require('path');
const SVGO = require('svgo');
const { Transform } = require('stream');

const COLORS = { yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };

module.exports = options => {
    const svgo = new SVGO(options || {});

    return new Transform({
        objectMode: true,
        transform(file, encoding, next) {
            if (!file.path || file.isNull() || path.extname(file.path).toLowerCase() !== '.svg') {
                return next(null, file);
            }

            if (file.isStream() || !file.contents.length) {
                return next(null, file);
            }

            svgo.optimize(file.contents.toString('utf8'), { path: file.path }).then(result => {
                file.contents = Buffer.from(result.data);

                next(null, file);
            }).catch(error => {
                const filepath = path.relative(process.cwd(), file.path);
                const message = error && error.message ? error.message : String(error || '');

                if (message) {
                    console.error(`${COLORS.yellow}gulp-svgo:${COLORS.red}`, message.replace(
                        'Line:', `${COLORS.reset}File: ${filepath}\nLine:`
                    ).replace(/\n/g, '\n\t').trim());
                }

                next(null, file);
            });
        }
    });
};
