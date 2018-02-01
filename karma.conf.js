"use strict";

const commonConfig = require("./karma-common.conf.js");

module.exports = function configure(config) {
  const dist = "build/standalone/";
  const options = commonConfig(config, dist, "karma-main-unit");

  options.files.push({
    pattern: `${dist}lib/**/*.@(js|map|xml|html|json|css|woff|woff2)`,
    included: false,
  });

  config.set(options);
};
