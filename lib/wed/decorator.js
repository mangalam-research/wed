/**
 * @module decorator
 * @desc Basic decoration facilities.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:decorator */ function (require, exports, module) {
'use strict';

var util = require("./util");
var $ = require("jquery");
var domutil = require("./domutil");
var jqutil = require("./jqutil");
var transformation = require("./transformation");

function Decorator(domlistener, editor, gui_updater) {
    this._domlistener = domlistener;
    this._editor = editor;
    this._gui_updater = gui_updater;
}

exports.Decorator = Decorator;

Decorator.prototype.init = function ($root) {
    this._domlistener.addHandler(
        "added-element",
        "._real, ._phantom, ._phantom_wrap",
        this.contentEditableHandler.bind(this));

    var $contents = $root.contents();
    $contents.detach();
    this._domlistener.startListening();
    this._gui_updater.insertAt($root.get(0), 0, $contents.toArray());
};

/**
 * This function adds a separator between each child element of the
 * element passed as <code>el</code>. The function only considers
 * _real elements.
 *
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
    if (typeof sep === "string")
        sep = $('<div class="_text">' + sep + "</div>");

    $(sep).addClass('_phantom');
    $(sep).attr('data-wed--separator-for', tag_name);

    var first = true;
    $(el).children('._real').each(function () {
        if (!first)
            me._gui_updater.insertBefore(this.parentNode, sep.clone().get(0),
                                         this);
        else
            first = false;
    });
};

Decorator.prototype.addRemListElementHandler = function (
    sep, $root, $parent, $previous_sibling, $next_sibling, $element) {
    this.listDecorator($parent, sep);
};

Decorator.prototype.includeListHandler = function (sep, $root, $element) {
    this.listDecorator($element, sep);
};

Decorator.prototype.contentEditableHandler = function (
    $root, $parent, $previous_sibling, $next_sibling, $element) {
    $element.findAndSelf('._phantom').attr("contenteditable", "false");
    $element.findAndSelf('._phantom_wrap').attr("contenteditable", "false");
    $element.findAndSelf('._real').attr("contenteditable", "true");
};

Decorator.prototype.elementDecorator = function (
    $root, el, pre_context_handler, post_context_handler) {
    var $el = $(el);
    el = $el.get(0);
    var orig_name = util.getOriginalName(el);
    // _[name]_label is used locally to make the function idempotent.
    var cls = "_" + orig_name + "_label";
    var me = this;
    $(el).children("." + util.escapeCSSClass(cls)).each(function () {
        me._gui_updater.removeNode(this);
    });
    var $pre = $('<span class="_gui _phantom _start_button ' + cls +
                 ' _button"><span class="_phantom">&nbsp;' + orig_name +
                 ' >&nbsp;</span></span>');
    this._gui_updater.insertNodeAt(el, 0, $pre.get(0));
    var $post = $('<span class="_gui _phantom _end_button ' + cls +
                  ' _button"><span class="_phantom">&nbsp;&lt; ' +
                  orig_name + '&nbsp;</span></span>');
    this._gui_updater.insertBefore(el, $post.get(0), null);

    // Setup a handler so that clicking one label highlights it and
    // the other label.
    var data = {'$root': $root, '$pre': $pre, '$post': $post};
    $pre.click(data, this._elementButtonClickHandler.bind(this));
    $post.click(data, this._elementButtonClickHandler.bind(this));
    $pre.on("unclick", data, this._elementButtonUnclickHandler.bind(this));
    $post.on("unclick", data, this._elementButtonUnclickHandler.bind(this));

    if (pre_context_handler !== undefined)
        $pre.on('wed-context-menu', pre_context_handler);
    else
        $pre.on('wed-context-menu', false);

    if (post_context_handler !== undefined)
        $post.on('wed-context-menu', post_context_handler);
    else
        $post.on('wed-context-menu', false);
};

Decorator.prototype._elementButtonClickHandler = function (ev) {
    var data = ev.data;
    data.$pre.addClass("_button_clicked");
    data.$post.addClass("_button_clicked");
};

Decorator.prototype._elementButtonUnclickHandler = function (ev) {
    var data = ev.data;
    data.$pre.removeClass("_button_clicked");
    data.$post.removeClass("_button_clicked");
};

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
        var trs = mode.getContextualActions(
            ["unwrap", "delete-element"], orig, node, 0);
        if (trs !== undefined) {
            trs.forEach(function (tr) {
                var data = {node: node, element_name: orig };
                var $a = $("<a tabindex='-1' href='#'>" +
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

        var tree_caret = editor.toDataCaret(parent, index);
        editor.validator.possibleAt(
            tree_caret[0], tree_caret[1]).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag")
                    return;

                var unresolved = editor.resolver.unresolveName(
                    ev.params[1], ev.params[2]);

                var trs = mode.getContextualActions(
                    "insert", unresolved, tree_caret[0], tree_caret[1]);
                if (trs === undefined)
                    return;

                for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined;
                    ++tr_ix) {
                    var data = {element_name: unresolved };
                    var $a = $("<a tabindex='-1' href='#'>" +
                               tr.getDescriptionFor(data) +
                               (at_start ? " before this element":
                                " after this element")
                               + "</a>");
                    $a.click(data,
                             transformation.moveDataCaretFirst(
                                 editor, tree_caret, tr));
                    menu_items.push($("<li></li>").append($a).get(0));
                }
            }.bind(this));

        // There's no menu to display, so let the event bubble up.
        if (menu_items === 0)
            return true;

        editor.displayContextMenu(ev.pageX, ev.pageY, menu_items);
        return false;
    }

    return true;
};


});
