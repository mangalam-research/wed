/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var core = require("./wed_core");
var Editor = core.Editor;

var $ = require("jquery");
var browsers = require("./browsers");
var log = require("./log");
var saver = require("./saver");
var validator = require("./validator");
var util = require("./util");
var domutil = require("./domutil");
var validate = require("salve/validate");
var key_constants = require("./key_constants");
var modal = require("./gui/modal");
var context_menu = require("./gui/context_menu");
var action_context_menu = require("./gui/action_context_menu");
var completion_menu = require("./gui/completion_menu");
var typeahead_popup = require("./gui/typeahead_popup");
var key = require("./key");
var dloc = require("./dloc");
var makeDLoc = dloc.makeDLoc;
var icon = require("./gui/icon");
var wed_util = require("./wed_util");
var tooltip = require("./gui/tooltip").tooltip;
var guiroot = require("./guiroot");
var getAttrValueNode = wed_util.getAttrValueNode;
require("bootstrap");
require("jquery.bootstrap-growl");
var closestByClass = domutil.closestByClass;
var closest = domutil.closest;

var _indexOf = Array.prototype.indexOf;

Editor.prototype.resize = function () {
    this._resizeHandler();
};

Editor.prototype._resizeHandler = log.wrap(function () {
    var height_after = 0;

    function addHeight() {
        /* jshint validthis:true */
        height_after += this.scrollHeight;
    }

    var $examine = this.$widget;
    while($examine.length > 0) {
        var $next = $examine.nextAll().not("script");
        $next.each(addHeight);
        $examine = $examine.parent();
    }

    height_after += this._wed_location_bar.scrollHeight;

    // The height is the inner height of the window:
    // a. minus what appears before it.
    // b. minus what appears after it.
    var height = this.my_window.innerHeight -
        // This is the space before
        (this._scroller.getBoundingClientRect().top +
         this.my_window.pageYOffset) -
        // This is the space after
        height_after -
        // Some rounding problem
        1;

    height = Math.floor(height);

    this._scroller.style.maxHeight = height + "px";
    this._scroller.style.minHeight = height + "px";

    var sidebar = this._sidebar;
    var pheight = this.my_window.innerHeight -
        (sidebar.getBoundingClientRect().top +
         this.my_window.pageYOffset)-
        height_after;
    sidebar.style.maxHeight = pheight + "px";
    sidebar.style.minHeight = pheight + "px";

    var sp = sidebar.getElementsByClassName("wed-sidebar-panel")[0];
    pheight = this.my_window.innerHeight -
        (sp.getBoundingClientRect().top +
         this.my_window.pageYOffset) -
        height_after;
    sp.style.maxHeight = pheight + "px";
    sp.style.minHeight = pheight + "px";

    var panels = sp.getElementsByClassName("panel");
    var headings = sp.getElementsByClassName("panel-heading");
    var hheight = 0;
    for(var i = 0, heading; (heading = headings[i]) !== undefined; ++i) {
        var $parent = $(heading.parentNode);
        hheight += $parent.outerHeight(true) - $parent.innerHeight();
        hheight += $(heading).outerHeight(true);
    }
    var max_panel_height = pheight - hheight;
    var panel;
    for(i = 0, panel; (panel = panels[i]) !== undefined; ++i) {
        panel.style.maxHeight = max_panel_height +
            $(domutil.childByClass(panel, "panel-heading")).outerHeight(true) +
            "px";
        var body = panel.getElementsByClassName("panel-body")[0];
        body.style.height = max_panel_height + "px";
    }

    // We must refresh these because resizing the editor pane may
    // cause text to move up or down due to line wrap.
    this._refreshValidationErrors();
    this._refreshFakeCaret();
});

/**
 * Opens a documenation link.
 * @param {string} url The url to open.
 */
Editor.prototype.openDocumentationLink = function (url) {
    window.open(url);
};

/**
 * Makes an HTML link to open the documentation of an element.
 *
 * @param {string} doc_url The URL to the documentation to open.
 * @returns {Node} A ``&lt;a>`` element that links to the
 * documentation.
 */
Editor.prototype.makeDocumentationLink = function (doc_url) {
    var icon_html = icon.makeHTML("documentation");
    var a = domutil.htmlToElements(
        "<a tabindex='0' href='#'>" + icon_html + " " +
            "Element's documentation.</a>", this.doc)[0];
    $(a).click(function () {
        this.openDocumentationLink(doc_url);
    }.bind(this));
    return a;
};

Editor.prototype._contextMenuHandler = function (e) {
    if (!this._sel_focus)
        return false;

    var range = this.getSelectionRange();

    var collapsed = !(range && !range.collapsed);
    if (!collapsed && !domutil.isWellFormedRange(range))
        return false;

    var node = this._sel_focus.node;
    var offset = this._sel_focus.offset;
    if (node.nodeType !== Node.ELEMENT_NODE) {
        var parent = node.parentNode;
        offset = _indexOf.call(parent.childNodes, node);
        node = parent;
    }

    // Move out of any placeholder
    var ph = closestByClass(node, "_placeholder", this.gui_root);
    if (ph) {
        offset = _indexOf.call(ph.parentNode.childNodes, ph);
        node = ph.parentNode;
    }

    var method = closestByClass(node, "_attribute_value", this.gui_root) ?
            this._getMenuItemsForAttribute:
            this._getMenuItemsForElement;

    var menu_items = method.call(this, node, offset, !collapsed);

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0)
        return true;

    var pos = this.computeContextMenuPosition(e);
    this.displayContextMenu(action_context_menu.ContextMenu,
                            pos.left, pos.top, menu_items);
    return false;
};

Editor.prototype._getMenuItemsForAttribute = function (node, offset, wrap) {
    var menu_items = [];
    return menu_items;
};

