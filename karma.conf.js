/* eslint-env node */
"use strict";

const serveStatic = require("serve-static");

//
// karma-typescript-preprocessor does not support loading a tsconfig.json. There
// is an old issue saying it can but probably the TS API changed and it no
// longer works properly.
//
// karma-typescript-preprocessor2 has issues with supporting recent TS:
//
// - The gulp-typescript it uses will load a local typescript. This local
//   typescript must be removed.
//
// - The gulp-typescript it uses does not support "extends".
//

function makeServeMiddleware(config) {
  const serve = serveStatic("./node_modules", {
    index: false,
  });

  const baseURL = "/base/node_modules/";
  return function (req, resp, next) {
    if (req.url.lastIndexOf(baseURL, 0) === 0) {
      req.url = req.url.slice(baseURL.length);
      serve(req, resp, next);
    }
    else {
      next();
    }
  };
}

module.exports = function configure(config) {
  const coverage = !config.debug ? ["coverage"] : [];
  config.set({
    basePath: "",
    frameworks: ["mocha", "chai"],
    middleware: ["serve-node-modules"],
    plugins: [
      "karma-*", // This is the default, which we need to keep here.
      { "middleware:serve-node-modules": ["factory", makeServeMiddleware] },
    ],
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
      "node_modules/systemjs/dist/system.src.js",
      "build/standalone/lib/system.config.js",
      "web/test/karma-main.js",
      { pattern: "web/test/**/*.ts", included: false },
      { pattern: "web/test/mmwp-data/**/*", included: false },
      { pattern: "build/standalone/lib/**/*.@(js|html|map|css)",
        included: false },
      // { pattern: "node_modules/{*,*/*,*/*/*}/package.json", included: false },
      // { pattern: "node_modules/bluebird/js/browser/bluebird.js",
      //   included: false },
      // { pattern: "node_modules/chai-as-promised/lib/chai-as-promised.js",
      //   included: false },
      // { pattern: "node_modules/check-error/check-error.js", included: false },
      // { pattern: "node_modules/dexie/dist/dexie.js", included: false },
      // { pattern: "node_modules/jquery/dist/jquery.js", included: false },
      // { pattern: "node_modules/bootstrap/dist/js/bootstrap.js", included: false },
      // { pattern: "node_modules/blueimp-md5/js/md5.js", included: false },
      // { pattern: "node_modules/@angular/**/*.js", included: false },
      // { pattern: "node_modules/rxjs/**/*.js", included: false },
      // { pattern: "node_modules/rxjs/package.json", included: false },
      // { pattern: "node_modules/bootbox/bootbox.js", included: false },
      // { pattern: "node_modules/sinon/lib/**/*.js", included: false },
      // { pattern: "node_modules/sinon-chai/lib/**/*.js", included: false },
      // { pattern: "node_modules/bluejax/index.js", included: false },
      // { pattern: "node_modules/bluejax.try/index.js", included: false },
      // { pattern: "node_modules/salve/salve.js", included: false },
      // { pattern: "node_modules/salve-dom/salve-dom.js", included: false },
      // { pattern: "node_modules/slug/slug.js", included: false },
      // { pattern: "node_modules/systemjs-plugin-json/json.js", included: false },
      // { pattern: "node_modules/rangy/lib/rangy-core.js", included: false },
    ].reduce((acc, x) => acc.concat(x), []),
    exclude: [],
    preprocessors: {
      "web/test/**/*.ts": ["typescript"],
      "build/standalone/lib/dashboard.js": coverage,
      "build/standalone/lib/dashboard/**/!(*.map).js": coverage,
    },
    typescriptPreprocessor: {
      tsconfigPath: "./web/test/tsconfig.json",
      compilerOptions: {
        typescript: require("typescript"),
        sourceMap: false,
        // We have to have them inline for the browser to find them.
        inlineSourceMap: true,
        inlineSources: true,
      },
      // transformPath: (path) => path.replace(/\.ts$/, ".js"),
    },
    reporters: ["progress", "coverage", "remap-coverage"],
    coverageReporter: {
      type: "in-memory",
    },
    remapCoverageReporter: {
      html: "coverage/karma",
    },
    remapOptions: {
      basePath: "web/dashboard/",
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Chrome"],
    singleRun: false,
    concurrency: Infinity,
  });
};
