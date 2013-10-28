/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/updater_domlistener",
       "./domlistener_generic_test", "wed/tree_updater"],
function (mocha, chai, $, domlistener, generic, tree_updater) {
'use strict';

generic(mocha, chai, $, domlistener, "updater_domlistener",
                                     tree_updater.TreeUpdater);

});

//  LocalWords:  domlistener chai jQuery jquery Dubeau MPL Mangalam
