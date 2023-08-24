const gulp = require('gulp');
gulp.paths = {
  src: 'src/front/src',
  dist: 'src/public',
  tmp: '.tmp',
  e2e: 'src/front/e2e',
};

const { clean, build } = require('./gulp/build');
const { watch } = require('./gulp/watch');
gulp.task('default', gulp.series(clean, watch, build));
