const gulp = require('gulp');
const { inject } = require('./inject');
const { build } = require('./build');

const paths = gulp.paths;

const watchFn = () => {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    paths.src + '/{app,components}/**/*.html',
    'package.json'
  ], gulp.series(inject));
};
const watch = gulp.series(inject, watchFn);
gulp.task('watch', watch);

const watchBuildFn = () => {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    paths.src + '/{app,components}/**/*.html',
    'package.json'
  ], gulp.series(inject, build));
}
const watchBuild = gulp.series(inject, build, watchBuildFn)
gulp.task('watch:build', watchBuild);
gulp.task('build:watch', watchBuild);

module.exports = { watch, watchBuild }
