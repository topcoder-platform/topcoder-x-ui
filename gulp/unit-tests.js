const gulp = require('gulp');

const $ = require('gulp-load-plugins')();

const wiredep = require('wiredep');

const paths = gulp.paths;

function runTests(singleRun) {
  const bowerDeps = wiredep({
    directory: 'node_modules',
    exclude: ['bootstrap-sass-official'],
    dependencies: true,
    devDependencies: true
  });

  const testFiles = bowerDeps.js.concat([
    paths.src + '/{app,components}/**/*.js'
  ]);

  return gulp.src(testFiles)
    .pipe($.karma({
      configFile: 'src/front/karma.conf.js',
      action: (singleRun) ? 'run' : 'watch'
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
}

const testFn = (done) => runTests(true).on('end', done);
gulp.task('test', testFn);

const testAutoFn = (done) => runTests(false).on('end', done);
gulp.task('test:auto', testAutoFn);

module.exports = { test: testFn, testAuto: testAutoFn };
