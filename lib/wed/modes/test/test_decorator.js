/**
 * @module modes/test/test_decorator
 * @desc Decorator for the test mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_decorator */
function (require, exports, module) {
'use strict';

var GenericDecorator =
        require("wed/modes/generic/generic_decorator").GenericDecorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");
var jqutil = require("wed/jqutil");
var log = require("wed/log");
var context_menu = require("wed/gui/context_menu");

var _indexOf = Array.prototype.indexOf;

/**
 * @class
 * @extends module:modes/generic/generic_decorator~GenericDecorator
 * @param {module:modes/generic/generic~Mode} mode The mode object.
 * @param {module:modes/generic/generic_meta~Meta} meta
 * Meta-information about the schema.
 * @param {Object} options The options object passed to the mode which
 * uses this decorator.
 * @param {module:domlistener~Listener} listener The DOM listener that
 * will listen to changes on the document.
 * @param {module:wed~Editor} editor The wed editor to which the mode
 * is applied.
 * @param {module:domlistener~Listener} gui_domlistener The DOM
 * listener that listens to changes on the GUI tree.
 */
function TestDecorator(mode, meta, options) {
    // Pass the rest of arguments to super's constructor.
    GenericDecorator.apply(this, arguments);

    // Under normal circumstances, this is an empty set so all
    // elements are decorated.
    this._no_element_decoration = {
        "term": true,
        "ref": true
    };
}

oop.inherit(TestDecorator, GenericDecorator);

TestDecorator.prototype.elementDecorator = function ($root, $el) {
    var el = $el[0];
    var orig_name = util.getOriginalName(el);
    if (!this._no_element_decoration[orig_name])
        GenericDecorator.prototype.elementDecorator.call(
            this, $root, $el,
            log.wrap(this._contextMenuHandler.bind(this, true)),
            log.wrap(this._contextMenuHandler.bind(this, false)));

    var $before = $("<div class='_text _phantom'>(</div>");
    if (orig_name === "ref") {
        this._gui_updater.insertBefore(
            el,
            $("<div class='_text _phantom'>)</div>")[0], null);
        this._gui_updater.insertNodeAt(el, 0, $before[0]);
    }
    $before.on("contextmenu",
               { node: el },
               this._navigationContextMenuHandler.bind(this));
};

TestDecorator.prototype._navigationContextMenuHandler = log.wrap(function (ev) {
    // node is the node in the data tree which corresponds to the
    // navigation item that for which a context menu handler was
    // required by the user.
    var node = ev.data.node;
    var orig_name = util.getOriginalName(node);

    // container, offset: location of the node in its parent.
    var container = node.parentNode;
    var offset = _indexOf.call(container.childNodes, node);

    // List of items to put in the contextual menu.
    var tuples = [];

    //
    // Create "insert" transformations for siblings that could be
    // inserted before this node.
    //
    var actions = this._mode.getContextualActions("insert", orig_name,
                                                  container, offset);
    // data to pass to transformations
    var data = {element_name: orig_name,
                move_caret_to: [container, offset]};
    var act_ix, act;
    for(act_ix = 0, act; (act = actions[act_ix]) !== undefined; ++act_ix)
        tuples.push([act, data, act.getLabelFor(data) +
                     " before this one</a>"]);

    // Convert the tuples to actual menu items.
    var items = [];
    for(var tix = 0, tup; (tup = tuples[tix]) !== undefined; ++tix) {
        var $a = $("<a tabindex='0' href='#'>" + tup[2] + "</a>");
        $a.click(tup[1], tup[0].bound_handler);
        items.push($("<li></li>").append($a).get(0));
    }

    new context_menu.ContextMenu(this._editor.my_window.document,
                                 ev.clientX, ev.clientY, "none", items);

    return false;
});


exports.TestDecorator = TestDecorator;

});

//  LocalWords:  GenericDecorator DOM jqutil util jquery oop Mangalam
//  LocalWords:  MPL Dubeau
