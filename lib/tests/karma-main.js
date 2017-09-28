/* global Mocha */
var allTestFiles = [];
var TEST_REGEXP = /tests(?:\/.*)?\/.*[-_]test\.js$/i;
// We need to exclude wed_test.js.
var WED_REGEXP = /\/wed_test\.js$/i;

// Get a list of all the test files to include.
Object.keys(window.__karma__.files).forEach(function each(file) {
  "use strict";
  if (TEST_REGEXP.test(file) && !WED_REGEXP.test(file)) {
    var normalizedTestModule =
        file.replace(/^\/base\/build\/standalone\/lib\/|\.js$/g, "");
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
  baseUrl: "/base/build/standalone/lib/",
  paths: {
    sinon: "../../../node_modules/sinon/pkg/sinon",
    "sinon-chai": "../../../node_modules/sinon-chai/lib/sinon-chai",
    "blueimp-md5": "../../../node_modules/blueimp-md5/js/md5",
    qs: "../../../node_modules/qs/dist/qs",
  },
  map: {
    "*": {
      "tests/dloc_test_data/source_converted.xml": "text!tests/dloc_test_data/source_converted.xml",
      "tests/guiroot_test_data/source_converted.xml": "text!tests/guiroot_test_data/source_converted.xml",
      "tests/tree_updater_test_data/source_converted.xml": "text!tests/tree_updater_test_data/source_converted.xml",
    },
  },
});

require(
  ["require", "last-resort", "wed/onerror"],
  function loaded(require, lr, onerror) {
    "use strict";

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
      if (onerror.is_terminating()) {
        this.test.error(new Error("test generated an uncaught exception"));
      }
    });

    require(allTestFiles, window.__karma__.start);
  });
