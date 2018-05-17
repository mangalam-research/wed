/* global Mocha karmaTestType */
var baseUrlMap = {
  unit: "/base/build/standalone/lib/",
  webpack: "/base/build/packed/lib/",
};
var karmaBaseUrl = baseUrlMap[karmaTestType];

if (karmaBaseUrl === undefined) {
  throw new Error("cannot determine karmaBaseUrl from test type: " +
                  karmaTestType);
}

var allTestFiles = [];
var TEST_REGEXP = /tests(?:\/.*)?\/.*[-_]test\.js$/i;
// We need to exclude wed_test.js.
var WED_REGEXP = /\/wed_test\.js$/i;
var REPLACE_REGEXP = new RegExp("^" + karmaBaseUrl.replace(/\//g, "\\/") +
                                "|\\.js$", "g");

// Get a list of all the test files to include.
Object.keys(window.__karma__.files).forEach(function each(file) {
  "use strict";

  if (TEST_REGEXP.test(file) && !WED_REGEXP.test(file)) {
    var normalizedTestModule = file.replace(REPLACE_REGEXP, "");
    allTestFiles.push(normalizedTestModule);
  }
});

// Chai is already loaded.
define("chai", function factory() {
  "use strict";

  return window.chai;
});

// This turns on logic used only in testing.
window.__WED_TESTING = {
  testing: true,
};

require.config({
  baseUrl: karmaBaseUrl,
  paths: {
    sinon: "../../../node_modules/sinon/pkg/sinon",
    "sinon-chai": "../../../node_modules/sinon-chai/lib/sinon-chai",
    "blueimp-md5": "../../../node_modules/blueimp-md5/js/md5",
    qs: "../../../node_modules/qs/dist/qs",
  },
  map: {
    "*": {
      "tests/tree_updater_test_data/source_converted.xml": "text!tests/tree_updater_test_data/source_converted.xml",
    },
  },
});

if (karmaTestType === "webpack") {
  // Webpack packs the rxjs files wed uses inside its bundle. So we do not have
  // rxjs in the external files.
  require.config({
    paths: {
      rxjs: baseUrlMap.unit + "external/rxjs",
    },
  });
}

// eslint-disable-next-line import/no-dynamic-require
require(
  ["require", "last-resort", "wed/onerror", "jquery", "bootstrap"],
  function loaded(require, lr, onerror, $) {
    "use strict";

    // Bootstrap sets $.support.transition after the document is ready, so we
    // also have to wait until the document is ready to do our work. Since
    // bootstrap is loaded before us, this will happen after bootstrap does its
    // deed.
    $(function turnOfAnimations() {
      // Turn off all animations.
      $.support.transition = false;
    });

    before(function before() {
      // We need to do this in a before hook because the listener is not added
      // until Mocha starts.
      Mocha.process.removeListener("uncaughtException");
      // We also have to eradicate Karma's on error handler.
      window.onerror = undefined;
    });

    beforeEach(function beforeEach() {
      // We want to reinstall with each test so that the state of the onError
      // object is fresh.
      var onError = lr.install(window, { force: true });
      onError.register(onerror.handler);
    });

    // The effect of the beforeEach handler above is to overwrite Mocha's
    // default unhandled exception handler. So we want to perform our on check
    // after each test.
    afterEach(function afterEach() {
      // We read the state, reset, and do the assertion later so that if the
      // assertion fails, we still have our reset.
      var wasTerminating = onerror.is_terminating();

      // We don't reload our page so we need to do this.
      onerror.__test.reset();

      if (wasTerminating) {
        throw new Error("test caused an unhandled exception to occur");
      }
    });

    // eslint-disable-next-line import/no-dynamic-require
    require(allTestFiles, window.__karma__.start);
  });
