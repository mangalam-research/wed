var allTestFiles = [];
var TEST_REGEXP = /tests\/wed\/.*-test\.js$/i;

// Get a list of all the test files to include.
Object.keys(window.__karma__.files).forEach(function each(file) {
  "use strict";
  if (TEST_REGEXP.test(file)) {
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

require.config({
  baseUrl: "/base/build/standalone/lib/",
  paths: {
    sinon: "../../../node_modules/sinon/pkg/sinon",
  },
  deps: allTestFiles,
  callback: window.__karma__.start,
});
