"use strict";

const commonConfig = require("./karma-common.conf.js");

module.exports = function configure(config) {
  const dist = "build/packed/";
  const options = commonConfig(config, dist, "karma-main-webpack");
  options.files.push({
    pattern: `${dist}lib/*.@(js|map)`,
    included: false,
  });
  options.files.push({
    pattern: `${dist}lib/!(tests)/**/*.@(js|map|xml|html|json|css|woff|woff2)`,
    included: false,
  });
  options.files.push({
    pattern: "build/standalone/lib/tests/{*,*_data/**/*,integration/wed-save-test}.@(js|map|xml|html|json)",
    included: false,
  });
  // We need the Rxjs files from the dev build because the tests load them individually.
  options.files.push({
    pattern: "build/standalone/lib/external/rxjs/**/*.@(js|map|xml|html|json)",
    included: false,
  });
  config.set(options);
};
