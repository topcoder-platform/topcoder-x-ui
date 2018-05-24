'use strict';

var gulp = require('gulp');

var paths = gulp.paths;

gulp.task('watch', ['inject'], function () {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    paths.src + '/{app,components}/**/*.html',
    'package.json'
  ], ['inject']);
});

gulp.task('watch:build', ['inject', 'build'], function () {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    paths.src + '/{app,components}/**/*.html',
    'package.json'
  ], ['inject', 'watch:build']);
});