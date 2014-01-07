 /**
  * @module decorator
  * @desc Basic decoration facilities.
  * @author Louis-Dominique Dubeau
  * @license MPL 2.0
  * @copyright 2013 Mangalam Research Center for Buddhist Languages
  */
define(/** @lends module:decorator */ function (require, exports, module) {
'use strict';

var util = require("./util");
var $ = require("jquery");
var domutil = require("./domutil");
var jqutil = require("./jqutil");
var transformation = require("./transformation");

/**
 * @classdesc A decorator is responsible for adding decorations to a
 * tree of DOM elements. Decorations are GUI elements.
 *
 * @constructor
 * @param {module:domlistener~Listener} domlistener The listener that
 * the decorator must use to know when the DOM tree has changed and
 * must be redecorated.
 * @param {module:wed~Editor} editor The editor instance for which
 * this decorator was created.
 * @param {module:gui_updater~GUIUpdater} gui_updater The updater to
 * use to modify the GUI tree. All modifications to the GUI must go
 * through this updater.
*/
function Decorator(domlistener, editor, gui_updater) {
    this._domlistener = domlistener;
    this._editor = editor;
    this._gui_updater = gui_updater;
}

exports.Decorator = Decorator;

/**
 * Request that the decorator add its event handlers to its listener.
 */
Decorator.prototype.addHandlers = function () {
    this._domlistener.addHandler(
        "added-element",
        "._real, ._phantom, ._phantom_wrap",
        this.contentEditableHandler.bind(this));
};

/**
 * Start listening to changes to the DOM tree.
 *
 * @param {jQuery} $root The DOM root that this decorator listens
 * to. This must be the same root as the root that the this
 * decorator's domlistener listens on and the same root as the root
 * which the GUI updater updates.
 */
Decorator.prototype.startListening = function ($root) {
    var $contents = $root.contents();
    $contents.detach();
    this._domlistener.startListening();
    this._gui_updater.insertAt($root.get(0), 0, $contents.toArray());
};

/**
 * This function adds a separator between each child element of the
 * element passed as <code>el</code>. The function only considers
 * "._real" elements.
 *
 * @param {Node} el The element to decorate.
 * @param {string|jQuery} sep A separator.
 */
Decorator.prototype.listDecorator = function (el, sep) {
    // We expect to work with a homogeneous list. That is, all
    // children the same element.
    var name_map = {};
    $(el).children('._real').each(function () {
        name_map[util.getOriginalName(this)] = 1;
    });

    var tags = Object.keys(name_map);
    if (tags.length > 1)
        throw new Error("calling listDecorator on a non-homogeneous list.");

    if (tags.length === 0)
        return; // Nothing to work with

    // First drop all children that are separators
    var me = this;
    $(el).children('[data-wed--separator-for]').each(function () {
        me._gui_updater.removeNode(this);
    });

    var tag_name = tags[0];

    // If sep is a string, create an appropriate div.
    var $sep;
    if (typeof sep === "string")
        $sep = $('<div class="_text">' + sep + "</div>");
    else
        $sep = $(sep);

    $sep.addClass('_phantom');
    $sep[0].setAttribute('data-wed--separator-for', tag_name);

    var first = true;
    $(el).children('._real').each(function () {
        if (!first)
            me._gui_updater.insertBefore(this.parentNode, $sep.clone()[0],
                                         this);
        else
            first = false;
    });
};

/**
 * An event handler for additions or removals of list
 * elements. Redecorates the list. The parameters after
 * <code>sep</code> are the same as those for
 * <code>added-element</code> and <code>removed-element</code> events
 * in {@link module:domlistener domlistener}.
 *
 * @param {string|jQuery} sep Separator between the elements of the
 * list.
 */
Decorator.prototype.addRemListElementHandler = function (
    sep, $root, $parent, $previous_sibling, $next_sibling, $element) {
    this.listDecorator($parent, sep);
};

/**
 * An event handler for inclusions of lists. The parameters after
 * <code>sep</code> are the same as those for
 * <code>included-element</code> events in {@link module:domlistener
 * domlistener}.
 *
 * @param {string|jQuery} sep Separator between the elements of the
 * list.
 */
Decorator.prototype.includeListHandler = function (
    sep, $root, $tree, $parent, $previous_sibling, $next_sibling, $element) {
    this.listDecorator($element, sep);
};


/**
 * Generic handler for setting <code>contenteditable</code> on nodes
 * included into the tree. The parameters are the same as those for
 * <code>included-element</code> events in {@link module:domlistener
 * domlistener}.
 */
Decorator.prototype.contentEditableHandler = function (
    $root, $parent, $previous_sibling, $next_sibling, $element) {
    var $all = $element.findAndSelf('*');
    for(var i = $all.length - 1; i >= 0; --i) {
        var it = $all[i];
        // All elements that may get a selection must be focusable to
        // work around bug:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
        it.setAttribute("tabindex", "-1");
        it.setAttribute("contenteditable", $(it).is("._real"));
    }
};

/**
 * Add a start label at the start of an element and end label at the
 * end.
 *
 * @param {jQuery} $root The root of the decorated tree.
 * @param {Node} el The element to decorate.
 * @param {integer} level The level of the labels for this element.
 * @param {Function} pre_context_handler An event handler to run when
 * the user invokes a context menu on the start label
 * @param {Function} post_context_handler An event handler to run when
 * the user invokes a context menu on the end label.
 */
Decorator.prototype.elementDecorator = function (
    $root, el, level, pre_context_handler, post_context_handler) {
    if (level > this._editor.max_label_level)
        throw new Error("level higher than the maximum set by the mode: " +
                        level);
    var $el = $(el);
    el = $el.get(0);
    var orig_name = util.getOriginalName(el);
    // _[name]_label is used locally to make the function idempotent.
    var cls = "_" + orig_name + "_label";
    var me = this;
    $(el).children("." + util.escapeCSSClass(cls)).each(function () {
        // We don't call remove node because removing these nodes
        // should not result in text getting merged.
        me._gui_updater.deleteNode(this);
    });
    cls += " _label_level_" + level;
    var $pre = $('<span class="_gui _phantom __start_label ' + cls +
                 ' _label"><span class="_phantom">&nbsp;' + orig_name +
                 ' >&nbsp;</span></span>');
    this._gui_updater.insertNodeAt(el, 0, $pre.get(0));
    var $post = $('<span class="_gui _phantom __end_label ' + cls +
                  ' _label"><span class="_phantom">&nbsp;&lt; ' +
                  orig_name + '&nbsp;</span></span>');
    this._gui_updater.insertBefore(el, $post.get(0), null);

    // Setup a handler so that clicking one label highlights it and
    // the other label.
    var data = {'$root': $root, '$pre': $pre, '$post': $post};
    $pre.on("wed-click click", data,
            this._elementButtonClickHandler.bind(this));
    $post.on("wed-click click", data,
             this._elementButtonClickHandler.bind(this));
    $pre.on("wed-unclick", data, this._elementButtonUnclickHandler.bind(this));
    $post.on("wed-unclick", data, this._elementButtonUnclickHandler.bind(this));

    if (pre_context_handler !== undefined)
        $pre.on('wed-context-menu', pre_context_handler);
    else
        $pre.on('wed-context-menu', false);

    if (post_context_handler !== undefined)
        $post.on('wed-context-menu', post_context_handler);
    else
        $post.on('wed-context-menu', false);

    // Get tooltips from the current mode
    var self = this;
    var options = {
        title: function () {
            if (!self._editor.preferences.get("tooltips"))
                return undefined;
            return self._editor.mode.shortDescriptionFor(orig_name);
        },
        container: "body",
        placement: "auto top"
    };
    $pre.tooltip(options);
    $post.tooltip(options);
};

/**
 * Event handler for clicks on start and end labels placed by {@link
 * module:decorator~Decorator#elementDecorator elementDecorator}.
 *
 * @private
 * @param {Event} ev DOM event.
 */
Decorator.prototype._elementButtonClickHandler = function (ev) {
    var data = ev.data;
    data.$pre.addClass("_label_clicked");
    data.$post.addClass("_label_clicked");
};

/**
 * Event handler for "unclicks" on start and end labels placed by
 * {@link module:decorator~Decorator#elementDecorator
 * elementDecorator}. ("Unclicks" are generated by wed.)
 *
 * @private
 * @param {Event} ev DOM event.
 */
Decorator.prototype._elementButtonUnclickHandler = function (ev) {
    var data = ev.data;
    data.$pre.removeClass("_label_clicked");
    data.$post.removeClass("_label_clicked");
};

/**
 * Context menu handler for the labels of elements decorated by {@link
 * module:decorator~Decorator#elementDecorator elementDecorator}.
 *
 * @private
 * @param {boolean} at_start Whether or not this event is for the
 * start label.
 * @param {Event} wed_ev The DOM event that wed generated to trigger
 * this handler.
 * @param {Event} ev The DOM event that wed received.
 * @returns {boolean} To be interpreted the same way as for all DOM
 * event handlers.
 */
Decorator.prototype._contextMenuHandler = function (
    at_start, wed_ev, ev) {
    var node = $(wed_ev.currentTarget).parents('._real').first().get(0);
    var menu_items = [];
    var editor = this._editor;
    var mode = editor.mode;
    if (node.parentNode !== editor.gui_root) {
        // We first gather the transformations that pertain to the
        // node to which the label belongs.

        var orig = util.getOriginalName(node);

        var doc_url = this._editor.mode.documentationLinkFor(orig);
        if (doc_url) {
            var a = this._editor.makeDocumentationLink(doc_url);
            menu_items.push($("<li></li>").append(a)[0]);
        }


        var trs = mode.getContextualActions(
            ["unwrap", "delete-element"], orig, node, 0);
        if (trs !== undefined) {
            trs.forEach(function (tr) {
                var data = {node: node, element_name: orig };
                var icon = tr.getIcon();
                var $a = $("<a tabindex='-1' href='#'>" +
                           (icon ? icon + " ": "") +
                           tr.getDescriptionFor(data) + "</a>");
                $a.click(data, tr.bound_handler);
                menu_items.push($("<li>").append($a).get(0));
            }.bind(this));
        }

        // Then we check what could be done before the node (if the
        // user clicked on an start element label) or after the node
        // (if the user clicked on an end element label).
        var parent = node.parentNode;
        var index = Array.prototype.indexOf.call(parent.childNodes, node);

        // If we're on the end label, we want the events *after* the node.
        if (!at_start)
            index++;

        var tree_caret = editor.toDataLocation(parent, index);
        editor.validator.possibleAt(tree_caret).forEach(function (ev) {
            if (ev.params[0] !== "enterStartTag")
                return;

            var unresolved = editor.resolver.unresolveName(ev.params[1],
                                                           ev.params[2]);

            var trs = mode.getContextualActions(
                "insert", unresolved, tree_caret.node, tree_caret.offset);
            if (trs === undefined)
                return;

            for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined;
                ++tr_ix) {
                var data = {element_name: unresolved,
                            move_caret_to: tree_caret};
                var icon = tr.getIcon();
                var $a = $("<a tabindex='-1' href='#'>" +
                           (icon ? icon + " ": "") +
                           tr.getDescriptionFor(data) +
                           (at_start ? " before this element":
                            " after this element") + "</a>");
                $a.click(data, tr.bound_handler);
                menu_items.push($("<li></li>").append($a).get(0));
            }
        }.bind(this));

        // There's no menu to display, so let the event bubble up.
        if (menu_items === 0)
            return true;

        editor.displayContextMenu(ev.clientX, ev.clientY, menu_items);
        return false;
    }

    return true;
};


});

//  LocalWords:  sep el focusable lt enterStartTag unclick nbsp li
//  LocalWords:  tabindex listDecorator contenteditable href jQuery
//  LocalWords:  gui jqutil domlistener domutil util validator jquery
//  LocalWords:  Mangalam MPL Dubeau
