

const gulp = require('gulp');

gulp.paths = {
  src: 'src/front/src',
  dist: 'src/public',
  tmp: '.tmp',
  e2e: 'src/front/e2e',
};

require('require-dir')('./gulp');

gulp.task('default', ['clean', 'watch'], () => {
  gulp.start('build');
});
