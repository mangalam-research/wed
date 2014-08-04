 /**
  * @module decorator
  * @desc Basic decoration facilities.
  * @author Louis-Dominique Dubeau
  * @license MPL 2.0
  * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
  */
define(/** @lends module:decorator */ function (require, exports, module) {
'use strict';

var util = require("./util");
var $ = require("jquery");
var domutil = require("./domutil");
var jqutil = require("./jqutil");
var transformation = require("./transformation");
var tooltip = require("./gui/tooltip").tooltip;

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
    this._bound_click_handler = this._elementButtonClickHandler.bind(this);
    this._bound_unclick_handler = this._elementButtonUnclickHandler.bind(this);
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
    var root = $root[0];
    var contents = Array.prototype.slice.call(root.childNodes);
    root.innerHTML = "";
    this._domlistener.startListening();
    this._gui_updater.insertAt(root, 0, contents);
};

/**
 * This function adds a separator between each child element of the
 * element passed as <code>el</code>. The function only considers
 * "._real" elements.
 *
 * @param {Node} el The element to decorate.
 * @param {string|Node} sep A separator.
 */
Decorator.prototype.listDecorator = function (el, sep) {
    // We expect to work with a homogeneous list. That is, all
    // children the same element.
    var name_map = {};
    var child = el.firstElementChild;
    while(child) {
        if (child.classList.contains("_real"))
            name_map[util.getOriginalName(child)] = 1;
        child = child.nextElementSibling;
    }

    var tags = Object.keys(name_map);
    if (tags.length > 1)
        throw new Error("calling listDecorator on a non-homogeneous list.");

    if (tags.length === 0)
        return; // Nothing to work with

    // First drop all children that are separators
    child = el.firstElementChild;
    while(child) {
        // Grab it before the node is removed.
        var next = child.nextElementSibling;
        if (child.hasAttribute("data-wed--separator-for"))
            this._gui_updater.removeNode(child);
        child = next;
    }

    var tag_name = tags[0];

    // If sep is a string, create an appropriate div.
    var sep_node;
    if (typeof sep === "string") {
        sep_node = el.ownerDocument.createElement("div");
        sep_node.appendChild(el.ownerDocument.createTextNode(sep));
    }
    else
        sep_node = sep;

    sep_node.classList.add("_text");
    sep_node.classList.add('_phantom');
    sep_node.setAttribute('data-wed--separator-for', tag_name);

    var first = true;
    child = el.firstElementChild;
    while(child) {
        if (child.classList.contains("_real")) {
            if (!first)
                this._gui_updater.insertBefore(el, sep_node.cloneNode(true),
                                               child);
           else
               first = false;
        }
        child = child.nextElementSibling;
    }
};

/**
 * Generic handler for setting <code>contenteditable</code> on nodes
 * included into the tree. The parameters are the same as those for
 * <code>included-element</code> events in {@link module:domlistener
 * domlistener}.
 */
Decorator.prototype.contentEditableHandler = function (
    root, parent, previous_sibling, next_sibling, element) {
    function mod(el) {
        // All elements that may get a selection must be focusable to
        // work around bug:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
        el.setAttribute("tabindex", "-1");
        el.setAttribute("contenteditable", el.classList.contains("_real"));
        var children = el.children;
        for(var i = 0, limit = children.length; i < limit; ++i)
            mod(children[i]);
    }
    mod(element);
};

/**
 * Add a start label at the start of an element and end label at the
 * end.
 *
 * @param {Node} root The root of the decorated tree.
 * @param {Node} el The element to decorate.
 * @param {integer} level The level of the labels for this element.
 * @param {Function} pre_context_handler An event handler to run when
 * the user invokes a context menu on the start label
 * @param {Function} post_context_handler An event handler to run when
 * the user invokes a context menu on the end label.
 */
Decorator.prototype.elementDecorator = function (
    root, el, level, pre_context_handler, post_context_handler) {
    if (level > this._editor.max_label_level)
        throw new Error("level higher than the maximum set by the mode: " +
                        level);
    var orig_name = util.getOriginalName(el);
    // _[name]_label is used locally to make the function idempotent.
    var cls = "_" + orig_name + "_label";
    var child = el.firstElementChild;
    while(child) {
        var next = child.nextElementSibling;
        if (child.classList.contains(cls))
            this._gui_updater.deleteNode(child);
        child = next;
    }

    var doc = el.ownerDocument;
    cls += " _label_level_" + level;
    var pre = doc.createElement("span");
    pre.className = '_gui _phantom __start_label _start_wrapper ' + cls +
        ' _label';
    var pre_ph = doc.createElement("span");
    pre_ph.className = "_phantom";
    pre_ph.innerHTML = "&nbsp;" + orig_name + " >&nbsp;";
    pre.appendChild(pre_ph);
    this._gui_updater.insertNodeAt(el, 0, pre);

    var post = doc.createElement("span");
    post.className = '_gui _phantom __end_label _end_wrapper ' + cls +
        ' _label';
    var post_ph = doc.createElement("span");
    post_ph.className = "_phantom";
    post_ph.innerHTML = '&nbsp;&lt; ' + orig_name + '&nbsp;';
    post.appendChild(post_ph);
    this._gui_updater.insertBefore(el, post, null);

    // Setup a handler so that clicking one label highlights it and
    // the other label.
    var data = {pre: pre, post: post};
    var $pre = $(pre);
    var $post = $(post);
    $pre.on("wed-click click", data, this._bound_click_handler);
    $post.on("wed-click click", data, this._bound_click_handler);
    $pre.on("wed-unclick", data, this._bound_unclick_handler);
    $post.on("wed-unclick", data, this._bound_unclick_handler);

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
            // The check is here so that we can turn tooltips on and off
            // dynamically.
            if (!self._editor.preferences.get("tooltips"))
                return undefined;
            return self._editor.mode.shortDescriptionFor(orig_name);
        },
        container: 'body',
        delay: { show: 1000 },
        placement: "auto top"
    };
    tooltip($pre, options);
    tooltip($post, options);
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
    data.pre.classList.add("_label_clicked");
    data.post.classList.add("_label_clicked");
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
    data.pre.classList.remove("_label_clicked");
    data.post.classList.remove("_label_clicked");
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
    var editor = this._editor;
    var node = wed_ev.currentTarget.parentNode;
    while (node !== editor.gui_root) {
        if (node.classList.contains("_real"))
            break;
        node = node.parentNode;
    }

    if (node.parentNode === editor.gui_root)
        return true;

    var menu_items = [];
    var mode = editor.mode;

    // We first gather the transformations that pertain to the
    // node to which the label belongs.

    var orig = util.getOriginalName(node);

    var li, a;
    var doc = node.ownerDocument;
    var doc_url = this._editor.mode.documentationLinkFor(orig);
    if (doc_url) {
        li = doc.createElement("li");
        li.appendChild(this._editor.makeDocumentationLink(doc_url));
        menu_items.push(li);
    }

    var at_start_to_txt = {
        undefined: "",
        true: " before this element",
        false: " after this element"
    };
    function pushItem(data, tr, at_start) {
        var icon = tr.getIcon();
        a = doc.createElement("a");
        a.setAttribute("tabindex", "-1");
        a.setAttribute("href", "#");
        a.innerHTML = (icon ? icon + " ": "") +
                   tr.getDescriptionFor(data) +
                   at_start_to_txt[at_start];
        $(a).click(data, tr.bound_terminal_handler);
        li = doc.createElement("li");
        li.appendChild(a);
        menu_items.push(li);
    }

    var trs = mode.getContextualActions(["unwrap", "delete-element"],
                                        orig, node, 0);
    if (trs !== undefined) {
        trs.forEach(function (tr) {
            pushItem({node: node, element_name: orig }, tr, undefined);
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

        for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined; ++tr_ix) {
            pushItem({element_name: unresolved, move_caret_to: tree_caret}, tr,
                     at_start);
        }
    }.bind(this));

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0)
        return true;

    var pos = editor.computeContextMenuPosition(ev);
    editor.displayContextMenu(pos.left, pos.top, menu_items);
    return false;
};


});

//  LocalWords:  sep el focusable lt enterStartTag unclick nbsp li
//  LocalWords:  tabindex listDecorator contenteditable href jQuery
//  LocalWords:  gui jqutil domlistener domutil util validator jquery
//  LocalWords:  Mangalam MPL Dubeau
