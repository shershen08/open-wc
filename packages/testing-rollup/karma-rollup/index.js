const path = require('path');
const rollup = require('rollup');
const deepmerge = require('deepmerge');
const multiEntry = require('rollup-plugin-multi-entry');
const FileWatcher = require('./file-watcher');

const testBundlePath = path.join(__dirname, 'generated/test-bundle.js');

const defaultConfig = {
  output: {
    format: 'esm',
    sourcemap: 'inline'
  },
};

let logger = console;
let rollupOptions;
let fileWatcher;
let bundleCache;
let rollupOutput;

// generate rollup bundle
async function generateBundle(file) {
  const options = {
    ...rollupOptions,
    cache: bundleCache,
  };
  const bundle = await rollup.rollup(options);
  bundleCache = bundle.cache;

  if (fileWatcher) {
    const [entry, ...dependencies] = bundle.watchFiles;
    fileWatcher.add(entry, dependencies);
  }

  rollupOutput = (await bundle.generate(options)).output;

  for (const result of rollupOutput) {
    if (!result.isAsset && !result.isDynamicEntry) {
      const { code, map } = result;
      const { sourcemap } = options.output;

      file.sourceMap = map;

      const processed =
        sourcemap === 'inline'
          ? code + `\n//# sourceMappingURL=${map.toUrl()}\n`
          : code;

      return processed;
    }
  }
}

function createFramework(config, emitter, logger) {
  logger = logger.create('karma-rollup');
  rollupOptions = deepmerge(
    deepmerge(defaultConfig, config.rollup || {}),
    {
      // take all modules from input field
      input: config.files
        .filter(f => f.type === 'module')
        .map(f => f.pattern),
      // inject multi-entry plugin so that all tests are bundled into one file
      plugins: [multiEntry()],
    }
  );

  // don't include and serve any modules, they are bundled
  config.files.forEach((file, i) => {
    if (file.type === 'module') {
      config.files[i].served = false;
      config.files[i].included = false;
      config.files[i].watched = false;
    }
  });

  // inject tests bundle
  config.files.push({
    pattern: testBundlePath,
    type: 'module',
    included: true,
    served: true,
    watched: true,
  });

  // run test bundle file through preprocessor
  if (!config.preprocessors) {
    config.preprocessors = {};
  }
  config.preprocessors[testBundlePath] = ['rollup'];

  // add custom middleware to serve dynamically generated chunks
  if (!config.middleware) {
    config.middleware = [];
  }
  config.middleware.unshift('rollup');

  // watch files if needed
  if (!config.singleRun && config.autoWatch) {
    fileWatcher = new FileWatcher(emitter, testBundlePath);
  }
}

// serves up any rollup specific files from the bundled rollup output cache
function createMiddleware() {
  return (req, res, next) => {
    // if requesting a js file whose path ends up in the karma-rollup/generated folder,
    // it's a dynamic import created by rollup. look up the file in the rollup output and
    // serve it
    if (req.url.endsWith('.js') && req.url.includes('karma-rollup/generated')) {
      const fileName =  path.basename(req.url);
      const module = rollupOutput.find(o => o.fileName === fileName);

      if (module) {
        res.setHeader('Content-Type', 'application/javascript');
        return res.end(module.code, 'utf-8');
      }
    }

    next();
  }
}

// trigger rollup bundle when test-bundle.js file is passed
// only the test bundle passes through here, as configured by the framework
function createPreprocessor() {
  return async function preprocess(original, file, done) {
    if (file.path !== testBundlePath) {
      return done(null, original);
    }

    try {
      const bundle = await generateBundle(file);
      done(null, bundle);
    } catch (error) {
      logger.error(`error processing ${file}`, error);
      done(error, null);
    }
  };
}

createFramework.$inject = ['config', 'emitter', 'logger'];

module.exports = {
  'preprocessor:rollup': ['factory', createPreprocessor],
  'middleware:rollup': ['factory', createMiddleware],
  'framework:rollup': ['factory', createFramework],
};
