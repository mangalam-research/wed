/* eslint-env node */
exports.failed = [];

exports.version = "0.1.0";

exports.fetch = function fetch(load) {
  // We essentially run the whole machinery in the path that this plugin should
  // be importing.

  // This path is taken when we get here due to configuration.
  if (load.address === load.name) {
    var newLoad = {
      name: load.name,
      metadata: { scriptLoad: load.metadata.scriptLoad,
                  format: load.metadata.format,
                },
      address: load.address,

    };

    return this.fetch(newLoad).then(function (ret) {
      return ret;
    }).catch(function failed() {
      return "";
    });
  }

  // This path is taken when use plugin prefixes/suffixes. We launch the import
  // but we do not wait for it to complete.
  this.import(load.address).catch(function failed() {
    return null; // Suppress possible warnings about uncaught rejections.
  });
  return "";
};

exports.instantiate = function instantiate(load) {
  if (load.address === load.name) {
    var newLoad = {};
    var keys = Object.keys(load);
    for (var keyIx = 0; keyIx < keys.length; ++keyIx) {
      var key = keys[keyIx];
      newLoad[key] = load[key];
    }
    newLoad.metadata = {};
    newLoad.metadata.scriptLoad = load.metadata.scriptLoad;
    newLoad.metadata.deps = [];
    newLoad.metadata.format = load.metadata.format;
    return this.instantiate(newLoad).catch(function () {
      return {};
    });
  }

  // This is the path taken when we use plugin prefixes/suffixes. This time we
  // want the result of the import.
  var address = this.normalizeSync(load.address);
  return this.import(load.address).then(function loaded() {
    return this.get(address);
  }.bind(this)).catch(function failed() {
    exports.failed.push(address);
    return {};
  });
};
