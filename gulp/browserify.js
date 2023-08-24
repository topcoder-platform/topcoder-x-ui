const gulp = require('gulp');
const browserify = require('browserify');
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const gutil = require('gulp-util');
const fs = require('fs');
const { styles } = require('./styles');

const browserifyFn = () => {
  const cssFilePath = gulp.paths.tmp + '/serve/app/bundle.css';

  // Delete file if exists
  if (fs.existsSync(cssFilePath)) {
    fs.unlinkSync(cssFilePath);
  }

  return browserify('./src/front/src/index.js')
    .transform(require('browserify-css'), {
      rootDir: 'src',
      debug: true,
      onFlush: function (options, done) {
        fs.appendFileSync(cssFilePath, options.data);

        // Do not embed CSS into a JavaScript bundle
        done(null);
      }
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .on('error', function (e) {
      gutil.log("Browserify Error", gutil.colors.red(e.message));
    })
    .pipe(gulp.dest(gulp.paths.tmp + '/serve/app'));
};

const browserify = gulp.series(styles, browserifyFn);
gulp.task('browserify', browserify);

module.exports = { browserify }
