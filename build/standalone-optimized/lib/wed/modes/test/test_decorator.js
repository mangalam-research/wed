/**
 * @module modes/test/test_decorator
 * @desc Decorator for the test mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_decorator */
function (require, exports, module) {
'use strict';

var domutil = require("wed/domutil");
var indexOf = domutil.indexOf;
var Decorator = require("wed/decorator").Decorator;
var GenericDecorator =
        require("wed/modes/generic/generic_decorator").GenericDecorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");
var log = require("wed/log");
var context_menu = require("wed/gui/context_menu");
var makeDLoc = require("wed/dloc").makeDLoc;
var key = require("wed/key");
var key_constants = require("wed/key_constants");
var input_trigger_factory = require("wed/input_trigger_factory");

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
    this._element_level = {
        "term": 2,
        "ref": 2,
        "text": 1
    };
}

oop.inherit(TestDecorator, GenericDecorator);

TestDecorator.prototype.addHandlers = function () {
    GenericDecorator.prototype.addHandlers.apply(this, arguments);
    input_trigger_factory.makeSplitMergeInputTrigger(
        this._editor,
        "hi",
        key.makeKey(";"),
        key_constants.BACKSPACE,
        key_constants.DELETE);
};

TestDecorator.prototype.elementDecorator = function (root, el) {
    var data_node = this._editor.toDataNode(el);
    var rend = data_node.attributes.rend;
    if (rend) {
        rend = rend.value;
    }

    var orig_name = util.getOriginalName(el);
    // We don't run the default when we wrap p.
    if (!(orig_name === "p" && rend === "wrap")) {
        Decorator.prototype.elementDecorator.call(
            this, root, el, this._element_level[orig_name] || 1,
            log.wrap(this._contextMenuHandler.bind(this, true)),
            log.wrap(this._contextMenuHandler.bind(this, false)));
    }

    if (orig_name === "ref") {
        $(el).children("._text._phantom").remove();
        this._gui_updater.insertBefore(
            el,
            $("<div class='_text _phantom _end_wrapper'>)</div>")[0],
            el.lastChild);

        var $before = $("<div class='_text _phantom _start_wrapper'>(</div>");
        this._gui_updater.insertBefore(el, $before[0],
                                       el.firstChild.nextSibling);

        $before.on("wed-context-menu",
                   { node: el },
                   this._navigationContextMenuHandler.bind(this));
        $before.attr("data-wed-custom-context-menu", true);
    }

    if (orig_name === "p") {
        switch(rend) {
        case "foo":
            $(el).children("._gui_test").remove();
            this._gui_updater
                .insertBefore(
                    el,
                    $("<div class='_gui _phantom _gui_test btn "+
                      "btn-default'>Foo</div>")[0],
                    el.lastChild);

            var found;
            var child = data_node.firstElementChild;
            while (!found && child) {
                if (child.tagName === "abbr")
                    found = child;
                child = child.nextElementSibling;
            }
            if (found) {
                this._gui_updater
                .insertBefore(
                    el,
                    $("<div class='_gui _phantom _gui_test btn "+
                      "btn-default'>Foo2</div>")[0],
                    el.lastChild);
                this._gui_updater
                .insertBefore(
                    el,
                    $("<div class='_gui _phantom _gui_test btn "+
                      "btn-default'>Foo3</div>")[0],
                    el.lastChild);
            }
            break;
        case "wrap":
            if (domutil.closestByClass(el, "_gui_test")) {
                break;
            }

            var wrapper = $("<div class='_gui _phantom_wrap _gui_test btn "+
                            "btn-default'></div>")[0];
            this._gui_updater.insertBefore(el.parentNode, wrapper, el);
            this._gui_updater.insertBefore(wrapper, el, null);
            break;
        }
    }

};

TestDecorator.prototype._navigationContextMenuHandler = log.wrap(
    function (wed_ev, ev) {
    // node is the node in the GUI tree which corresponds to the
    // navigation item for which a context menu handler was required
    // by the user.
    var node = wed_ev.data.node;
    var orig_name = util.getOriginalName(node);

    // container, offset: location of the node in its parent.
    var container = node.parentNode;
    var offset = indexOf(container.childNodes, node);

    // List of items to put in the contextual menu.
    var tuples = [];

    //
    // Create "insert" transformations for siblings that could be
    // inserted before this node.
    //
    var actions = this._mode.getContextualActions("insert", orig_name,
                                                  container, offset);
    // data to pass to transformations
    var data = {name: orig_name, move_caret_to: makeDLoc(this._editor.gui_root,
                                                         container, offset)};
    var act_ix, act;
    for(act_ix = 0, act; (act = actions[act_ix]) !== undefined; ++act_ix)
        tuples.push([act, data, act.getLabelFor(data) +
                     " before this one"]);

    // Convert the tuples to actual menu items.
    var items = [];
    for(var tix = 0, tup; (tup = tuples[tix]) !== undefined; ++tix) {
        var $a = $("<a tabindex='0' href='#'>" + tup[2] + "</a>");
        $a.click(tup[1], tup[0].bound_terminal_handler);
        items.push($("<li></li>").append($a)[0]);
    }

    new context_menu.ContextMenu(this._editor.doc,
                                 ev.clientX, ev.clientY, items);

    return false;
});


exports.TestDecorator = TestDecorator;

});

//  LocalWords:  GenericDecorator DOM util jquery oop Mangalam
//  LocalWords:  MPL Dubeau
