'use strict';

var gulp = require('gulp');

var paths = gulp.paths;

gulp.task('watch', ['inject', 'ng-config'], function () {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    'package.json'
  ], ['inject', 'ng-config']);
});

gulp.task('watch:build', ['inject', 'ng-config', 'build'], function () {
  gulp.watch([
    paths.src + '/*.html',
    paths.src + '/*.css',
    paths.src + '/*.js',
    paths.src + '/{app,components}/**/*.less',
    paths.src + '/{app,components}/**/*.js',
    'package.json'
  ], ['inject', 'ng-config', 'build']);
});