Editor.prototype._getMenuItemsForElement = function (node, offset, wrap) {
    // Object from which the actual data object is created.
    var data_base = {};

    // If we are in a phantom, we want to get to the first parent
    // which is not phantom.
    if (node.classList &&
        node.classList.contains("_phantom")) {
        var last_phantom_child;
        while(node && node.classList.contains("_phantom")) {
            last_phantom_child = node;
            node = node.parentNode;
        }
        if (node && this.gui_root.contains(node)) {
            // The node exists and is in our GUI tree. If the offset
            // is outside editable contents, move it into editable
            // contents.
            var nodes = this.mode.nodesAroundEditableContents(node);
            var contents = node.childNodes;
            offset = _indexOf.call(contents, last_phantom_child);
            var before_ix = nodes[0] && _indexOf.call(contents, nodes[0]);
            var after_ix = nodes[1] && _indexOf.call(contents, nodes[1]);
            if (before_ix !== null && offset <= before_ix)
                offset = before_ix + 1;
            if (after_ix !== null && offset >= after_ix)
                offset = after_ix - 1;
            data_base = {move_caret_to: makeDLoc(this.gui_root, node, offset)};
        }
        else
            node = null;
    }

    if (!node)
        return [];

    var menu_items = [];

    function pushItem(data, tr) {
        var icon = tr.getIcon();
        var li = domutil.htmlToElements(
            "<li><a tabindex='0' href='#'>" + (icon ? icon + " ": "") +
                tr.getDescriptionFor(data) + "</a></li>",
            node.ownerDocument)[0];
        var a = li.firstElementChild;
        $(a).click(data, tr.bound_terminal_handler);
        menu_items.push({action: tr, item: li, data: data});
    }

    var tr_ix, tr;
    if (!node.classList.contains("_phantom") &&
        // Should not be part of a gui element.
        !node.parentNode.classList.contains("_gui")) {

        // We want the data node, not the gui node.
        var data_node = this.toDataNode(node);

        var doc_url = this.mode.documentationLinkFor(data_node.tagName);

        if (doc_url) {
            var a = this.makeDocumentationLink(doc_url);
            var li = node.ownerDocument.createElement("li");
            li.appendChild(a);
            menu_items.push({action: null, item: li, data: null});
        }

        this.validator.possibleAt(
            data_node, offset).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag")
                    return;

                var unresolved = this.resolver.unresolveName(
                    ev.params[1], ev.params[2]);

                var trs = this.mode.getContextualActions(
                    wrap ? "wrap" : "insert", unresolved, data_node, offset);

                for(tr_ix = 0; (tr = trs[tr_ix]) !== undefined; ++tr_ix)
                    pushItem({name: unresolved}, tr);
            }.bind(this));

        if (data_node !== this.data_root.firstChild) {
            var trs = this.mode.getContextualActions(
                ["unwrap", "delete-parent"], data_node.tagName, data_node, 0);
            for(tr_ix = 0; (tr = trs[tr_ix]) !== undefined; ++tr_ix)
                pushItem({node: data_node, name: data_node.tagName }, tr);
        }
    }

    var $sep = $(node).parents().addBack().
            siblings("[data-wed--separator-for]").first();
    var transformation_node = $sep.siblings().filter(function () {
        // Node.contains() will return true if this === node, whereas
        // jQuery.has() only looks at descendants, so this can't be
        // replaced with .has().
        return this.contains(node);
    })[0];
    var sep_for = $sep[0] && $sep[0].getAttribute("data-wed--separator-for");
    if (sep_for !== undefined) {
        var trs = this.mode.getContextualActions(
            ["merge-with-next", "merge-with-previous", "append",
             "prepend"], sep_for,
            $.data(transformation_node, "wed_mirror_node"), 0);
        trs.forEach(function (tr) {
            pushItem({node: transformation_node, name: sep_for}, tr);
        }.bind(this));
    }

    return menu_items;
};

/**
 * Computes where a context menu should show up, depending on the
 * event that triggered it.
 *
 * @param {Event} [e] The event that triggered the menu. If no event
 * is passed, it is assumed that the menu was not triggered by a mouse
 * event.
 * @param {boolean} [bottom=false] If the event was not triggered by a
 * mouse event, then use the bottom of the DOM entity used to compute
 * the position, rather than its middle to determine the ``y``
 * coordinate of the context menu.
 * @returns {{top: number, left: number}} The top and left coordinates
 * where the menu should appear.
 */
Editor.prototype.computeContextMenuPosition = function (e, bottom) {
    bottom = !!bottom;
    var keyboard = !e;
    e = e || {};
    var pos, rect;
    if (e.type === "mousedown" || e.type === "mouseup" || e.type === "click" ||
        e.type === "contextmenu")
        pos = {left: e.clientX, top: e.clientY};
    // The next conditions happen only if the user is using the keyboard
    else if (this._fake_caret.parentNode) {
        var rel_pos = this._positionFromGUIRoot(this._fake_caret);
        this.scrollIntoView(rel_pos.left, rel_pos.top,
                            rel_pos.left + this._fake_caret.offsetWidth,
                            rel_pos.top + this._fake_caret.offsetHeight);
        rect = this._fake_caret.getBoundingClientRect();
        pos = {top: bottom ? rect.bottom :
               (rect.top + this._$fake_caret.height() / 2),
               left: rect.left};
    }
    else {
        var gui = closestByClass(this._sel_focus.node, "_gui", this.gui_root);
        if (gui) {
            rect = gui.getBoundingClientRect();
            // Middle of the region.
            var $gui = $(gui);
            pos = {top: bottom ? rect.bottom : (rect.top + $gui.height() / 2),
                   left: rect.left + $gui.width() / 2};
        }
        else
            // No position.
            throw new Error("no position for displaying the menu");
    }

    return pos;
};

Editor.prototype._cutHandler = function(e) {
    if (this.getDataCaret() === undefined)
        return false; // XXX alert the user?

    var range = this._getDOMSelectionRange();
    if (domutil.isWellFormedRange(range)) {
        // The only thing we need to pass is the event that triggered the
        // cut.
        this.fireTransformation(this.cut_tr, {e: e});
        return true;
    }
    else {
        this.straddling_modal.modal();
        return false;
    }
};

Editor.prototype._pasteHandler = function(e) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    // IE puts the clipboardData as a object on the window.
    var cd = e.originalEvent.clipboardData || this.my_window.clipboardData;

    var text = cd.getData("text");
    if (!text)
        return false;

    // This could result in an empty string.
    text = this._normalizeEnteredText(text);
    if (!text)
        return false;

    var data;
    var parser = new this.my_window.DOMParser();
    var doc = parser.parseFromString("<div>" + text + "</div>", "text/xml");
    var as_xml = true;
    if (doc.firstChild.tagName === "parsererror" &&
        doc.firstChild.namespace ===
        "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
        as_xml = false;
    }

    if (as_xml) {
        data = doc.firstChild;
        // Otherwise, check whether it is valid.
        var errors = this.validator.speculativelyValidate(
            caret, Array.prototype.slice.call(data.childNodes));

        if (errors) {
            // We need to save this before we bring up the modal because
            // clicking to dismiss the modal will mangle ``cd``.
            this._paste_modal.modal(function () {
                if (this._paste_modal.getClickedAsText() === "Yes") {
                    data = this.doc.createElement("div");
                    data.textContent = text;
                    // At this point data is a single top level
                    // fake <div> element which contains the
                    // contents we actually want to paste.
                    this.fireTransformation(this.paste_tr,
                                            {node: caret.node,
                                             to_paste: data, e: e});
                }
            }.bind(this));
            return false;
        }
    }
    else {
        data = this.doc.createElement("div");
        data.textContent = text;
    }

    // At this point data is a single top level fake <div> element
    // which contains the contents we actually want to paste.
    this.fireTransformation(this.paste_tr,
                            {node: caret.node, to_paste: data, e: e});
    return false;
};

