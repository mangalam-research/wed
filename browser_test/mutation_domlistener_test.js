/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

//
// Cannot be moved to jsdom because mutation_domlistener needs a
// MutationObserver and jsdom does not support it yet.
//

define(["wed/mutation_domlistener", "./domlistener_generic_test"],
function (domlistener, generic) {
'use strict';

generic(domlistener, "mutation_domlistener", null);

});

//  LocalWords:  Mangalam MPL Dubeau domlistener jsdom
//  LocalWords:  MutationObserver
