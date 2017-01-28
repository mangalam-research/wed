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

var fileAsString = util.fileAsString;

var parser = new ArgumentParser({
    version: "0.0.2",
    addHelp: true,
    description: 'Creates an optimized configuration from a base' +
        ' configuration.'});

parser.addArgument(["--system"],
                   { help: "Process a SystemJS configuration.",
                     action: "storeTrue",
                     dest: "system"});

parser.addArgument(["config"]);

var args = parser.parseArgs();

var config_file_path = args.config;
var config_file_text = fileAsString(config_file_path);

var bundle_name = "wed/wed";
var modules = ["wed/log", "wed/onerror", "wed/savers/localforage",
               "wed/browsers", "merge-options"];
if (args.system) {
    bundle_name += "-system.js";
    modules = modules.map(function (x) {
        return x + ".js";
    });
    modules.push("wed/wed.js");
}

var additional_config = { bundles: {} };
additional_config.bundles[bundle_name] = modules;

console.log(config_file_text);
var call = args.system ? "SystemJS.config" : "require.config";
console.log(call + "(" +
            JSON.stringify(additional_config, null, 2) +
            ");");
