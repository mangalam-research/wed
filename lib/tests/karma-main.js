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
  },
  map: {
    "*": {
      "tests/dloc_test_data/source_converted.xml": "text!tests/dloc_test_data/source_converted.xml",
      "tests/guiroot_test_data/source_converted.xml": "text!tests/guiroot_test_data/source_converted.xml",
      "tests/tree_updater_test_data/source_converted.xml": "text!tests/tree_updater_test_data/source_converted.xml",
    },
  },
  deps: allTestFiles,
  callback: window.__karma__.start,
});
