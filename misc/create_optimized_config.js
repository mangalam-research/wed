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
var path = require("path");
var util = require("./util");
var ArgumentParser = require("argparse").ArgumentParser;

var captureConfigObject = util.captureConfigObject;
var fileAsString = util.fileAsString;

var parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: 'Creates an optimized configuration from a base' +
        ' configuration and the optimizer\'s build file.'});

parser.addArgument(["-k", "--skip"],
                   { help: "Skip a module from processing.",
                     action: "append",
                     dest: "skip"});

parser.addArgument(["config"]);
parser.addArgument(["build"]);

var args = parser.parseArgs();

var config_file_path = args.config;
var build_file_path = args.build;
var config_file_text = fileAsString(config_file_path);
var build_file_text = fileAsString(build_file_path);

var config = captureConfigObject(config_file_text);

/* jshint evil: true */
var build = eval(build_file_text);

var path_config = config.paths;
if (build.modules) {
    build.modules.forEach(function (module) {
        if (args.skip.indexOf(module))
            return;
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

config.bundles = {
    "wed/wed": ["wed/log", "wed/onerror", "wed/savers/localforage",
                "wed/browsers"]
};

// Node that this serialization does not preserve functions that could
// have originally appeared in the runtime configuration. However, our
// current use of RequireJS does not require that such functions be
// preserved. We use them only for the ``init`` parameters in
// shims. These functions are incorporated inside the optimized bundle
// so they do not need to be present in the config that uses the
// bundle.
console.log("require.config(" +
            JSON.stringify(config, null, 4) +
           ");");
