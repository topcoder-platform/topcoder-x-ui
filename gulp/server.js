const gulp = require('gulp');

const paths = gulp.paths;

const util = require('util');

const browserSync = require('browser-sync').create(); // Import browser-sync
const middleware = require('./proxy');
const { inject } = require('./inject');

function browserSyncInit(baseDir, files, browser) {
  browser = browser === undefined ? 'default' : browser;

  const routes = null;
  if (baseDir === paths.src || (util.isArray(baseDir) && baseDir.indexOf(paths.src) !== -1)) {
    routes = {
      '/node_modules': 'node_modules'
    };
  }

  browserSync.init({
    startPath: '/',
    server: {
      baseDir: baseDir,
      middleware: middleware,
      routes: routes
    },
    browser: browser,
    host: 'topcoderx.topcoder.com',
    open: 'external',
    port: 80
  });

  // Watch files and reload on change
  gulp.watch([
    paths.tmp + '/serve/{app,components}/**/*.css',
    paths.src + '/{app,components}/**/*.js',
    paths.src + 'src/assets/images/**/*',
    paths.tmp + '/serve/*.html',
    paths.tmp + '/serve/{app,components}/**/*.html',
    paths.src + '/{app,components}/**/*.html'
  ]).on('change', browserSync.reload);
}

const serveFn = () => browserSyncInit([paths.tmp + '/serve', paths.src]);
const serve = gulp.series('build', 'watch', serveFn);
gulp.task('serve', serve);

const serveDistFn = () => browserSyncInit(paths.dist);
const serveDist = gulp.series('build', serveDistFn);
gulp.task('serve:dist', serveDist);

const serveE2eFn = () => browserSyncInit([paths.tmp + '/serve', paths.src], null, []);
const serveE2e = gulp.series(inject, serveE2eFn);
gulp.task('serve:e2e', serveE2e);

const serveE2eDistFn = () => browserSyncInit(paths.dist, null, []);
const serveE2eDist = gulp.series('build', serveE2eDistFn);
gulp.task('serve:e2e-dist', serveE2eDist);

module.exports = { serve, serveDist, serveE2e, serveE2eDist }
