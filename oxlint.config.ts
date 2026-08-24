import type { OxlintConfig } from 'oxlint'

const config: OxlintConfig = {
    plugins: ['oxc', 'typescript', 'unicorn'],
    categories: {
        correctness: 'warn',
    },
    env: {
        builtin: true,
    },
    rules: {
        'typescript/no-explicit-any': 'warn',
        'curly': 'warn',
        'no-else-return': 'warn',
        'no-global-assign': 'warn',
        'no-unmodified-loop-condition': 'warn',
        'no-useless-escape': 'warn',
        'new-cap': 'warn',
        'no-continue': 'off',
        'no-lonely-if': 'warn',
        'no-unneeded-ternary': 'warn',
        'constructor-super': 'error',
        'no-class-assign': 'warn',
        'no-const-assign': 'error',
        'no-duplicate-imports': 'warn',
        'no-this-before-super': 'error',
        'no-useless-computed-key': 'warn',
        'no-useless-constructor': 'warn',
        'prefer-rest-params': 'warn',
        'prefer-spread': 'warn',
        'prefer-template': 'warn',
        'require-yield': 'warn',
        'guard-for-in': 'warn',
        'eqeqeq': 'warn',
        'no-var': 'warn',
        'require-await': 'warn',
        'no-unused-vars': [
            'warn',
            {
                caughtErrorsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            },
        ],
    },
}

export default config
