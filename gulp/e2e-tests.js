const gulp = require('gulp');

const $ = require('gulp-load-plugins')();

const browserSync = require('browser-sync').create();

const paths = gulp.paths;

// Downloads the selenium webdriver
gulp.task('webdriver-update', $.protractor.webdriver_update);

gulp.task('webdriver-standalone', $.protractor.webdriver_standalone);

function runProtractor (done) {
  gulp.src(paths.e2e + '/**/*.js')
    .pipe($.protractor.protractor({
      configFile: 'src/front/protractor.conf.js',
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    })
    .on('end', function () {
      // Close browser sync server
      browserSync.exit();
      done();
    });
}

gulp.task('protractor', gulp.series('protractor:src'));
gulp.task('protractor:src', gulp.series('serve:e2e', 'webdriver-update', runProtractor));
gulp.task('protractor:dist', gulp.series('serve:e2e-dist', 'webdriver-update', runProtractor));
