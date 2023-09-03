const gulp = require('gulp');
const { esbuild } = require('./esbuild');

const paths = gulp.paths;

const $ = require('gulp-load-plugins')();

const inject = () => {
  const injectStyles = gulp.src([
    paths.tmp + '/serve/{app,components}/**/*.css',
    '!' + paths.tmp + '/serve/app/vendor.css'
  ], { read: false });

  const injectScripts = gulp.src([
    paths.src + '/{app,components}/**/*.js',
    '!' + paths.src + '/{app,components}/**/*.spec.js',
    '!' + paths.src + '/{app,components}/**/*.mock.js'
  ]).pipe($.angularFilesort());

  const injectOptions = {
    ignorePath: [paths.src, paths.tmp + '/serve'],
    addRootSlash: false
  };

  return gulp.src(paths.src + '/*.html')
    .pipe($.inject(injectStyles, injectOptions))
    .pipe($.inject(injectScripts, injectOptions))
    .pipe(gulp.dest(paths.tmp + '/serve'));
}

const injectTask = gulp.series(esbuild, inject);
gulp.task('inject', injectTask);

module.exports = { inject: injectTask }
