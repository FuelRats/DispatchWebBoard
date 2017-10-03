/* jslint node:true */

const gulp = require('gulp'),
  gulpUtil = require('gulp-util'),
  path = require('path'),
  del = require('del'),
  cpx = require('cpx'),
  mkdirp = require('mkdirp'),
  cleanCSS = require('gulp-clean-css'),
  webpack = require('webpack-stream');

const production = gulpUtil.env['production'] || gulpUtil.env['rs-prod'];
const deploy = gulpUtil.env['deploy'];

const paths = {
  jsEntry: 'src/js/app.js',
  cssEntry: 'src/css/app.css',
  distDir: path.resolve(__dirname, 'deploy', 'dist'),
  buildDir: 'deploy'
};

gulp.task('preBuild', function(next) {
  del([paths.buildDir]).then(() => {
    mkdirp(paths.distDir, () => {
      next();
    });
  });
});

gulp.task('postBuild', function(next) {
  cpx.copySync('src/**/*.{html,png,jpg,ico}', paths.buildDir);
  
  if(!deploy) {
    next();
    return;
  }

  const rsync = require('gulp-rsync');
  const rsconf = Object.assign({
    root: `${paths.buildDir}/`,
    recursive: true
  }, require('./rsync.config.js'));
  
  if(!rsconf.hostname || !rsconf.destination) {
    gulpUtil.log('Deployment failed. Invalid rsync.config.js');
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

  if(production) {
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
    .pipe(webpack(conf))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('cleancss', function() {
  return gulp.src(paths.cssEntry)
    .pipe(cleanCSS({
      level: 2,
      inline: ['local', 'fonts.googleapis.com'],
      format: production ? false : 'beautify'
    }))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('default', gulp.series('preBuild', gulp.parallel('webpack', 'cleancss'), 'postBuild'));
gulp.task('js', gulp.series('webpack', 'postBuild'));
gulp.task('css', gulp.series('cleancss', 'postBuild'));