# DispatchWebBoard

[![Build Status](https://travis-ci.org/FuelRats/DispatchWebBoard.svg?branch=master)](https://travis-ci.org/FuelRats/DispatchWebBoard) [![GitHub version](https://badge.fury.io/gh/FuelRats%2FDispatchWebBoard.svg)](https://badge.fury.io/gh/FuelRats%2FDispatchWebBoard)

The Official FuelRats rescue info tracking application.

## Deployment (How do I use this thing again?)

It is recommended that users wishing to just use the board should use [the official live version](https://dispatch.fuelrats.com) instead of running their own.

Setting up the DWB for your own uses requires oauth client registration with the Fuel Rats API. If you wish to develop and test against a live server, contact Clapton on the FuelRats IRC. ( [IRC Web Client](http://kiwi.fuelrats.com:7779/) / irc.fuelrats.com:+6697 ) The following guide assumes you have already done so, and have already registered your client.

### Prerequisites

-   Node.js & Yarn (for building the app)
-   A Web Server (We recommend NGINX)

### Setup

1. Clone the repo `git clone https://github.com/FuelRats/DispatchWebBoard.git`
2. install dependencies
    - `yarn`
3. Configure
    - Duplicate and rename app.prod.config_example.js to app.prod.config.js, then open it.
    - Refer to documentation in the example file to properly configure the config file.
4. Build
    - `yarn build`
5. Setup NGINX
    - Either copy the generated "deploy" directory to a directory on your webserver, or point the webserver directly to it.

After this, load the page from the server and ensure that it's working correctly. If you can login and get rescues, then all should be running properly.

## Contributing

PRs are always welcome! If you wish to see open issues, visit the [FuelRats JIRA](https://jira.fuelrats.com/projects/DWB/issues) (Project key: DWB)

See our [CONTRIBUTING.md](CONTRIBUTING.md) before developing for the Dispatch Web Board.

### Notes for Development

-   We use gulp for our build tasks. We recommend you install gulp-cli (`yarn global add gulp-cli`) to build the project for development, however `yarn gulp` works as well.
-   Use `gulp default` or `gulp` when building for development.
-   This project's gulpfile has a rsync runner which is ran during the postBuild phase. To use it, setup the `rsync.config.js` file first, then activate it by using the `--deploy` flag.
-   the gulp `--production` flag activates uglifyJS, cleans up any calls to `window.console.debug()`, and removes any code wrapped in `/* DEVBLOCK:START */` and `/* DEVBLOCK:END */`.

## Dependencies / Packages

### Build Dependencies

-   [clean-css](https://github.com/jakubpawlowicz/clean-css) - CSS compressor / build tool
-   [gulp 4](https://github.com/gulpjs/gulp/tree/4.0) - Task runner.
-   [npm](https://github.com/npm/npm) - Package Manager
-   [uglify-es](https://github.com/mishoo/UglifyJS2/tree/harmony) - JavaScript compressor
-   [Webpack](https://github.com/webpack/webpack) - JavaScript bundler / build tool

### Libraries

-   [clipboard.js](https://github.com/zenorocha/clipboard.js) - click-to-copy library.
-   [jQuery](https://github.com/jquery/jquery) - "The oversized swiss army knife".
