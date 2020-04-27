/* jslint node:true */

// Required Modules
const cpx = require('cpx')
const del = require('del')
const gulp = require('gulp')
const cleanCSS = require('gulp-clean-css')
const inject = require('gulp-inject-string')
const rename = require('gulp-rename')
const gulpUtil = require('gulp-util')
const mkdirp = require('mkdirp')
const path = require('path')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')

// Consts
const DEFAULT_ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_ID_LENGTH = 24


// Utility Functions

/**
 * Generates a random base64 ID of a given char length
 *
 * @param   {number=} length Desired length of the ID
 * @param   {string}  chars  allowed chars in ID
 * @returns {string}         Generated base64 ID
 */
// Make array the size of the desired length, fill values of array with random characters then return as a single joined string.
const makeID = (length = DEFAULT_ID_LENGTH, chars = DEFAULT_ALLOWED_CHARS) => {
  return Array.from(Array(length), () => {
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }).join('')
}


// Variables

// Sets which app config to use
const buildEnvironment = gulpUtil.env.env || 'dev'

// Sets which index file to use
const indexSuffix = gulpUtil.env.index || 'main'

// Enables automatic deployment to remote server
const deploy = gulpUtil.env.deploy || false

// Randomized fingerprint for the build.
const fingerprint = gulpUtil.env.buildid || makeID()

gulpUtil.log(`Using Config file: ./app.${buildEnvironment}.config.js`)
gulpUtil.log(`Using Index file: ./src/index.${indexSuffix}.html`)
gulpUtil.log(`Using Build ID: ${fingerprint}`)

// Build Configs
// eslint-disable-next-line import/no-dynamic-require
const gulpConf = require(`./app.${buildEnvironment}.config.js`)


const paths = {
  jsEntry: 'src/js/app.js',
  cssEntry: 'src/css/app.css',
  buildDir: 'deploy',
  distDir: path.resolve(__dirname, 'deploy', 'dist'),
}

// Tasks

gulp.task('preBuild', async (next) => {
  await del([`${paths.buildDir}/**`])
  mkdirp.sync(paths.distDir)
  next()
})

gulp.task('postBuild', (next) => {
  // Copy all static files from src dir.
  cpx.copySync('src/**/*.{png,jpg,ico}', paths.buildDir)

  // Deployment
  if (!deploy) {
    next()
    return undefined
  }

  const rsync = require('gulp-rsync') /* eslint-disable-line global-require */ // only load rsync if needed
  const rsconf = {
    root: `${paths.buildDir}/`,
    recursive: true,
    clean: true,
    ...gulpConf.rsync,
  }

  if (!rsconf.hostname || !rsconf.destination) {
    gulpUtil.log(`Deployment failed. Invalid rsync block in app.${buildEnvironment}.config.js`)
    next()
    return undefined
  }

  gulpUtil.log(`Deploying build to ${rsconf.hostname}`)
  return gulp.src(`${paths.buildDir}/**`)
    .pipe(rsync(rsconf))
})


gulp.task('webpack', () => {
  const conf = {
    mode: gulpConf.gulp.production ? 'production' : 'development',
    devtool: gulpConf.gulp.production ? false : 'source-map',
    bail: true,
    module: {
      rules: [],
    },
    output: {
      filename: `app.${fingerprint}.js`,
    },
    plugins: [],
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
      exclude: () => {
        return false
      },
      maxModules: Infinity,
    },
  }

  conf.plugins.push(new webpack.DefinePlugin({
    ENV: {
      FR: {
        WSSURI: JSON.stringify(gulpConf.appconf.WssURI),
        APIURI: JSON.stringify(gulpConf.appconf.ApiURI),
        WEBURI: JSON.stringify(gulpConf.appconf.WebURI),
        SYSTEMURI: JSON.stringify(gulpConf.appconf.SystemsURI),
      },
      APP: {
        CLIENTID: JSON.stringify(gulpConf.appconf.ClientID),
        APPTITLE: JSON.stringify(gulpConf.appconf.AppTitle),
        APPURI: JSON.stringify(gulpConf.appconf.AppURI),
        APPSCOPE: JSON.stringify(gulpConf.appconf.AppScope),
        APPNAMESPACE: JSON.stringify(gulpConf.appconf.AppNamespace),
      },
    },
  }))

  if (gulpConf.gulp.production) {
    // Strip debug code.
    conf.module.rules.push({
      test: /\.js$/u,
      enforce: 'pre',
      exclude: /(node_modules|\.spec\.js)/u,
      use: [
        {
          loader: 'webpack-strip-block',
          options: {
            start: 'DEVBLOCK:START',
            end: 'DEVBLOCK:END',
          },
        },
      ],
    })
  }

  return gulp.src(paths.jsEntry)
    .pipe(webpackStream(conf))
    .pipe(gulp.dest(paths.distDir))
})

gulp.task('cleancss', () => {
  return gulp.src(paths.cssEntry)
    .pipe(cleanCSS({
      level: 2,
      inline: ['local', 'fonts.googleapis.com'],
      format: gulpConf.gulp.production ? false : 'beautify',
    }))
    .pipe(rename({
      suffix: `.${fingerprint}`,
    }))
    .pipe(gulp.dest(paths.distDir))
})

gulp.task('html', () => {
  return gulp.src(`./src/index.${indexSuffix}.html`)
    .pipe(inject.replace('<!-- inject:CSS -->', `<link rel="stylesheet" type="text/css" href="dist/app.${fingerprint}.css" />`))
    .pipe(inject.replace('<!-- inject:JS -->', `<script type="text/javascript" charset="utf-8" src="dist/app.${fingerprint}.js" async defer></script>`))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(paths.buildDir))
})


// Task Defaults and Shortcuts
gulp.task('default', gulp.series('preBuild', gulp.parallel('webpack', 'cleancss', 'html'), 'postBuild'))
gulp.task('js', gulp.series('webpack', 'postBuild'))
gulp.task('css', gulp.series('cleancss', 'postBuild'))
