import type { OxfmtConfig } from 'oxfmt'

const config: OxfmtConfig = {
    semi: false,
    tabWidth: 4,
    singleQuote: true,
    arrowParens: 'avoid',
    sortPackageJson: true,
    quoteProps: 'consistent',
    sortImports: {
        newlinesBetween: false,
    },
}

export default config
