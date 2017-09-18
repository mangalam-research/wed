// Karma configuration
// Generated on Fri Sep 08 2017 08:57:28 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({
    basePath: "",
    frameworks: ["requirejs", "mocha", "chai"],
    files: [
      "build/standalone/requirejs-config.js",
      // Get it straight from the source, as it does not need compilation.
      "lib/tests/karma-main.js",
      // A minimal incomplete polyfill for the jsdom environment.
      "build/standalone/lib/tests/selection-range-fake.js",
      { pattern: "build/standalone/lib/**/*.@(js|map)", included: false },
      { pattern: "node_modules/sinon/pkg/sinon.js", included: false },
    ],
    exclude: [],
    preprocessors: {},
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["jsdom"],
    singleRun: false,
    concurrency: Infinity
  });
};
