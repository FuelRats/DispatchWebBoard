module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: '@fuelrats/eslint-config',
  rules: {
    complexity: ['off'], // Disabled cuz we're not interested in fixing complexity problems with the old board.
    'prefer-promise-reject-errors': ['off'], // because of code to be fixed later
  }
}
