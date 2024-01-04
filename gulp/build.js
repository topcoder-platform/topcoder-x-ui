const gulp = require('gulp');
const eslint = require('gulp-eslint-new');
const gulpIf = require('gulp-if');
const { inject } = require('./inject')

const paths = gulp.paths;

const $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'uglify-save-license', 'del']
});

const partials = () => {
  return gulp.src([
    paths.src + '/{app,components}/**/*.html',
    paths.tmp + '/{app,components}/**/*.html'
  ])
    .pipe($.htmlmin({
      removeEmptyAttributes: true,
      removeAttributeQuotes: true,
      processConditionalComments: true,
      collapseWhitespace: true,
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'topcoderX',
      transformUrl: url => url.replace(/^\/+/, '')
    }))
    .pipe(gulp.dest(paths.tmp + '/partials/'))
}
gulp.task('partials', partials);

const html = () => {
  return new Promise(async (resolve, reject) => {
    const partialsInjectFile = gulp.src(paths.tmp + '/partials/templateCacheHtml.js', { read: false });
    const partialsInjectOptions = {
      starttag: '<!-- inject:partials -->',
      ignorePath: paths.tmp + '/partials',
      addRootSlash: false
    };
    const rev = (await import('gulp-rev')).default;

    return gulp.src(paths.tmp + '/serve/*.html')
      .pipe($.inject(partialsInjectFile, partialsInjectOptions))
      .pipe($.useref())
      .pipe(gulpIf('!**/*.html', rev()))
      .pipe(gulpIf('**/*.js', $.ngAnnotate()))
      .pipe(gulpIf('**/*.js', $.uglify()))
      .pipe(gulpIf('**/*.css', $.replace(/\.?\.?\/node_modules\/\w+-?\/?\w+\/fonts\/?/g, '../fonts/')))
      .pipe(gulpIf('**/*.css', $.csso()))
      .pipe(gulpIf('**/*.css', $.cssimport()))
      .pipe($.revReplace())
      .pipe(gulpIf('**/*.html', $.htmlmin({
        removeEmptyAttributes: true,
        removeAttributeQuotes: true,
        processConditionalComments: true,
        collapseWhitespace: true,
      })))
      .pipe(gulp.dest(paths.dist + '/'))
      .pipe($.size({ title: paths.dist + '/', showFiles: true }))
      .on('finish', resolve)
      .on('error', reject);
  });
}
const htmlTask = gulp.series(inject, partials, html);
gulp.task('html', htmlTask);

const images = () => {
  return gulp.src(paths.src + '/assets/images/**/*')
    .pipe(gulp.dest(paths.dist + '/assets/images/'));
}
gulp.task('images', images);

const fonts = () => new Promise(async (resolve, reject) => {
  const filter = (await import('gulp-filter')).default;
  return gulp.src([
    "node_modules/bootstrap/dist/fonts/*.{eot,svg,ttf,woff,woff2}",
    "node_modules/footable/css/fonts/*.{eot,svg,ttf,woff,woff2}"
  ])
    .pipe(filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest(paths.dist + '/fonts/'))
    .pipe(gulp.dest(paths.dist + '/styles/fonts/'))
    .on('finish', resolve)
    .on('error', reject);
});
gulp.task('fonts', fonts);

const fontAwesome = () => {
  return gulp.src('node_modules/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2}')
    .pipe(gulp.dest(paths.dist + '/fonts/'));
}
gulp.task('fontawesome', fontAwesome);

const misc = () => {
  return gulp.src(paths.src + '/**/*.ico')
    .pipe(gulp.dest(paths.dist + '/'));
}
gulp.task('misc', misc);

const clean = (done) => {
  $.del([paths.dist + '/', paths.tmp + '/', paths.src + '/app/config.js'], done);
}
gulp.task('clean', clean);

const lint = () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp
    .src(['src/**/*.js', '!src/front/e2e/**/*.js', '!src/public/**', '!gulp/**', '!node_modules/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint({ fix: true }))
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
}
gulp.task('lint', lint);

const build = gulp.series(lint, htmlTask, images, fonts, fontAwesome, misc);
gulp.task('build', build);

module.exports = { clean, build };
