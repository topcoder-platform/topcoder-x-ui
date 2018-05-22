

module.exports = function (config) { /*eslint-disable-line func-names*/
  config.set({
    autoWatch: false,

    frameworks: ['jasmine'],

    browsers: ['PhantomJS'],

    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine',
    ],
  });
};
