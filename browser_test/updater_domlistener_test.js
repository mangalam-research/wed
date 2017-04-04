/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

//
// Cannot be moved to jsdom because mutation_domlistener needs a
// MutationObserver and jsdom does not support it yet. (In theory, this test
// could be moved to jsdom but since domlistener_generic_test is made to work
// with this test and the test for mutation_domlistener, we are not going to
// move until MutationObserver is supported in jsdom.)
//

define(function f(require) {
  "use strict";
  var domlistener = require("wed/updater_domlistener");
  var generic = require("./domlistener_generic_test");
  var tree_updater = require("wed/tree-updater");

  generic(domlistener, "updater_domlistener", tree_updater.TreeUpdater);
});

//  LocalWords:  domlistener Dubeau MPL Mangalam jsdom TreeUpdater
//  LocalWords:  MutationObserver