/**
 * <p>Scrolls the window and <code>gui_root</code> so that the
 * rectangle is visible to the user. The rectangle coordinates must be
 * relative to the <code>gui_root</code> element.</p>
 *
 * <p>This method tries to be the least disruptive it can: it will
 * adjust <code>gui_root</code> and the window <emph>just
 * enough</emph> to make the rectangle visible.</p>
 *
 * @param {number} left Left side of the rectangle.
 * @param {number} top Top side of the rectangle.
 * @param {number} right Right side of the rectangle.
 * @param {number} bottom Bottom side of the rectangle.
 */
Editor.prototype.scrollIntoView = function (left, top, right, bottom) {
    // Adjust gui_root.
    var vtop = this.gui_root.scrollTop;
    var vheight = this.$gui_root.height();
    var vbottom = vtop + vheight;

    if (top < vtop || bottom > vbottom) {
        // Not already in view.
        vtop = top < vtop ? top : bottom - vheight;
        this.gui_root.scrollTop = vtop;
    }

    var vleft = this.gui_root.scrollLeft;
    var vwidth = this.$gui_root.width();
    var vright = vleft + vwidth;

    if (left < vleft || right > vright) {
        // Not already in view.
        vleft = left < vleft ? left : right - vwidth;
        this.gui_root.scrollLeft = vleft;
    }

    var gui_pos = this.gui_root.getBoundingClientRect();

    // Compute the coordinates relative to the client.
    left = left - vleft + gui_pos.left;
    right = right - vleft + gui_pos.left;
    top = top - vtop + gui_pos.top;
    bottom = bottom - vtop + gui_pos.top;

    var sheight = this.doc.body.scrollHeight;
    var swidth = this.doc.body.scrollWidth;

    var by_y = 0;
    if (top < 0 || bottom > sheight)
        by_y = top < 0 ? top : bottom;

    var by_x = 0;
    if (left < 0 || right > swidth)
        by_x = left < 0 ? left : right;

    this.my_window.scrollBy(by_x, by_y);
};

