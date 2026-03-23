module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }]
  },
  overrides: [
    {
      files: ['**/*.html'],
      env: { browser: true }
    }
  ]
};
