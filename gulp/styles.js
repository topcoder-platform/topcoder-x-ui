const gulp = require('gulp');

const paths = gulp.paths;

const $ = require('gulp-load-plugins')();

const styles = () => new Promise(async (resolve, reject) => {
  var lessOptions = {
    paths: [
      'node_modules',
      paths.src + '/app',
      paths.src + '/components'
    ]
  };

  var injectFiles = gulp.src([
    paths.src + '/{app,components}/**/*.less',
    '!' + paths.src + '/app/index.less',
    '!' + paths.src + '/app/vendor.less'
  ], { read: false });

  var injectOptions = {
    transform: function (filePath) {
      filePath = filePath.replace(paths.src + '/app/', '');
      filePath = filePath.replace(paths.src + '/components/', '../components/');
      return '@import \'' + filePath + '\';';
    },
    starttag: '// injector',
    endtag: '// endinjector',
    addRootSlash: false
  };

  const filter = (await import('gulp-filter')).default;
  const indexFilter = filter('index.less', { restore: true });

  return gulp.src([
    paths.src + '/app/index.less',
    paths.src + '/app/vendor.less'
  ])
    .pipe(indexFilter)
    .pipe($.inject(injectFiles, injectOptions))
    .pipe(indexFilter.restore)
    .pipe($.less(lessOptions))
    .pipe($.autoprefixer())
    .on('error', function handleError(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe(gulp.dest(paths.tmp + '/serve/app/'))
    .on('finish', resolve)
    .on('error', reject);
});

module.exports = { styles }
