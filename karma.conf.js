/* eslint-env node */
"use strict";

module.exports = function configure(config) {
  const coverage = !config.debug ? ["coverage"] : [];
  config.set({
    basePath: "",
    frameworks: ["mocha", "chai"],
    client: {
      mocha: {
        grep: config.grep,
      },
    },
    files: [
      "node_modules/core-js/client/core.js",
      //
      // All the stuff after "zone" is needed to get Angular component tests to
      // run. Note that we flatten this with a reduce at the end of the top
      // array.
      //
      // And we map an array rather than rely on patterns because the matches
      // from a pattern are ordered alphabetically but the order here matters
      // (and is not alphabetical).
      //
      ["zone", "long-stack-trace-zone", "proxy", "sync-test",
       "async-test", "fake-async-test", "mocha-patch"].map(
                    (x) => `node_modules/zone.js/dist/${x}.js`),
      "build/standalone/lib/external/classList.js",
      "build/standalone/lib/wed/polyfills/contains.js",
      "build/standalone/lib/wed/polyfills/matches.js",
      "build/standalone/lib/wed/polyfills/innerHTML_for_XML.js",
      "node_modules/systemjs/dist/system.js",
      "build/standalone/lib/system.config.js",
      "web/test/karma-main.js",
      { pattern: "web/test/**/*.ts", included: false },
      { pattern: "build/standalone/lib/**/*.@(js|html|map)", included: false },
      { pattern: "node_modules/{*,*/*,*/*/*}/package.json",
        included: false },
      { pattern: "node_modules/bluebird/js/browser/bluebird.js",
        included: false },
      { pattern: "node_modules/chai-as-promised/lib/chai-as-promised.js",
        included: false },
      { pattern: "node_modules/check-error/check-error.js",
        included: false },
      { pattern: "node_modules/dexie/dist/dexie.js",
        included: false },
      { pattern: "node_modules/jquery/dist/jquery.js",
        included: false },
      { pattern: "node_modules/bootstrap/dist/js/bootstrap.js",
        included: false },
      { pattern: "node_modules/blueimp-md5/js/md5.js",
        included: false },
      { pattern: "node_modules/@angular/**/*.js",
        included: false },
      { pattern: "node_modules/rxjs/**/*.js",
        included: false },
      { pattern: "node_modules/rxjs/package.json",
        included: false },
      { pattern: "node_modules/bootbox/bootbox.js",
        included: false },
      { pattern: "node_modules/sinon/lib/**/*.js",
        included: false },
    ].reduce((acc, x) => acc.concat(x), []),
    exclude: [],
    preprocessors: {
      "web/test/**/*.ts": ["typescript"],
      "build/standalone/lib/dashboard.js": coverage,
      "build/standalone/lib/dashboard/**/!(*.map).js": coverage,
    },
    typescriptPreprocessor: {
      options: {
        project: "./web/tsconfig.json",
      },
      transformPath: (path) => path.replace(/\.ts$/, ".js"),
    },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Chrome"],
    singleRun: false,
    concurrency: Infinity,
  });
};