Editor.prototype._keydownHandler = log.wrap(function (e) {
    var caret = this.getGUICaret();
    // Don't call it on undefined caret.
    if (caret)
        this.$gui_root.trigger('wed-input-trigger-keydown', [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return;

    this.$gui_root.trigger('wed-global-keydown', [e]);
});

Editor.prototype.pushGlobalKeydownHandler = function (handler) {
    this._global_keydown_handlers.push(handler);
};

Editor.prototype.popGlobalKeydownHandler = function (handler) {
    var popped = this._global_keydown_handlers.pop();
    if (popped !== handler)
        throw new Error("did not pop the expected handler");
};

Editor.prototype._globalKeydownHandler = log.wrap(function (wed_event, e) {
    var range, caret; // damn hoisting
    var me = this;

    // These are things like the user hitting Ctrl, Alt, Shift, or
    // CapsLock, etc. Return immediately.
    if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0)
        return true;

    function terminate() {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    for(var i = 0, handler;
        (handler = this._global_keydown_handlers[i]) !== undefined; ++i) {
        var ret = handler(wed_event, e);
        if (ret === false)
            terminate();
    }

    // F1
    if (e.which === 112) {
        this.help_modal.modal();
        return terminate();
    }

    // Diagnosis stuff
    if (this._development_mode) {
        // F2
        if (e.which === 113) {
            this.dumpCaretInfo();
            return terminate();
        }
        // F3
        if (e.which == 114) {
            this.dumpUndo();
            return terminate();
        }
        // F4
        if (e.which == 115) {
            console.log("manual focus");
            console.log("document.activeElement before",
                        document.activeElement);
            console.log("document.querySelector(\":focus\") before",
                        document.querySelector(":focus"));
            this._focusInputField();
            console.log("document.activeElement after",
                        document.activeElement);
            console.log("document.querySelector(\":focus\") after",
                        document.querySelector(":focus"));
            return terminate();
        }
    }

    var sel_focus = this._sel_focus;
    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
        var pos, sel; // damn hoisting
        if (key_constants.RIGHT_ARROW.matchesEvent(e)) {
            if (e.shiftKey) {
                // Extend the selection
                this._sel_focus = this.positionRight(this._sel_focus);
                var rr = this._sel_anchor.makeRange(this._sel_focus);
                this.setSelectionRange(rr.range, rr.reversed);
            }
            else
                this.moveCaretRight();
            return terminate();
        }
        else if (key_constants.LEFT_ARROW.matchesEvent(e)) {
            if (e.shiftKey) {
                // Extend the selection
                this._sel_focus = this.positionLeft(this._sel_focus);
                var rr = this._sel_anchor.makeRange(this._sel_focus);
                this.setSelectionRange(rr.range, rr.reversed);
            }
            else
                this.moveCaretLeft();
            return terminate();
        }
        return true;
    }
    else if (key_constants.ESCAPE.matchesEvent(e)) {
        if (this._closeAllTooltips())
            return terminate();
        return true;
    }
    else if (key_constants.CTRLEQ_S.matchesEvent(e)) {
        this.save();
        return terminate();
    }
    else if (key_constants.CTRLEQ_Z.matchesEvent(e)) {
        this.undo();
        return terminate();
    }
    else if (key_constants.CTRLEQ_Y.matchesEvent(e)) {
        this.redo();
        return terminate();
    }
    else if (key_constants.CTRLEQ_C.matchesEvent(e) ||
             key_constants.CTRLEQ_X.matchesEvent(e) ||
             key_constants.CTRLEQ_V.matchesEvent(e)) {
        return true;
    }
    else if (key_constants.CTRLEQ_BACKQUOTE.matchesEvent(e)) {
        this._development_mode = !this._development_mode;
        $.bootstrapGrowl(this._development_mode ? "Development mode on.":
                         "Development mode off.",
                         { ele: "body", type: 'info', align: 'center' });
        if (this._development_mode)
            log.showPopup();
        return terminate();
    }
    else if (key_constants.CTRLEQ_OPEN_BRACKET.matchesEvent(e)) {
        this.decreaseLabelVisiblityLevel();
        return terminate();
    }
    else if (key_constants.CTRLEQ_CLOSE_BRACKET.matchesEvent(e)) {
        this.increaseLabelVisibilityLevel();
        return terminate();
    }
    else if (key_constants.CTRLEQ_FORWARD_SLASH.matchesEvent(e)) {
        var sel_focus_node = sel_focus && sel_focus.node;
        if (sel_focus_node) {
            var gui = closestByClass(sel_focus_node, "_gui", sel_focus.root);
            if (gui && gui.classList.contains("_label_clicked")) {
                if (sel_focus_node.nodeType === Node.TEXT_NODE)
                    sel_focus_node = sel_focus_node.parentNode;
                $(sel_focus_node).trigger("wed-context-menu", [e]);
                return terminate();
            }
        }

        if (this._contextMenuHandler(e) === false)
            return terminate();
    }

    if (sel_focus === undefined)
        return true;

    var placeholder = closestByClass(sel_focus.node, '_placeholder',
                                     sel_focus.root);
    if (placeholder) {
        // We're in a placeholder, so...

        // Reminder: if the caret is currently inside a placeholder
        // getCaret will return a caret value just in front of the
        // placeholder.
        caret = this.getDataCaret();

        // A place holder could be in a place that does not allow
        // text. If so, then do not allow entering regular text in
        // this location.
        if (!util.anySpecialKeyHeld(e)) {
            var text_possible = false;

            if (placeholder.parentNode.classList.contains("_attribute_value"))
                text_possible = true;
            else
                // Maybe throwing an exception could stop this loop
                // early but that would have to be tested.
                this.validator.possibleAt(caret).forEach(function (ev) {
                    if (ev.params[0] === "text")
                        text_possible = true;
                });

            if (!text_possible)
                return terminate();
        }

        // Swallow these events when they happen in a placeholder.
        if (key_constants.BACKSPACE.matchesEvent(e) ||
            key_constants.DELETE.matchesEvent(e))
            return terminate();
    }

    var attr_val = closestByClass(sel_focus.node, "_attribute_value",
                                  sel_focus.root);
    var $label = this.$gui_root.find(
        ".__start_label._label_clicked, .__end_label._label_clicked");
    if (!attr_val && $label[0] && key_constants.DELETE.matchesEvent(e)) {
        // The caret is currently in an element label, and not in an
        // attribute value. Delete the element!
        var el = closestByClass($label[0], "_real", this.gui_root);
        var data_node = this.data_updater.pathToNode(this.nodeToPath(el));
        var trs = this.mode.getContextualActions("delete-parent",
                                                 data_node.tagName,
                                                 data_node, 0);

        trs[0].execute({node: data_node, name: data_node.tagName});
    }
    else if (sel_focus.node.classList &&
             (sel_focus.node.classList.contains('_phantom') ||
              sel_focus.node.classList.contains('_phantom_wrap')))
        return terminate();

    function handleRange() {
        var range = me.getSelectionRange();
        if (range && !range.collapsed) {
            if (!domutil.isWellFormedRange(range))
                return true;

            text_undo = me._initiateTextUndo();
            var start_caret = me.toDataLocation(range.startContainer,
                                                  range.startOffset);
            var end_caret = me.toDataLocation(range.endContainer,
                                                range.endOffset);
            var cut_ret = me.data_updater.cut(start_caret, end_caret);
            me.setDataCaret(cut_ret[0], true);
            text_undo.recordCaretAfter();
            me._refreshValidationErrors();
            return true;
        }

        return false;
    }

    var text_undo, parent, offset; // damn hoisting

    if (key_constants.SPACE.matchesEvent(e)) {
        caret = this.getGUICaret();
        if (!caret)
            return terminate();

        if (attr_val || !closestByClass(caret.node, "_phantom", caret.root))
            this._handleKeyInsertingText(e);

        return terminate();
    }
    else if (key_constants.DELETE.matchesEvent(e)) {
        if (attr_val) { // In attribute.
            if (attr_val.textContent === "") // empty === noop
                return terminate();

            this._spliceAttribute(attr_val,
                                  this.getGUICaret().offset, 1, '');
        }
        else {
            // Prevent deleting phantom stuff
            var next = domutil.nextCaretPosition(sel_focus.toArray(),
                                                 this.gui_root,
                                                 true)[0];
            if (!next.classList ||
                !(next.classList.contains("_phantom") ||
                  next.classList.contains("_phantom_wrap"))) {

                // When a range is selected, we delete the whole range.
                if (handleRange())
                    return terminate();

                // We need to handle the delete
                caret = this.getDataCaret();
                // If the container is not a text node, we may still
                // be just AT a text node from which we can
                // delete. Handle this.
                if (caret.node.nodeType !== Node.TEXT_NODE)
                    caret = caret.make(caret.node.childNodes[caret.offset], 0);

                if (caret.node.nodeType === Node.TEXT_NODE) {
                    parent = caret.node.parentNode;
                    offset = _indexOf.call(parent.childNodes, caret.node);

                    text_undo = this._initiateTextUndo();
                    this.data_updater.deleteText(caret, 1);
                    // Don't set the caret inside a node that has been
                    // deleted.
                    if (caret.node.parentNode)
                        this.setDataCaret(caret, true);
                    else
                        this.setDataCaret(parent, offset, true);
                    text_undo.recordCaretAfter();
                }
            }
        }
        this._refreshValidationErrors();
        return terminate();
    }
    else if (key_constants.BACKSPACE.matchesEvent(e)) {
        if (attr_val) { // In attribute.
            if (attr_val.textContent === "") // empty === noop
                return terminate();

            this._spliceAttribute(attr_val,
                                  this.getGUICaret().offset - 1, 1, '');
        }
        else {
            // Prevent backspacing over phantom stuff
            var prev = domutil.prevCaretPosition(sel_focus.toArray(),
                                                 this.gui_root, true)[0];
            if (!prev.classList ||
                !(prev.classList.contains("_phantom") ||
                  prev.classList.contains("_phantom_wrap"))) {

                // When a range is selected, we delete the whole range.
                if (handleRange())
                    return terminate();

                // We need to handle the backspace
                caret = this.getDataCaret();

                // If the container is not a text node, we may still
                // be just behind a text node from which we can
                // delete. Handle this.
                if (caret.node.nodeType !== Node.TEXT_NODE)
                    caret = caret.make(
                        caret.node.childNodes[caret.offset - 1],
                        caret.node.childNodes[caret.offset - 1].length);

                if (caret.node.nodeType === Node.TEXT_NODE) {
                    parent = caret.node.parentNode;
                    offset = _indexOf.call(parent.childNodes, caret.node);

                    // At start of text, nothing to delete.
                    if (caret.offset === 0)
                        return terminate();

                    text_undo = this._initiateTextUndo();
                    this.data_updater.deleteText(caret.node, caret.offset - 1,
                                                 1);
                    // Don't set the caret inside a node that has been
                    // deleted.
                    if (caret.node.parentNode)
                        this.setDataCaret(caret.node, caret.offset - 1, true);
                    else
                        this.setDataCaret(parent, offset, true);
                    text_undo.recordCaretAfter();
                }
            }
        }
        this._refreshValidationErrors();
        return terminate();
    }

    return true;
});

// We don't put this in key_constants because ESCAPE_KEYPRESS should never
// be seen elsewhere.
var ESCAPE_KEYPRESS = key.makeKey(27);

Editor.prototype._keypressHandler = log.wrap(function (e) {
    // IE is the odd browser that allows ESCAPE to show up as a keypress so
    // we have to prevent it from going any further.
    if (ESCAPE_KEYPRESS.matchesEvent(e))
        return true;

    this.$gui_root.trigger('wed-input-trigger-keypress', [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return true;

    this.$gui_root.trigger('wed-global-keypress', [e]);
});

/**
 * Simulates typing text in the editor.
 *
 * @param {module:key~Key|Array.<module:key~Key>|string} text The text to type
 * in. An array of keys, a string or a single key.
 */
Editor.prototype.type = function (text) {
    if (text instanceof key.Key)
        text = [text];

    for(var ix = 0; ix < text.length; ++ix) {
        var k = text[ix];
        if (typeof(k) === "string")
            k = (k === " ") ? key_constants.SPACE : key.makeKey(k);

        var event = new $.Event("keydown");
        k.setEventToMatch(event);
        this._$input_field.trigger(event);
    }
};

Editor.prototype._globalKeypressHandler = log.wrap(function (wed_event, e) {
    if (this._sel_focus === undefined)
        return true;

    function terminate() {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // On Firefox keypress events are generated for things like
    // hitting the left or right arrow. The which value is 0 in
    // these cases. On Chrome, hitting the left or right arrow
    // will generate keyup, keydown events but not keypress. Yay
    // for inconsistencies!
    if (!e.which)
        return true;

    // Backspace, which for some reason gets here on Firefox...
    if (e.which === 8)
        return terminate();

    // On Firefox the modifier keys will generate a keypress
    // event, etc. Not so on Chrome. Yay for inconsistencies!
    if (e.ctrlKey || e.altKey || e.metaKey)
        return true;

    var range = this.getSelectionRange();

    // When a range is selected, we would replace the range with the
    // text that the user entered.
    if (range !== undefined && !range.collapsed) {
        // Except that we do not want to do that unless it is
        // well-formed.
        if (!domutil.isWellFormedRange(range))
            return terminate();

        var text_undo = this._initiateTextUndo();
        var start_caret = this.toDataLocation(range.startContainer,
                                              range.startOffset);
        var end_caret = this.toDataLocation(range.endContainer,
                                            range.endOffset);
        var cut_ret = this.data_updater.cut(start_caret, end_caret);
        this.setDataCaret(cut_ret[0], true);
    }

    this._handleKeyInsertingText(e);
    return terminate();
});

Editor.prototype._handleKeyInsertingText = function (e) {
    var text = String.fromCharCode(e.which);

    if (text === "") // Nothing needed
        return false;

    this._insertText(text);
    e.preventDefault();
    e.stopPropagation();
};

Editor.prototype._compositionHandler = log.wrap(function (ev) {
    if (ev.type === "compositionstart") {
        this._composing = true;
        this._composition_data = {
            data: ev.originalEvent.data,
            start_caret: this._sel_focus
        };
        this._$input_field.css("z-index", 10);
        this._refreshFakeCaret();
    }
    else if (ev.type === "compositionupdate") {
        this._composition_data.data = ev.originalEvent.data;
    }
    else if (ev.type === "compositionend") {
        this._composing = false;
        this._$input_field.css("z-index", "").css("top", "").css("left", "");
    }
    else
        throw new Error("unexpected event type: " + ev.type);
});

Editor.prototype._inputHandler = log.wrap(function (e) {
    if (this._composing)
        return;
    if (this._$input_field.val() === "")
        return;
    this._insertText(this._$input_field.val());
    this._$input_field.val("");
    this._focusInputField();
});

Editor.prototype._mousemoveHandler = log.wrap(function (e) {
    var element_at_mouse = this.elementAtPointUnderLayers(e.clientX,
                                                          e.clientY);
    if (!this.gui_root.contains(element_at_mouse))
        return; // Not in GUI tree.

    var boundary;
    if(element_at_mouse.getAttribute("contenteditable") === "true") {
        boundary = this._pointToCharBoundary(e.clientX, e.clientY);
        if (!boundary)
            return;
    }
    else {
        var child;
        while (element_at_mouse.getAttribute("contenteditable") !== "true") {
            child = element_at_mouse;
            element_at_mouse = child.parentNode;
            if (!this.gui_root.contains(element_at_mouse))
                return; // The mouse was in a bunch of non-editable elements.
        }
        var offset = _indexOf.call(element_at_mouse.childNodes, child);
        var range = this.doc.createRange();
        range.setStart(element_at_mouse, offset);
        range.setEnd(element_at_mouse, offset + 1);
        var rect = range.getBoundingClientRect();
        if (Math.abs(rect.left - e.clientX) >= Math.abs(rect.right - e.clientX))
            offset++;
        boundary = makeDLoc(this.gui_root, element_at_mouse, offset);
    }

    this._sel_focus = boundary;

    // This check reduces selection fiddling by an order of magnitude
    // when just straightforwardly selecting one character.
    if (!this._prev_sel_focus ||
        this._sel_focus.offset != this._prev_sel_focus.offset ||
        this._sel_focus.node != this._prev_sel_focus.node) {
        this._refreshFakeCaret();
        var rr = this._sel_anchor.makeRange(this._sel_focus);
        // We use _setDOMSelectionRange here because using
        // setSelectionRange would incur some redundant operations.
        this._setDOMSelectionRange(rr.range, rr.reversed);
        this._prev_sel_focus = this._sel_focus;
    }
});


/**
 * Returns the element under the point, ignoring the editor's layers.
 *
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @returns {Node|undefined} The element under the point, or
 * <code>undefined</code> if the point is outside the document.
 */
Editor.prototype.elementAtPointUnderLayers = function (x, y) {
    //
    // The problem that the following code was meant to fix did not
    // happen in Chrome 30 and is irreproducible in Chrome 32, and did
    // not happen with other browsers. So it appears to have been a
    // bug in Chrome 31. And doing the range save and restore is
    // computationally expensive, so it is not a workaround we want to
    // keep in place for all browsers. (Before you blow a gasket about
    // checking browser versions, see the editorial in the browsers
    // module.)
    //
    var range;
    if (browsers.CHROME_31) {
        // The css manipulation disturbs the selection on Chrome
        // 31. Therefore, save the range.
        range = this._getDOMSelectionRange();
        if (range)
            // Detach it.
            range = range.cloneRange();
    }

    this._hideLayers();
    var element = this.doc.elementFromPoint(x, y);
    this._popLayerState();

    // Restore the range. See above why.
    if (range)
        this._setDOMSelectionRange(range);

    return element;
};


/**
 * Push the current display state of the layers and hide them. Use
 * {@link module:wed~Editor#_popLayerState _popLayerState} restore
 * their state.
 */
Editor.prototype._hideLayers = function () {
    var state = Object.create(null);
    for(var i = 0, name; (name = this._layer_names[i]) !== undefined; ++i) {
        var layer = this[name];
        state[name] = layer.style.display;
        layer.style.display = "none";
    }

    this._layer_state_stack.push(state);
};

/**
 * Restore the layer display state to the state saved when {@link
 * module:wed~Editor#_hideLayers _hideLayers} was last called.
 */
Editor.prototype._popLayerState = function () {
    var state = this._layer_state_stack.pop();
    for(var i = 0, name; (name = this._layer_names[i]) !== undefined; ++i) {
        var layer = this[name];
        layer.style.display = state[name];
    }
};


Editor.prototype._caretLayerMouseHandler = log.wrap(function (e) {
    if (e.type === "mousedown") {
        this._$caret_layer.on("mousemove",
                             this._caretLayerMouseHandler.bind(this));
        this._$caret_layer.one("mouseup",
                               this._caretLayerMouseHandler.bind(this));
    }
    var element_at_mouse =
        this.elementAtPointUnderLayers(e.clientX, e.clientY);
    var new_e = $.Event(e.type, e);
    new_e.target = element_at_mouse;
    new_e.toElement = element_at_mouse;
    $(element_at_mouse).trigger(new_e);
    if (e.type === "mouseup")
        this._$caret_layer.off("mousemove");
    e.preventDefault();
    e.stopPropagation();
});

Editor.prototype._moveToNormalizedLabelPosition = function (target, label,
                                                            boundary) {
    // Note that in the code that follows, the choice between testing
    // against ``target`` or against ``boundary.node`` is not arbitrary.
    var attr = closestByClass(target, "_attribute", label);
    if (attr) {
        if (closestByClass(boundary.node, "_attribute_value", label))
            this.setGUICaret(boundary);
        else
            this.setGUICaret(getAttrValueNode(attr.getElementsByClassName(
                "_attribute_value")[0]), 0);
    }
    else {
        // Find the element name and put it there.
        this.setGUICaret(label.getElementsByClassName("_element_name")[0], 0);
    }
};

Editor.prototype._mousedownHandler = log.wrap(function(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!domutil.pointInContents(this._scroller, ev.pageX, ev.pageY))
        return false;

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary)
        return true;

    this.$gui_root.one("mouseup",
                       this._mouseupHandler.bind(this));

    this.$widget.find('.wed-validation-error.selected').removeClass('selected');
    this.$error_list.find('.selected').removeClass('selected');

    var root = this.gui_root;
    var target = ev.target;
    var placeholder = closestByClass(target, "_placeholder", root);
    var label = closestByClass(target, "_label", root);
    switch(ev.which) {
    case 1:
        // Don't track selections in gui elements, except if they are
        // inside an attribute value.
        if (!closest(target, "._gui, ._phantom", root) ||
            closestByClass(target, "_attribute_value", root))
            this.$gui_root.on('mousemove.wed',
                              this._mousemoveHandler.bind(this));

        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if (placeholder)
            this.setGUICaret(placeholder, 0);
        else if (label)
            // If the caret is changing due to a click on a
            // label, then normalize it to a valid position.
            this._moveToNormalizedLabelPosition(target, label, boundary);
        else
            this.setGUICaret(boundary);

        // _sel_focus and _sel_anchor were set by setGUICaret.
        this._prev_sel_focus = undefined;
        if (ev.target.classList.contains("wed-validation-error"))
            return true;

        break;
    case 3:
        var range = this.getSelectionRange();
        if (!(range && !range.collapsed)) {
            // If the caret is changing due to a click on a
            // placeholder, then put it inside the placeholder.
            if (placeholder)
                this.setGUICaret(placeholder, 0);
            else if (label)
                // If the caret is changing due to a click on a
                // label, then normalize it to a valid position.
                this._moveToNormalizedLabelPosition(target, label, boundary);
            else
                this.setGUICaret(boundary);
        }
    }
    return false;
});

// In previous versions of wed all mouse button processing was done in
// _mousedownHandler. However, this caused problems when processing context
// menus events. On IE in particular the mouseup that would occur when a
// context menu is brought up would happen on the newly brought up menu and
// would cause focus problems.
Editor.prototype._mouseupHandler = log.wrap(function(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!domutil.pointInContents(this._scroller, ev.pageX, ev.pageY))
        return false;

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary)
        return true;

    // Normalize.
    if (ev.type === "contextmenu")
        ev.which = 3;

    var root = this.gui_root;
    var target = ev.target;
    var placeholder = closestByClass(target, "_placeholder", root);
    var label = closestByClass(target, "_label", root);
    switch(ev.which) {
    case 3:
        // If the caret is changing due to a click on a placeholder,
        // then put it inside the placeholder.
        if (placeholder)
            this.setGUICaret(target, 0);

        if (label) {
            this._moveToNormalizedLabelPosition(target, label, boundary);
            $(target).trigger("wed-context-menu", [ev]);
        }
        else {
            // If the editor is just gaining focus with *this* click,
            // then this._sel_focus will not be set. It also means the
            // range is collapsed.
            if (!this._sel_focus)
                this.setGUICaret(boundary);

            if (closest(target, "*[data-wed-custom-context-menu]", root))
                $(target).trigger("wed-context-menu", [ev]);
            else
                this._contextMenuHandler(ev);
        }
    }
    this.$gui_root.off("mousemove");
    ev.preventDefault();
    return false;
});

