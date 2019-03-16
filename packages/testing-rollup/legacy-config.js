const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const createBaseConfig = require('./modern-config');

module.exports = config => ({
  ...createBaseConfig(config),

  rollup: {
    output: {
      format: 'system',
    },
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
                'ie 11',
              ],
              useBuiltIns: false,
            },
          ],
        ],
      }),
      // istanbul(),
    ],
  },
});