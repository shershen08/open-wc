const chokidar = require('chokidar');
const debounce = require('debounce');

function hasNullByte(string) {
  return string.includes("\u0000");
}

class FileWatcher {
  constructor(emitter, testBundlePath) {
    this.emitter = emitter;
    this.testBundlePath = testBundlePath;
    this.files = new Map();
    this.watch = chokidar.watch();
    this.watch.on('change', debounce(this.handleChange.bind(this), 150));
  }

  add(entry, dependencies) {
    const filteredDependencies = dependencies.filter(
      path => !hasNullByte(path)
    );
    this.files.set(entry, filteredDependencies);
    this.watch.add([entry, ...filteredDependencies]);
  }

  handleChange(path) {
    for (const [entry, dependencies] of this.files.entries()) {
      if (entry === path || dependencies.includes(path)) {
        return this.refreshFile();
      }
    }
  }

  refreshFile() {
    // this.emitter._fileList.changeFile(this.testBundlePath, true);
    this.emitter.refreshFiles();
  }
}

module.exports = FileWatcher;
