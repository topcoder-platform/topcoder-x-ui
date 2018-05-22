'use strict';

var gulp = require('gulp');
var fs = require('fs');
var gulpNgConfig = require('gulp-ng-config');

gulp.task('ng-config', function () {
  var config = require('../src/front/config.js');
  fs.writeFileSync('./src/front/config.json', JSON.stringify(config));
  gulp.src('./src/front/config.json')
    .pipe(
      gulpNgConfig('app.constants', {
        environment: process.env.BUILD_ENV || 'dev',
      })
    )
    .pipe(gulp.dest('./src/front/src/app'))
});