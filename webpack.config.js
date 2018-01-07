/* eslint import/no-commonjs: "off" */

const
  path = require('path'),

  directoryNamedWebpackPlugin = require('directory-named-webpack-plugin');

module.exports = {
  bail: true,
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            'presets' : [
              '@babel/react'
            ]
          }
        }
      }
    ]
  },
  output: {
    filename: 'app.js'
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.resolve(__dirname, 'src', 'js'), 
      path.resolve(__dirname, 'node_modules')
    ],
    plugins: [
      new directoryNamedWebpackPlugin()
    ]
  },
  stats: { // Full preset object required due to an error with current version of webpack? ¯\_(ツ)_/¯
    entrypoints: true,
    modules: false,
    chunks: true,
    chunkModules: true,
    chunkOrigins: true,
    depth: true,
    optimizationBailout: true,
    errorDetails: true,
    publicPath: true,
    exclude: () => false,
    maxModules: Infinity
  }
};