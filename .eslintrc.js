module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: '@fuelrats/eslint-config',
  parserOptions: {
    "ecmaVersion": 2018,
    "sourceType": "module",
  },
  rules: {
    complexity: ['off'], // Disabled cuz we're not interested in fixing complexity problems with the old board.
    'prefer-promise-reject-errors': ['off'], // because of code to be fixed later
  }
}