Editor.prototype._mouseoverHandler = log.wrap(function(ev) {
    var root = this.gui_root;
    var label = closestByClass(ev.target, "_label", root);
    if (label) {
        // Get tooltips from the current mode
        var self = this;
        var real = closestByClass(label, "_real", root);
        var orig_name = util.getOriginalName(real);
        var options = {
            title: function () {
                // The check is here so that we can turn tooltips on and off
                // dynamically.
                if (!self.preferences.get("tooltips"))
                    return undefined;
                return self.mode.shortDescriptionFor(orig_name);
            },
            container: 'body',
            delay: { show: 1000 },
            placement: "auto top"
        };
        tooltip($(label), options);
        var tt = $.data(label, 'bs.tooltip');
        tt.enter(tt);
    }
});

Editor.prototype._mouseoutHandler = log.wrap(function(ev) {
    var root = this.gui_root;
    var label = closestByClass(ev.target, "_label", root);
    if (label) {
        $(label).tooltip('destroy');
        // See _mouseoutHandler. We return false here for symmetry.
        return false;
    }
});

Editor.prototype._setupCompletionMenu = function () {
    this._dismissDropdownMenu();
    var range = this.getSelectionRange();

    // We must not have an actual range in effect
    if (!range || !range.collapsed)
        return;

    var caret = this.getGUICaret();
    var node = caret.node;
    var attr_val = closestByClass(node, "_attribute_value", this.gui_root);
    if (attr_val) {
        var doc = node.ownerDocument;
        var data_caret = this.getDataCaret();
        var data_node = data_caret.node;
        // We complete only at the end of an attribute value.
        if (data_caret.offset !== data_node.value.length)
            return;
        var mode = this.mode;
        var possible = [];
        this.validator.possibleAt(data_caret.node, 0).forEach(function (ev) {
            if (ev.params[0] !== "attributeValue")
                return;

            if (ev.params[0] === "attributeValue") {
                var text = ev.params[1];
                if (text instanceof RegExp)
                    return;

                possible.push(text);
            }
        });

        if (!possible.length)
            return;

        var narrowed = [];
        for(var i = 0, possibility;
            (possibility = possible[i]) !== undefined; ++i) {
            if (possibility.lastIndexOf(data_node.value, 0) === 0)
                narrowed.push(possibility);
        }

        // The current value in the attribute is not one that can be
        // completed.
        if (!narrowed.length ||
            (narrowed.length === 1 && narrowed[0] === data_node.value))
            return;

        var pos = this.computeContextMenuPosition(undefined, true);

        this._current_dropdown =
            new completion_menu.CompletionMenu(
                this, doc, pos.left, pos.top, data_node.value, possible,
                function () {
                this._current_dropdown = undefined;
            }.bind(this));
    }
};

