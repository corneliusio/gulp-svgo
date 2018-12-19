const path = require('path');
const SVGO = require('svgo');
const { Transform } = require('stream');

module.exports = options => {
    let stream = new Transform({ objectMode: true }),
        settings = options || {},
        svgo = new SVGO(settings);

    stream._transform = (file, encoding, next) => {

        if (path.extname(file.path).toLowerCase() !== '.svg' || !file.contents.toString('utf8')) {
            return next(null, file);
        }

        if (file.isStream()) {
            return next(null, file);
        }

        if (file.isBuffer()) {
            svgo.optimize(file.contents.toString('utf8'), { path: file.path }).then(result => {
                file.contents = Buffer.from(result.data);

                return next(null, file);
            }).catch(error => {
                const colors = { yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };
                const filepath = path.relative(process.cwd(), file.path);
                const message = error.message || error;

                if (message) {
                    console.error(`${colors.yellow}gulp-svgo:${colors.red}`, message.replace(
                        'Line:', `${colors.reset}File: ${filepath}\nLine:`
                    ).replace(/\n/g, `\n\t`).trim());
                }

                return next(null);
            });
        }
    };

    return stream;
};
