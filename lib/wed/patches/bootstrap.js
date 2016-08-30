/**
 * @module patches/bootstrap
 * @desc Work around boostrap problems.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends auto */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
require("bootstrap");

var Tooltip = $.fn.tooltip.Constructor;

var version = Tooltip.VERSION;

function parseVersion(version) {
    version = version.split(".");

    if (version.length < 3) {
        // Normalize to length 3. The length is at least 1.
        version = version.concat([0, 0]).slice(0, 3);
    }

    return version.reduce(function (acc, x) {
        return acc * 1000 + Number(x);
    }, 0);
}

function override(name, builder) {
    var orig = Tooltip.prototype[name];
    Tooltip.prototype[name] = builder(orig);
}

//
// Work around this bug:
// https://github.com/twbs/bootstrap/issues/20511
//
if (parseVersion(version) >= parseVersion("3.3.7")) {
    override("destroy", function buildDestroy(orig) {
        return function destroy() {
            if (this.isBeingDestroyed) {
                return;
            }
            this.isBeingDestroyed = true;
            orig.apply(this, arguments);
        };
    });

    override("show", function buildShow(orig) {
        return function show() {
            if (this.isBeingDestroyed) {
                return;
            }
            orig.apply(this, arguments);
        };
    });

    // We cannot trivially override ``hide`` to check for
    // ``isBeingDestroyed`` because ``destroy`` calls ``hide``. And
    // due to the override above ``isBeingDestroyed`` would always be
    // true and ``hide`` would do nothing.
}

});

//  LocalWords:  tooltip Tooltips bs tooltips
