module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: '@fuelrats/eslint-config-react',
  parserOptions: {
    "ecmaVersion": 2018,
    "sourceType": "module",
  },
  rules: {
    complexity: ['off'], // Disabled cuz we're not interested in fixing complexity problems with the old board.
  }
}