/**
 * @param {Element} element The element for which we want a position.
 * @returns {{left: number, top: number}} The coordinates of the
 * element relative to the GUI root.
 */
Editor.prototype._positionFromGUIRoot = function (element) {
    // _fake_caret is a special case because this function may be
    // called when the caret layer is invisible. So we can't rely on
    // offset. Fortunately, the CSS values are what we want, so...
    var pos;
    if (element === this._fake_caret) {
        pos = {
            left: +element.style.left.replace("px", ""),
            top: +element.style.top.replace("px", "")
        };

        if (isNaN(pos.left) || isNaN(pos.top))
            throw new Error("NAN for left or top");

        // We don't need to subtract the offset of gui_root from these
        // coordinates since they are relative to the gui_root object
        // to start with.
        pos.left += this.gui_root.scrollLeft;
        pos.top += this.gui_root.scrollTop;

        return pos;
    }

    // There is no guarantee regarding who is the element's
    // offsetParent, so $.position() can't be used. So get the
    // relative screen position, and adjust by scroll.
    pos = $(element).offset();

    var gui_pos = this.$gui_root.offset();
    pos.left -= gui_pos.left - this.gui_root.scrollLeft;
    pos.top -= gui_pos.top - this.gui_root.scrollTop;
    return pos;
};

