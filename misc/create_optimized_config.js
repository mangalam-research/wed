"use strict";

/* eslint-disable no-console */

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
const util = require("./util");

const fileAsString = util.fileAsString;

function create(args) {
  const configFilePath = args.config;
  const configFileText = fileAsString(configFilePath);

  let bundleName = "wed/wed";
  let modules = ["wed/log", "wed/onerror", "wed/savers/localforage",
                 "wed/browsers", "wed/runtime", "merge-options"];
  if (args.system) {
    bundleName += "-system.js";
    modules = modules.map(x => `${x}.js`);
    modules.push("wed/wed.js");
  }

  const additionalConfig = { bundles: {} };
  additionalConfig.bundles[bundleName] = modules;

  let out = configFileText;
  const call = args.system ? "SystemJS.config" : "require.config";
  out += `${call}(${JSON.stringify(additionalConfig, null, 2)});`;

  return out;
}

exports.create = create;

if (require.main === module) {
  // eslint-disable-next-line global-require
  const ArgumentParser = require("argparse").ArgumentParser;

  const parser = new ArgumentParser({
    version: "0.0.2",
    addHelp: true,
    description: "Creates an optimized configuration from a base configuration.",
  });

  parser.addArgument(["--system"], {
    help: "Process a SystemJS configuration.",
    action: "storeTrue",
    dest: "system",
  });

  parser.addArgument(["config"]);

  const args = parser.parseArgs();
  console.log(create(args));
}
