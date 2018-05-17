"use strict";

// This is a middleware that just serves empty files for fake css files we use
// in testing (/a.css, /b.css, etc.)
function makeServeMiddleware(/* config */) {
  return function handle(req, resp, next) {
    if (/^\/.*\.css$/.test(req.url)) {
      resp.end("");
    }
    else {
      next();
    }
  };
}

module.exports = function configure(config, dist, specificMain) {
  return {
    basePath: "",
    middleware: ["serve-fake-css-files"],
    plugins: [
      "karma-*", // This is the default, which we need to keep here.
      { "middleware:serve-fake-css-files": ["factory", makeServeMiddleware] },
    ],
    frameworks: ["requirejs", "mocha", "chai", "source-map-support"],
    client: {
      mocha: {
        grep: config.grep,
      },
    },
    files: [
      `${dist}requirejs-config.js`,
      `lib/tests/${specificMain}.js`,
      "lib/tests/karma-main.js",
      ...["external/font-awesome/css/font-awesome.min.css",
          "external/bootstrap/css/bootstrap.min.css",
          "wed/wed.css"].map(x => `${dist}lib/${x}`),
      { pattern: "build/schemas/**/*.@(js|json)", included: false },
      { pattern: "node_modules/sinon/pkg/sinon.js", included: false },
      { pattern: "node_modules/sinon-chai/lib/sinon-chai.js", included: false },
      { pattern: "node_modules/blueimp-md5/js/md5.js", included: false },
      { pattern: "node_modules/qs/dist/qs.js", included: false },
    ],
    exclude: [],
    preprocessors: {},
    reporters: ["mocha"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["ChromeHeadless"],
    singleRun: false,
    concurrency: Infinity,
  };
};