Editor.prototype._dismissDropdownMenu = function () {
    // We may be called when there is no menu active.
    if (this._current_dropdown)
        this._current_dropdown.dismiss();
};

/**
 * @param items Must be a sequence of <li> elements that will form the
 * menu. The actual data type can be anything that jQuery() accepts.
 */
Editor.prototype.displayContextMenu = function (cm_class, x, y, items) {
    this._dismissDropdownMenu();
    this.pushSelection();
    this._current_dropdown = new cm_class(
        this.doc, x, y, items,
        function() {
        this._current_dropdown = undefined;
        this.popSelection();
    }.bind(this));
};

/**
 * Brings up a typeahead popup. See the documentation of {@link
 * module:gui/typeahead_popup~TypeaheadPopup TypeaheadPopup} for the
 * meaning of the parameters.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {string} placeholder
 * @param {Object} options
 * @param {Function} dismiss_callback
 * @returns {module:gui/typeahead_popup~TypeaheadPopup} The popup that
 * was created.
 */
Editor.prototype.displayTypeaheadPopup = function (x, y, width, placeholder,
                                                   options, dismiss_callback) {
    this._dismissDropdownMenu();
    this.pushSelection();
    this._current_typeahead = new typeahead_popup.TypeaheadPopup(
        this.doc, x, y, width, placeholder, options,
        function (obj) {
        this._current_typeahead = undefined;
        this.popSelection();
        if (dismiss_callback)
            dismiss_callback(obj);
    }.bind(this));
    return this._current_typeahead;
};

Editor.prototype._refreshSaveStatus = log.wrap(function () {
    if (this._saver) {
        var save_status = this._saver.getSavedWhen();
        this._$save_status.children('span').first().text(save_status);
        if (!save_status) {
            this._$save_status.removeClass("label-success label-info")
                .addClass("label-default");
        }
        else {
            var kind = this._saver.getLastSaveKind();
            var to_add, tip;
            switch (kind) {
            case saver.AUTO:
                to_add = "label-info";
                tip = "The last save was an autosave.";
                break;
            case saver.MANUAL:
                to_add = "label-success";
                tip = "The last save was a manual save.";
                break;
            default:
                throw new Error("unexpected kind of save: " + kind);
            }
            this._$save_status.removeClass(
                "label-default label-info label-success").
                addClass(to_add);
            this._$save_status.tooltip({
                title: tip,
                container: 'body',
                placement: "auto top"
            });
        }

        var modified = this._saver.getModifiedWhen();
        if (modified !== false) {
            this._$modification_status.removeClass("label-success");
            this._$modification_status.addClass("label-warning");
            this._$modification_status.children("i").css("visibility", "");
        }
        else {
            this._$modification_status.removeClass("label-warning");
            this._$modification_status.addClass("label-success");
            this._$modification_status.children("i").css("visibility",
                                                         "hidden");
        }
    }
});

var state_to_str = {};
state_to_str[validator.INCOMPLETE] = "stopped";
state_to_str[validator.WORKING] = "working";
state_to_str[validator.INVALID] = "invalid";
state_to_str[validator.VALID] = "valid";

var state_to_progress_type = {};
state_to_progress_type[validator.INCOMPLETE] = "info";
state_to_progress_type[validator.WORKING] = "info";
state_to_progress_type[validator.INVALID] = "danger";
state_to_progress_type[validator.VALID] = "success";


Editor.prototype._onValidatorStateChange = function () {
    var working_state = this.validator.getWorkingState();
    var message = state_to_str[working_state.state];

    var percent = (working_state.part_done * 100) >> 0;
    if (working_state.state === validator.WORKING) {
        // Do not show changes less than 5%
        if (working_state.part_done - this._last_done_shown < 0.05)
            return;
    }
    else if (working_state.state === validator.VALID ||
             working_state.state === validator.INVALID) {
        if (!this._first_validation_complete) {
            this._first_validation_complete = true;
            this._setCondition("first-validation-complete", {editor: this});
        }
    }

    this._last_done_shown = working_state.part_done;
    this.$validation_progress.css("width", percent + "%");
    this.$validation_progress.removeClass(
        "progress-bar-info progress-bar-success progress-bar-danger");
    var type = state_to_progress_type[working_state.state];
    this.$validation_progress.addClass("progress-bar-" + type);
    this.$validation_message.text(message);
};

Editor.prototype._onValidatorError = function (ev) {
    this._validation_errors.push(ev);
    this._processValidationError(ev);
};

/**
 * This method refreshes the error messages and the error markers
 * associated with the errors that the editor already knows.
 *
 * @private
 */
Editor.prototype._refreshValidationErrors = function () {
    var errs = this.widget.getElementsByClassName('wed-validation-error');
    var el;
    while((el = errs[0]) !== undefined)
        el.parentNode.removeChild(el);
    this.$error_list.children("li").remove();
    for(var i = 0, err; (err = this._validation_errors[i]) !== undefined; ++i)
        this._processValidationError(err);
};


// This is a utility function for _processValidationError. If the mode
// is set to not display attributes or if a custom decorator is set to
// not display a specific attribute, then finding the GUI location of
// the attribute won't be possible. In such case, we want to fail
// nicely rather than crash to the ground.
function findInsertionPoint(editor, node, index) {
    try {
        return editor.fromDataLocation(node, index);
    }
    catch (ex) {
        if (ex instanceof guiroot.AttributeNotFound)
            return editor.fromDataLocation(node.ownerElement, 0);

        throw ex;
    }
}

