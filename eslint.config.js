import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/', 'tests/'] },
  {
    files: ['src/**/*.js', '*.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { vars: 'all', args: 'none', caughtErrors: 'none' }] },
  },
];
