/* jslint node:true */

// Required Modules
const 
  gulp = require('gulp'),
  gulpUtil = require('gulp-util'),
  path = require('path'),
  del = require('del'),
  cpx = require('cpx'),
  mkdirp = require('mkdirp'),
  rename = require('gulp-rename'),
  inject = require('gulp-inject-string'),
  cleanCSS = require('gulp-clean-css'),
  webpack = require('webpack'),
  webpackStream = require('webpack-stream');

// Consts

const
  DEFAULT_ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  DEFAULT_ID_LENGTH = 24;


// Utility Functions

/**
 * Generates a random base64 ID of a given char length
 * 
 * @param  {Number=} length Desired length of the ID
 * @return {String}         Generated base64 ID
 */
function makeID(length = DEFAULT_ID_LENGTH, chars = DEFAULT_ALLOWED_CHARS) {
  // Make array the size of the desired length, fill values of array with random characters then return as a single joined string.
  return Array.from(Array(length), () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// Variables

const 
  buildEnvironment = gulpUtil.env['env'] || 'dev',   // Sets which app config to use
  indexSuffix = gulpUtil.env['index'] || 'main',     // Sets which index file to use
  deploy = gulpUtil.env['deploy'],                   // Enables automatic deployment to remote server
  fingerprint = gulpUtil.env['buildid'] || makeID(); // Randomized fingerprint for the build.

gulpUtil.log(`Using Config file: ./app.${buildEnvironment}.config.js`);
gulpUtil.log(`Using Index file: ./src/index.${indexSuffix}.html`);
gulpUtil.log(`Using Build ID: ${fingerprint}`);

// Build Configs

const 
  gulpConf = require(`./app.${buildEnvironment}.config.js`),
  paths = {
    jsEntry: 'src/js/app.js',
    cssEntry: 'src/css/app.css',
    buildDir: 'deploy',
    distDir: path.resolve(__dirname, 'deploy', 'dist')
  };

// Tasks

gulp.task('preBuild', function(next) {
  del([paths.buildDir]).then(() => {
    mkdirp(paths.distDir, () => {
      next();
    });
  });
});

gulp.task('postBuild', function(next) {

  // Copy all static files from src dir.
  cpx.copySync('src/**/*.{png,jpg,ico}', paths.buildDir);

  // Deployment
  if (!deploy) { next(); return; }

  const rsync = require('gulp-rsync');
  const rsconf = Object.assign({
    root: `${paths.buildDir}/`,
    recursive: true,
    clean: true
  }, gulpConf.rsync);
  
  if (!rsconf.hostname || !rsconf.destination) {
    gulpUtil.log(`Deployment failed. Invalid rsync block in app.${buildEnvironment}.config.js`);
    next();
    return;
  }

  gulpUtil.log(`Deploying build to ${rsconf.hostname}`);
  return gulp.src(`${paths.buildDir}/**`)
    .pipe(rsync(rsconf));
});


gulp.task('webpack', function() {
  
  let conf = {
    bail: true,
    module: {
      rules: []
    },
    output: {
      filename: `app.${fingerprint}.js`
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
      exclude: () => false,
      maxModules: Infinity
    }
  };

  conf.plugins.push(new webpack.DefinePlugin({
    ENV: {
      FR: {
        'WSSURI': JSON.stringify(gulpConf.appconf.WssURI),
        'APIURI': JSON.stringify(gulpConf.appconf.ApiURI),
        'WEBURI': JSON.stringify(gulpConf.appconf.WebURI)
      },
      APP: {
        'CLIENTID': JSON.stringify(gulpConf.appconf.ClientID),
        'APPTITLE': JSON.stringify(gulpConf.appconf.AppTitle),
        'APPURI': JSON.stringify(gulpConf.appconf.AppURI),
        'APPSCOPE': JSON.stringify(gulpConf.appconf.AppScope),
        'APPNAMESPACE': JSON.stringify(gulpConf.appconf.AppNamespace)
      }
    }
  }));

  if (gulpConf.gulp.production) {
    // Minify
    const ujs = require('uglifyjs-webpack-plugin');
    conf.plugins.push(new ujs({
      uglifyOptions: {
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          pure_funcs: ['window.console.debug']
        },
        output: {
          comments: false
        }
      }
    }));

    // Strip debug code.
    conf.module.rules.push({
      test: /\.js$/,
      enforce: 'pre',
      exclude: /(node_modules|\.spec\.js)/,
      use: [
        {
          loader: 'webpack-strip-block',
          options: {
            start: 'DEVBLOCK:START',
            end: 'DEVBLOCK:END'
          }
        },
      ]
    });
  }

  return gulp.src(paths.jsEntry)
    .pipe(webpackStream(conf))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('cleancss', function() {
  return gulp.src(paths.cssEntry)
    .pipe(cleanCSS({
      level: 2,
      inline: ['local', 'fonts.googleapis.com'],
      format: gulpConf.gulp.production ? false : 'beautify'
    }))
    .pipe(rename({
      suffix: `.${fingerprint}`
    }))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('html', function() {
  return gulp.src(`./src/index.${indexSuffix}.html`)
    .pipe(inject.replace('<!-- inject:CSS -->', `<link rel="stylesheet" type="text/css" href="dist/app.${fingerprint}.css" />`))
    .pipe(inject.replace('<!-- inject:JS -->', `<script type="text/javascript" charset="utf-8" src="dist/app.${fingerprint}.js" async defer></script>`))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(paths.buildDir))
});


// Task Defaults and Shortcuts
gulp.task('default', gulp.series('preBuild', gulp.parallel('webpack', 'cleancss', 'html'), 'postBuild'));
gulp.task('js', gulp.series('webpack', 'postBuild'));
gulp.task('css', gulp.series('cleancss', 'postBuild'));