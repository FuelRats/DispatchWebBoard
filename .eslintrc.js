module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: '@fuelrats/eslint-config-react',
  rules: {
    complexity: ['off'], // Disabled cuz we're not interested in fixing complexity problems with the old board.
  }
}
