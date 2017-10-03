/* jslint node:true */

// Required Modules
const 
  gulp = require('gulp'),
  gulpUtil = require('gulp-util'),
  path = require('path'),
  del = require('del'),
  cpx = require('cpx'),
  mkdirp = require('mkdirp'),
  cleanCSS = require('gulp-clean-css'),
  webpack = require('webpack'),
  webpackStream = require('webpack-stream');

// Env Variables
const 
  buildEnvironment = gulpUtil.env['env'] || 'dev',
  deploy = gulpUtil.env['deploy'];

// Build Configs
const 
  gulpConf = require(`./app.${buildEnvironment}.config.js`),
  paths = {
    jsEntry: 'src/js/app.js',
    cssEntry: 'src/css/app.css',
    distDir: path.resolve(__dirname, 'deploy', 'dist'),
    buildDir: 'deploy'
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
  cpx.copySync('src/**/*.{html,png,jpg,ico}', paths.buildDir);

  // Deployment
  if(!deploy) {
    next();
    return;
  }

  const rsync = require('gulp-rsync');
  const rsconf = Object.assign({
    root: `${paths.buildDir}/`,
    recursive: true
  }, gulpConf.rsync);
  
  if(!rsconf.hostname || !rsconf.destination) {
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
      filename: 'app.js'
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

  if(gulpConf.gulp.production) {
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
    .pipe(gulp.dest(paths.distDir));
});


// Task Defaults and Shortcuts
gulp.task('default', gulp.series('preBuild', gulp.parallel('webpack', 'cleancss'), 'postBuild'));
gulp.task('js', gulp.series('webpack', 'postBuild'));
gulp.task('css', gulp.series('cleancss', 'postBuild'));