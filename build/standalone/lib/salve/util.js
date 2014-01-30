/**
 * @module util
 * @desc A mock implementation of Node's util package. This module
 * implements only what is actually used in salve.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:util */function(require, exports, module) {
    'use strict';
    return {
        /**
         * A mock of Node's <code>util.inspect</code>. The current
         * implementation merely returns what is passed to it.
         */
        'inspect': function (x) { return x; }
    };
});

// LocalWords:  util Dubeau MPL Mangalam