Editor.prototype._processValidationError = function (ev) {
    var error = ev.error;
    var data_node = ev.node;
    var index = ev.index;

    var insert_at = findInsertionPoint(this, data_node, index);
    insert_at = this._normalizeCaretToEditableRange(insert_at);

    var link_id = util.newGenericID();
    var $marker =
            $(domutil.htmlToElements(
                "<span class='_phantom wed-validation-error'>&nbsp;</span>",
                insert_at.node.ownerDocument)[0]);

    // If we are not using the navigation panel, then we should always show
    // the error list.
    if (this._$navigation_panel.css("display") === "none")
        this.$error_list.parents('.panel-collapse').collapse('show');

    $marker.mousedown(log.wrap(function (ev) {
        this.$error_list.parents('.panel-collapse').collapse('show');
        var $link = this.$error_list.find("#" + link_id);
        var $scrollable = this.$error_list.parent('.panel-body');
        $scrollable.animate({
            scrollTop: $link.offset().top - $scrollable.offset().top +
                $scrollable[0].scrollTop
        });
        this.$widget.find('.wed-validation-error.selected').removeClass(
                                                               'selected');
        $(ev.currentTarget).addClass('selected');
        $link.siblings().removeClass('selected');
        $link.addClass('selected');

        // We move the caret ourselves and prevent further processing
        // of this event. Older versions of wed let the event trickle
        // up and be handled by the general caret movement code but
        // that would sometimes result in a caret being put in a bad
        // position.
        this.setGUICaret(insert_at);
        return false;
    }.bind(this)));
    var marker_id = $marker[0].id = util.newGenericID();
    var loc = wed_util.boundaryXY(insert_at);
    var scroller_pos = this._scroller.getBoundingClientRect();
    $marker[0].style.top = loc.top - scroller_pos.top +
        this._scroller.scrollTop + "px";
    $marker[0].style.left = loc.left - scroller_pos.left +
        this._scroller.scrollLeft + "px";
    this._$error_layer.append($marker);

    // Turn the expanded names back into qualified names.
    var names = error.getNames();
    for(var ix = 0; ix < names.length; ++ix) {
        names[ix] = this.resolver.unresolveName(
            names[ix].ns, names[ix].name,
            error instanceof validate.AttributeNameError ||
            error instanceof validate.AttributeValueError);
    }

    var item = domutil.htmlToElements(
        "<li><a href='#" + marker_id + "'>" +
            error.toStringWithNames(names) + "</li>",
                 insert_at.node.ownerDocument)[0];
    item.id = link_id;

    $(item.firstElementChild).click(log.wrap(function (ev) {
        this.$widget.find('.wed-validation-error.selected').removeClass(
                                                               'selected');
        $marker.addClass('selected');
        var $parent = $(ev.currentTarget).parent();
        $parent.siblings().removeClass('selected');
        $parent.addClass('selected');
    }.bind(this)));

    this.$error_list.append(item);
};


Editor.prototype._onResetErrors = function (ev) {
    if (ev.at !== 0)
        throw new Error("internal error: wed does not yet support " +
                        "resetting errors at an arbitrary location");

    this._validation_errors = [];
    this.$error_list.children("li").remove();
    this.$widget.find('.wed-validation-error').remove();
};

/**
 * Sets the list of items to show in the navigation list. This will
 * make the list appear if it was not displayed previously.
 *
 * @param {Node|jQuery|Array.<Node>} items The items to show.
 */
Editor.prototype.setNavigationList = function (items) {
    this._$navigation_list.empty();
    this._$navigation_list.append(items);

    // Show the navigation panel.
    this._$navigation_panel.css("display", "");
};

Editor.prototype.makeModal = function () {
    var ret = new modal.Modal();
    var $top = ret.getTopLevel();
    // Ensure that we don't lose the caret when a modal is displayed.
    $top.on("show.bs.modal.modal",
             function () { this.pushSelection(); }.bind(this));
    $top.on("hidden.bs.modal.modal",
            function () { this.popSelection(); }.bind(this));
    this.$widget.prepend($top);
    return ret;
};

Editor.prototype.increaseLabelVisibilityLevel = function () {
    if (this._current_label_level >= this.max_label_level)
        return;

    var pos = this._caretPositionOnScreen();
    this._current_label_level++;
    var labels = this.gui_root.getElementsByClassName(
        "_label_level_" + this._current_label_level);
    for(var i = 0, limit = labels.length; i < limit; i++)
        labels[i].classList.remove("_invisible");

    this._refreshValidationErrors();
    this._refreshFakeCaret();
    // Pos could be undefined if this function is called when wed
    // starts.
    if (!pos)
        return;

    var pos_after = this._caretPositionOnScreen();
    this.gui_root.scrollTop -= pos.top - pos_after.top;
    this.gui_root.scrollLeft -= pos.left - pos_after.left;
};

Editor.prototype.decreaseLabelVisiblityLevel = function () {
    if (!this._current_label_level)
        return;

    var pos = this._caretPositionOnScreen();
    var prev = this._current_label_level;
    this._current_label_level--;
    var labels = this.gui_root.getElementsByClassName("_label_level_" + prev);
    for(var i = 0, limit = labels.length; i < limit; i++)
        labels[i].classList.add("_invisible");

    this._refreshValidationErrors();
    this._refreshFakeCaret();

    // Pos could be undefined if this function is called when wed
    // starts.
    if (!pos)
        return;

    var pos_after = this._caretPositionOnScreen();
    this.gui_root.scrollTop -= pos.top - pos_after.top;
    this.gui_root.scrollLeft -= pos.left - pos_after.left;
};

Editor.prototype._closeAllTooltips = function () {
    var tts = this.doc.querySelectorAll("div.tooltip");
    var closed = false;
    for(var i = 0, tt; (tt = tts[i]); ++i) {
        var for_el = $.data(tt, "wed-tooltip-for");
        var data = $(for_el).data("bs.tooltip");
        if (data) {
            data.leave(data);
            closed = true;
        }
    }
    return closed;
};

});

//  LocalWords:  unclick saveSelection rethrown focusNode setGUICaret ns
//  LocalWords:  caretChangeEmitter caretchange toDataLocation RTL keyup
//  LocalWords:  compositionstart keypress keydown TextUndoGroup Yay
//  LocalWords:  getCaret endContainer startContainer uneditable prev
//  LocalWords:  CapsLock insertIntoText _getDOMSelectionRange prepend
//  LocalWords:  offscreen validthis jshint enterStartTag xmlns xml
//  LocalWords:  namespace mousedown mouseup mousemove compositionend
//  LocalWords:  compositionupdate revalidate tabindex hoc stylesheet
//  LocalWords:  SimpleEventEmitter minified css onbeforeunload Ctrl
//  LocalWords:  Ok contenteditable namespaces errorlist navlist li
//  LocalWords:  ul nav sb href jQuery DOM html mixins onerror gui
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
