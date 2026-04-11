module.exports = {
  root: true,
  ignorePatterns: ['public/**', 'dist/**', 'node_modules/**', 'index.html', '**/*.html'],
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: ['airbnb-base', 'airbnb-typescript/base', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.eslint.json']
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.eslint.json'
      }
    }
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'newline-before-return': 'error',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: ['const', 'let'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] }
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true
      }
    ],
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'no-console': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never'
      }
    ],
    'import/prefer-default-export': 'off'
  },
  overrides: [
    {
      files: ['.eslintrc.cjs', '**/*.config.*', 'vite.config.ts'],
      parserOptions: {
        project: null
      }
    },
    {
      files: ['**/*.html'],
      env: { browser: true }
    },
    {
      files: ['src/modules/solutions/**/*.ts'],
      rules: {
        'no-bitwise': 'off'
      }
    },
    {
      files: ['vite.config.ts', '**/*.config.*', '.eslintrc.cjs'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
      }
    }
  ]
};
