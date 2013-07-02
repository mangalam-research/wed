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

function Decorator(domlistener, editor) {
    this._domlistener = domlistener;
    this._editor = editor;
}

exports.Decorator = Decorator;

Decorator.prototype.init = function ($root) {
    this._domlistener.addHandler(
        "added-element",
        "._real, ._phantom, ._phantom_wrap",
        this.contentEditableHandler.bind(this));

    this._domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap",
        this.contentDecoratorChildChangeHandler.bind(this));

    this._domlistener.addHandler(
        "included-element",
        "._real, ._phantom_wrap",
        this.contentDecoratorInclusionHandler.bind(this));

    this._domlistener.addHandler(
        "text-changed",
        "._real, ._phantom_wrap",
        this.contentDecoratorTextHandler.bind(this));


    var $contents = $root.contents();
    $root.empty();
    this._domlistener.startListening();
    $root.append($contents);
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
    $(el).children('[data-wed--separator-for]').remove();

    var tag_name = tags[0];

    // If sep is a string, create an appropriate div.
    if (typeof sep === "string")
        sep = $('<div class="_text">' + sep + "</div>");

    $(sep).addClass('_phantom');
    $(sep).attr('data-wed--separator-for', tag_name);

    var first = true;
    $(el).children('._real').each(function () {
        if (!first)
            $(this).before(sep.clone());
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
    var cls = "_" + util.escapeCSSClass(orig_name) + "_label";
    $(el).children().remove("." + cls);
    var $pre = $('<span class="_gui _phantom _start_button ' + cls +
                 ' _button label label-info">' + orig_name +
                 '<i class="icon-chevron-right"></i></span>');
    $(el).prepend($pre);
    var $post = $('<span class="_gui _phantom _end_button ' + cls +
                  ' _button label label-info"><i class="icon-chevron-left">' +
                  '</i>' + orig_name + '</span>');
    $(el).append($post);

    // Setup a handler so that clicking one label highlights it and
    // the other label.
    var data = {'$root': $root, '$pre': $pre, '$post': $post};
    $pre.click(data, this._elementButtonClickHandler.bind(this));
    $post.click(data, this._elementButtonClickHandler.bind(this));
    $pre.on("unclick", data, this._elementButtonUnclickHandler.bind(this));
    $post.on("unclick", data, this._elementButtonUnclickHandler.bind(this));

    if (pre_context_handler !== undefined)
        $pre.on('contextmenu', pre_context_handler);
    else
        $pre.on('contextmenu', false);

    if (post_context_handler !== undefined)
        $post.on('contextmenu', post_context_handler);
    else
        $post.on('contextmenu', false);
};

Decorator.prototype._elementButtonClickHandler = function (ev) {
    var data = ev.data;
    var $root = data.$root;
    $root.find('.label-warning').
        removeClass("label-warning").addClass("label-info");
    data.$pre.removeClass("label-info").addClass("label-warning");
    data.$post.removeClass("label-info").addClass("label-warning");
};

Decorator.prototype._elementButtonUnclickHandler = function (ev) {
    var data = ev.data;
    data.$pre.removeClass("label-warning").addClass("label-info");
    data.$post.removeClass("label-warning").addClass("label-info");
};

/**
 * The default implementation just calls
 * <code>_decorateContent</code>
 */
Decorator.prototype.contentDecoratorChildChangeHandler = function (
    $root, $added, $removed, $prev, $next, $target) {
    if (($target.closest(document.documentElement).length > 0) &&
        ($added.is("._real, ._phantom_wrap") ||
         $removed.is("._real, ._phantom_wrap") ||
         $added.filter(jqutil.textFilter).length > 0 ||
         $removed.filter(jqutil.textFilter).length > 0))
        this._decorateContent($root, $target);
};

/**
 * The default implementation just calls
 * <code>_decorateContent</code>
 */
Decorator.prototype.contentDecoratorTextHandler = function ($root, $target) {
    if ($target.closest(document.documentElement).length > 0)
        this._decorateContent($root, $target.parent());
};

Decorator.prototype.contentDecoratorInclusionHandler = function (
    $root, $tree, $parent, $prev, $next, $element) {
    this._decorateContent($root, $element);
};

/**
 * This would typically be overriden by modes to call
 * <code>_contentDecorator</code> with a more specific range of
 * editable nodes.
 */
Decorator.prototype._decorateContent = function ($root, $element) {
    this._contentDecorator($root, $element, null, null);
};

/**
 * This decorator will add placeholder nodes:
 *
 * <ul>
 *  <li>before the first node of the editable content of target
 *      if this node is not preceded by a text node.</li>
 *  <li>after the last node of the editable content of target
 *      if this node is not followed by a text node.</li>
 *  <li>between two immediately contiguous nodes that are
 *      contenteditable.</li>
 * </ul>
 */
Decorator.prototype._contentDecorator = function (
    $root, $target, $node_before, $node_after) {
    var target = $target.get(0);
    // Remove the old gunk
    $target.children('._placeholder').remove();
    var node_before = $node_before.get(0);
    var node_after = $node_after.get(0);

    var first_index = (node_before !== undefined) ?
            Array.prototype.indexOf.call(target.childNodes, node_before) + 1: 0;

    var last_index = (node_after !== undefined) ?
            Array.prototype.indexOf.call(target.childNodes, node_after) - 1 :
            target.childNodes.length - 1;

    // Empty contents
    if (first_index >= last_index) {
        if ($(target.childNodes[first_index]).is("._wed_caret"))
            $target.children("._placeholder").append(
                target.childNodes[first_index]);
        return;
    }

    if ((first_index + 1 === last_index) &&
        $(target.childNodes[last_index]).is("._wed_caret")) {
        $target.children("._placeholder").append(
            target.childNodes[last_index]);
        return;
    }
};

});
