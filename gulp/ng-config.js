'use strict';

var gulp = require('gulp');

var gulpNgConfig = require('gulp-ng-config');

var paths = gulp.paths;

gulp.task('ng-config', function () {
    gulp.src('src/front/config.json')
        .pipe(
            gulpNgConfig('app.constants', {
                environment: process.env.BUILD_ENV || 'dev',
            }))
        .pipe(gulp.dest(paths.src + '/app/'))
});
