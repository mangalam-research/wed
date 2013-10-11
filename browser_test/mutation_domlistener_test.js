/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/mutation_domlistener",
       "./domlistener_generic_test"],
function (mocha, chai, $, domlistener, generic) {
'use strict';

generic(mocha, chai, $, domlistener, "mutation_domlistener", null);

});
