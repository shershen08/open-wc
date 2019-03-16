const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');

/**
 * Creates a basic karma configuration file.
 *
 * See demo/karma.conf.js for an example implementation.
 */
module.exports = config => ({
  browsers: ['ChromeHeadlessNoSandbox'],

  customLaunchers: {
    ChromeHeadlessNoSandbox: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },

  plugins: [
    require.resolve('karma-mocha'),
    require.resolve('karma-mocha-reporter'),
    require.resolve('karma-static'),
    require.resolve('karma-chrome-launcher'),
    require.resolve('karma-source-map-support'),
    require.resolve('karma-coverage-istanbul-reporter'),
    require('./karma-rollup/index.js'),
  ],

  frameworks: ['mocha', 'source-map-support', 'rollup'],

  middleware: ['static'],

  static: {
    path: path.join(__dirname, ''),
  },

  reporters: ['mocha', 'coverage-istanbul'],

  client: {
    mocha: {
      reporter: 'html',
    },
  },

  mochaReporter: {
    showDiff: true,
  },

  rollup: {
    plugins: [
      resolve(),
      babel({
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          '@babel/plugin-syntax-import-meta',
          // rollup rewrites import.meta.url, but makes them point to the file location after bundling
          // we want the location before bundling
          ['bundled-import-meta', { importStyle: 'baseURI' }],
        ],
        presets: [
          [
            '@babel/env',
            {
              targets: [
                'last 2 Chrome major versions',
                'last 2 ChromeAndroid major versions',
                'last 2 Edge major versions',
                'last 2 Firefox major versions',
                'last 2 Safari major versions',
                'last 2 iOS major versions',
              ],
              useBuiltIns: false,
            },
          ],
        ],
      }),
      // istanbul(),
    ],
  },

  /** Uncaught errors are passed as JSON with a message property */
  formatError: (error) => {
    try {
      const parsed = JSON.parse(error);
      if (parsed.message) {
        return parsed.message;
      }
    } catch (_) {

    }

    return error;
  },

  colors: true,

  // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
  logLevel: config.LOG_INFO,

  // ## code coverage config
  coverageIstanbulReporter: {
    reports: ['html', 'lcovonly', 'text-summary'],
    dir: 'coverage',
    combineBrowserReports: true,
    skipFilesWithNoCoverage: true,
    thresholds: {
      global: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },

  autoWatch: false,
  singleRun: true,
  concurrency: Infinity,
});
