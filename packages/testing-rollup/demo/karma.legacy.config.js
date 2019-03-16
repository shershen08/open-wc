// eslint-disable-next-line import/no-extraneous-dependencies
const deepmerge = require('deepmerge');
const createDefaultConfig = require('../legacy-config.js');

module.exports = config => {
  config.set(
    deepmerge(createDefaultConfig(config), {
      files: [
        // allows running single tests with the --grep flag
        { pattern: config.grep ? config.grep : 'test/**/*.test.js', type: 'module' },
      ],
      // additional custom config here
    }),
  );
  return config;
};
