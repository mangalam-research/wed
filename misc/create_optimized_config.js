'use strict';

// This script takes 2 arguments:
//
// * config: a RequireJS configuration file (passed to require.config
//   at run time),
//
// * build: a r.js build file (the file passed r.js to build an
//   optimization).
//
// It produces a configuration file designed to use an optimized
// bundle (what is produced by r.js). This configuration has:
//
// * baseURL set to the value of build.dir
//
// * paths containing, for each "define(" in each module created by
//   the build:
//
//       defined module: module created by build
//
// For instance if the build create foo.js which contains defines for
// A, B, C, and bar.js which contains a define for D. Then the
// following mappings will be created:
//
//     "A": "foo.js",
//     "B": "foo.js",
//     "C": "foo.js",
//     "D": "bar.js"
//
var fs = require("fs");
var path = require("path");

function fileAsString(p) {
    return fs.readFileSync(path.resolve(p), "utf8").toString();
}

/**
 * This function defines ``require.config`` so that evaluating our
 * configuration file will capture the configuration passed to
 * ``require.config``.
 *
 * @param {String} config The text of the configuration file.
 * @returns {Object} The configuration object.
 */
function captureConfigObject(config) {
    var captured;
    var require = {};
    require.config = function (config) {
        captured = config;
    };
    /* jshint evil: true */
    eval(config);
    return captured;
}

var config_file_path = process.argv[2];
var build_file_path = process.argv[3];
var config_file_text = fileAsString(config_file_path);
var build_file_text = fileAsString(build_file_path);

var config = captureConfigObject(config_file_text);

/* jshint evil: true */
var build = eval(build_file_text);

var path_config = config.paths;
if (build.modules) {
    build.modules.forEach(function (module) {
        //
        // Scan each module for:
        //
        // define("...",
        var module_path = path.join(build.dir, module.name) + ".js";
        var text = fileAsString(module_path);
        text.match(/define\(["'](.*?)["']/g).forEach(function (match) {
            var name = match.slice(8, -1);
            path_config[name] = module.name;
        });
    });
}
config.paths = path_config;
config.baseUrl = "/" + build.dir;
console.log("require.config(" +
            JSON.stringify(config, null, 4) +
           ");");
