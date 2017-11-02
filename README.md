# DispatchWebBoard
[![Build Status](https://travis-ci.org/FuelRats/DispatchWebBoard.svg?branch=master)](https://travis-ci.org/FuelRats/DispatchWebBoard) [![GitHub version](https://badge.fury.io/gh/FuelRats%2FDispatchWebBoard.svg)](https://badge.fury.io/gh/FuelRats%2FDispatchWebBoard) 

The Official FuelRats rescue info tracking application.

## Table of contents
* [DispatchWebBoard](#dispatchwebboard)
* [Table of contents](#table-of-contents)
* [Setup](#setup)
  * [Prerequisites](#prerequisites)
  * [installation](#installation)
* [Contributing](#contributing)
  * [Issue Reporting](#issue-reporting)
  * [Pull Requests](#pull-requests)
  * [Notes for Development](#notes-for-development)
* [Dependencies / Packages](#dependencies--packages)
  * [Build Dependencies](#build-dependencies)
  * [Libraries](#libraries)

## Setup
It's recommended that users wishing to just use the board should use [the official live version](https://dispatch.fuelrats.com) instead of running their own. 

Setting up the DWB for your own uses requires oauth client registration with the Fuel Rats API. If you wish to develop and test against a live server, contact Clapton on the FuelRats IRC ( [IRC Web Client](http://kiwi.fuelrats.com:7779/) / irc.fuelrats.com:+6697 ). The following setup guide assumes you have already done so.

### Prerequisites 
* Node.js & NPM (or yarn)
* An HTTPS enabled Web Server (We recommend NGINX)

### Installation
1. Clone the repo `git clone https://github.com/FuelRats/DispatchWebBoard.git`
2. install dependencies
    * `npm install` or `yarn`
3. Configure
    * Duplicate and rename app.prod.config_example.js to app.prod.config.js, then open it.
    * Refer to documentation in the example file to properly configure the config file.
4. Build
    * `npm run build` or `yarn run build`
5. Setup NGINX
    * Either copy the generated "deploy" directory to a directory on your webserver, or point the webserver directly to it.

After this, load the page from the server and ensure that it's working correctly. If you can login and get rescues, then all should be running properly.

## Contributing
We welcome contributions of any sort!

### Issue Reporting
If you wish to open an issue, or view open issues, visit the [FuelRats JIRA](https://jira.fuelrats.com/projects/DWB/issues) (Project key: DWB)

### Pull Requests
PRs are always welcome, but please be sure to read our [CONTRIBUTING.md](CONTRIBUTING.md) before forking!
Below you will find some tips to help you along your way.

### Notes for Development
* We use gulp for our build tasks. We recommend you install gulp-cli (`npm i -g gulp-cli` or `yarn global add gulp-cli`) to build the project for development, however `npm run gulp` works as well.
* Use `gulp default` or `gulp` when building for development.
* This project's gulpfile has a rsync runner which is ran during the postBuild phase. To use it, setup the `rsync` section of the `app.<env>.config.js` file first, then activate it by using the `--deploy` flag at build time.
* The optional gulp flag `--index=<name>` can be used to specify the main html file. custom HTML files can be formatted as `index.<name>.html` in the src directory.
* The gulp `--production` flag can be used to clean up debug code, minify the CSS and JS files, and perform other optimizations for a production environment.


## Dependencies / Packages

### Build Dependencies
* [Babel 7](https://github.com/babel/babel) - JSX Transpiler
* [clean-css](https://github.com/jakubpawlowicz/clean-css) - CSS compressor / build tool
* [gulp 4](https://github.com/gulpjs/gulp/tree/4.0) - Task runner.
* [npm](https://github.com/npm/npm) - Package Manager
* [uglify-es](https://github.com/mishoo/UglifyJS2/tree/harmony) - JavaScript compressor
* [Webpack](https://github.com/webpack/webpack) - JavaScript bundler / build tool

### Libraries
* [React.js](https://github.com/facebook/react) - UI Manager
* [clipboard.js](https://github.com/zenorocha/clipboard.js) - click-to-copy library.
* [jQuery](https://github.com/jquery/jquery) - "The oversized swiss army knife".