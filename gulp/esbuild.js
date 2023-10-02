const gulp = require('gulp');
const { createGulpEsbuild } = require('gulp-esbuild')
const colors = require('ansi-colors')
const log = require('fancy-log')
const fs = require('fs');
const { styles } = require('./styles');

const esbuild = () => {
  const gulpEsbuild = createGulpEsbuild({
    piping: true,
  })

  const cssFilePath = gulp.paths.tmp + '/serve/app/bundle.css';

  // Delete file if exists
  if (fs.existsSync(cssFilePath)) {
    fs.unlinkSync(cssFilePath);
  }

  return gulp.src('./src/front/src/index.js')
    .pipe(gulpEsbuild({
      outfile: 'bundle.js',
      bundle: true,
      minify: process.env.DISABLE_MINIFY !== 'true',
      sourcemap: true,
      target: 'es2015',
      legalComments: 'external',
      loader: {
        '.eot': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.svg': 'file'
      }
    }))
    .on('error', function (e) {
      log.error("ESBuild Error", colors.red(e.message));
    })
    .pipe(gulp.dest(gulp.paths.tmp + '/serve/app'));
};

const esbuildTask = gulp.series(styles, esbuild);
gulp.task('esbuild', esbuildTask);

module.exports = { esbuild: esbuildTask }
