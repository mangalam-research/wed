/**
 * See (http://jquery.com/).
 * @external jQuery
 * @see {@link http://docs.jquery.com/Plugins/Authoring The jQuery Plugin Guide}
 */

(function (factory) {
    // If in an AMD environment, define() our module, else use the
    // jQuery global.
    'use strict';
    if (typeof define === 'function' && define.amd)
        define(['jquery'], factory);
    else
        factory(jQuery);
}(function ($) {
    'use strict';

    // This is the plugin proper.
/**
 * A jQuery plugin. Works like <code>find</code>, except that if
 * the starting context node matches, it is added to the set of
 * results.
 * @function external:jQuery.findandself
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

    $.fn.findAndSelf = function(selector) {

        var $nodes = this.find(selector);

        if (this.is(selector))
            $nodes = $nodes.add(this);

        return $nodes;
    };
}));

//  LocalWords:  Mangalam MPL Dubeau findandself jquery
