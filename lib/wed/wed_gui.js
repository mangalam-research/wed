/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function f(require) {
  "use strict";

  var core = require("./wed_core");
  var $ = require("jquery");
  var log = require("./log");
  var saver = require("./saver");
  var validator = require("./validator");
  var util = require("./util");
  var domutil = require("./domutil");
  var salve = require("salve");
  var key_constants = require("./key_constants");
  var modal = require("./gui/modal");
  var action_context_menu = require("./gui/action_context_menu");
  var completion_menu = require("./gui/completion_menu");
  var typeahead_popup = require("./gui/typeahead_popup");
  var key = require("./key");
  var dloc = require("./dloc");
  var icon = require("./gui/icon");
  var wed_util = require("./wed_util");
  var tooltip = require("./gui/tooltip").tooltip;
  var guiroot = require("./guiroot");
  var transformation = require("./transformation");
  require("bootstrap");
  var notify = require("./gui/notify").notify;

  var Editor = core.Editor;
  var isAttr = domutil.isAttr;
  var makeDLoc = dloc.makeDLoc;
  var getAttrValueNode = wed_util.getAttrValueNode;
  var closestByClass = domutil.closestByClass;
  var closest = domutil.closest;
  var indexOf = domutil.indexOf;

  var EditorP = Editor.prototype;

  EditorP.resize = function resize() {
    this._resizeHandler();
  };

  EditorP._resizeHandler = log.wrap(function _resizeHandler() {
    var height_after = 0;

    function addHeight() {
      /* jshint validthis:true */
      height_after += this.scrollHeight;
    }

    var $examine = this.$widget;
    while ($examine.length > 0) {
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
           this.my_window.pageYOffset) -
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
    var i;
    for (i = 0; i < headings.length; ++i) {
      var heading = headings[i];
      var $parent = $(heading.parentNode);
      hheight += $parent.outerHeight(true) - $parent.innerHeight();
      hheight += $(heading).outerHeight(true);
    }
    var max_panel_height = pheight - hheight;
    var panel;
    for (i = 0; i < panels.length; ++i) {
      panel = panels[i];
      panel.style.maxHeight = max_panel_height +
        $(domutil.childByClass(panel, "panel-heading")).outerHeight(true) + "px";
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
  EditorP.openDocumentationLink = function openDocumentationLink(url) {
    window.open(url);
  };

  /**
   * Makes an HTML link to open the documentation of an element.
   *
   * @param {string} doc_url The URL to the documentation to open.
   * @returns {Node} A ``&lt;a>`` element that links to the
   * documentation.
   */
  EditorP.makeDocumentationLink = function makeDocumentationLink(doc_url) {
    var icon_html = icon.makeHTML("documentation");
    var a = domutil.htmlToElements(
      "<a tabindex='0' href='#'>" + icon_html + " " +
        "Element's documentation.</a>", this.doc)[0];
    $(a).click(function click() {
      this.openDocumentationLink(doc_url);
    }.bind(this));
    return a;
  };

  /**
   * This is the default menu handler called when the user right-clicks
   * in the contents of a document or uses the keyboard shortcut.
   *
   * The menu handler which is invoked when a user right-clicks on an
   * element start or end label is defined by the decorator that the
   * mode is using.
   *
   * @private
   */
  EditorP._contextMenuHandler = function _contextMenuHandler(e) {
    if (!this._sel_focus) {
      return false;
    }

    var range = this.getSelectionRange();

    var collapsed = !(range && !range.collapsed);
    if (!collapsed && !domutil.isWellFormedRange(range)) {
      return false;
    }

    var node = this._sel_focus.node;
    var offset = this._sel_focus.offset;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      var parent = node.parentNode;
      offset = indexOf(parent.childNodes, node);
      node = parent;
    }

    // Move out of any placeholder
    var ph = closestByClass(node, "_placeholder", this.gui_root);
    if (ph) {
      offset = indexOf(ph.parentNode.childNodes, ph);
      node = ph.parentNode;
    }

    var real = closestByClass(node, "_real", this.gui_root);
    var readonly = real && real.classList.contains("_readonly");
    var method = closestByClass(node, "_attribute_value", this.gui_root) ?
          this._getMenuItemsForAttribute :
          this._getMenuItemsForElement;

    var menu_items = method.call(this, node, offset, !collapsed);

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0) {
      return true;
    }

    var pos = this.computeContextMenuPosition(e);
    this.displayContextMenu(action_context_menu.ContextMenu,
                            pos.left, pos.top, menu_items, readonly);
    return false;
  };

  EditorP._getMenuItemsForAttribute = function _getMenuItemsForAttribute() {
    return [];
  };

  EditorP._getMenuItemsForElement = function _getMenuItemsForElement(node,
                                                                     offset,
                                                                     wrap) {
    // If we are in a phantom, we want to get to the first parent
    // which is not phantom.
    if (node.classList &&
        node.classList.contains("_phantom")) {
      var last_phantom_child;
      while (node && node.classList.contains("_phantom")) {
        last_phantom_child = node;
        node = node.parentNode;
      }
      if (node && this.gui_root.contains(node)) {
        // The node exists and is in our GUI tree. If the offset
        // is outside editable contents, move it into editable
        // contents.
        var nodes = this.mode.nodesAroundEditableContents(node);
        var contents = node.childNodes;
        offset = indexOf(contents, last_phantom_child);
        var before_ix = nodes[0] && indexOf(contents, nodes[0]);
        var after_ix = nodes[1] && indexOf(contents, nodes[1]);
        if (before_ix !== null && offset <= before_ix) {
          offset = before_ix + 1;
        }
        if (after_ix !== null && offset >= after_ix) {
          offset = after_ix - 1;
        }
      }
      else {
        node = null;
      }
    }

    if (!node) {
      return [];
    }

    var menu_items = [];

    var me = this;
    function pushItem(data, tr) {
      var li = me._makeMenuItemForAction(tr, data);
      menu_items.push({ action: tr, item: li, data: data });
    }

    var tr_ix;
    var tr;
    var trs;
    if (!node.classList.contains("_phantom") &&
        // Should not be part of a gui element.
        !node.parentNode.classList.contains("_gui")) {
      // We want the data node, not the gui node.
      var tree_caret = this.toDataLocation(node, offset);
      var data_node = tree_caret.node;

      var doc_url = this.mode.documentationLinkFor(data_node.tagName);

      if (doc_url) {
        var a = this.makeDocumentationLink(doc_url);
        var li = node.ownerDocument.createElement("li");
        li.appendChild(a);
        menu_items.push({ action: null, item: li, data: null });
      }

      trs = this.getElementTransformationsAt(tree_caret, wrap);
      for (tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
        tr = trs[tr_ix];
        // If tr.name is not undefined we have a real transformation.
        // Otherwise, it is an action.
        pushItem((tr.name !== undefined) ? { name: tr.name } : undefined,
                 tr.tr);
      }

      if (data_node !== this.data_root.firstChild) {
        trs = this.mode.getContextualActions(
          ["unwrap", "delete-parent"], data_node.tagName, data_node, 0);
        for (tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
          pushItem({ node: data_node, name: data_node.tagName }, trs[tr_ix]);
        }
      }
    }

    var $sep = $(node).parents().addBack().siblings("[data-wed--separator-for]")
          .first();
    var transformation_node = $sep.siblings().filter(function filter() {
      // Node.contains() will return true if this === node, whereas
      // jQuery.has() only looks at descendants, so this can't be
      // replaced with .has().
      return this.contains(node);
    })[0];
    var sep_for = $sep[0] && $sep[0].getAttribute("data-wed--separator-for");
    if (sep_for !== undefined) {
      trs = this.mode.getContextualActions(
        ["merge-with-next", "merge-with-previous", "append", "prepend"], sep_for,
        $.data(transformation_node, "wed_mirror_node"), 0);
      trs.forEach(function each(x) {
        pushItem({ node: transformation_node, name: sep_for }, x);
      });
    }

    return menu_items;
  };


  EditorP._makeMenuItemForAction = function _makeMenuItemForAction(action,
                                                                   data) {
    var icon = action.getIcon(); // eslint-disable-line no-shadow
    var li = domutil.htmlToElements(
      "<li><a tabindex='0' href='#'>" + (icon ? icon + " " : "") +
        "</a></li>", this.doc)[0];

    if (action.kind !== undefined) {
      li.setAttribute("data-kind", action.kind);
    }

    var a = li.firstElementChild;
    // We do it this way so that to avoid an HTML interpretation of
    // action.getDescriptionFor()`s return value.
    var text = this.doc.createTextNode(action.getDescriptionFor(data));
    a.appendChild(text);
    a.normalize();
    $(a).click(data, action.bound_terminal_handler);
    return li;
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
  EditorP.computeContextMenuPosition = function computeContextMenuPosition(
    e, bottom) {
    bottom = !!bottom;
    e = e || {};
    var pos;
    var rect;
    if (e.type === "mousedown" || e.type === "mouseup" || e.type === "click" ||
        e.type === "contextmenu") {
      pos = { left: e.clientX, top: e.clientY };
    }
    // The next conditions happen only if the user is using the keyboard
    else if (this._fake_caret.parentNode) {
      var rel_pos = this._positionFromGUIRoot(this._fake_caret);
      this.scrollIntoView(rel_pos.left, rel_pos.top,
                          rel_pos.left + this._fake_caret.offsetWidth,
                          rel_pos.top + this._fake_caret.offsetHeight);
      rect = this._fake_caret.getBoundingClientRect();
      pos = {
        top: bottom ? rect.bottom :
          (rect.top + (this._$fake_caret.height() / 2)),
        left: rect.left,
      };
    }
    else {
      var gui = closestByClass(this._sel_focus.node, "_gui", this.gui_root);
      if (gui) {
        rect = gui.getBoundingClientRect();
        // Middle of the region.
        var $gui = $(gui);
        pos = {
          top: bottom ? rect.bottom : (rect.top + ($gui.height() / 2)),
          left: rect.left + ($gui.width() / 2),
        };
      }
      else {
        // No position.
        throw new Error("no position for displaying the menu");
      }
    }

    return pos;
  };

  /**
   * Returns the list of element transformations for the location
   * pointed to by the caret.
   *
   * @param {module:dloc~DLoc} tree_caret The location in the
   * document. This must be a data location, not a GUI location.
   * @param {boolean} [wrap=false] Whether the transformations return should be
   * those for wrapping
   * @return {Array.<{tr: module:transformation~Transformation, name: string}>}
   * An array of objects having the fields ``tr`` which contain the actual
   * transformation and ``name`` which is the unresolved element name
   * for this transformation. It is exceptionally possible to have an
   * item of the list contain a {@link module:action~Action} for ``tr``
   * and ``undefined`` for ``name``.
   */
  EditorP.getElementTransformationsAt = function getElementTransformationsAt(
    tree_caret, wrap) {
    wrap = !!wrap;

    var mode = this.mode;
    var resolver = this.resolver;
    var ret = [];
    var me = this;
    this.validator.possibleAt(tree_caret).forEach(function each(ev) {
      if (ev.params[0] !== "enterStartTag") {
        return;
      }

      if (ev.params[1].simple()) {
        var names = ev.params[1].toArray();
        for (var name_ix = 0; name_ix < names.length; ++name_ix) {
          var name = names[name_ix];
          var unresolved = resolver.unresolveName(name.ns, name.name);

          var trs = mode.getContextualActions(
            wrap ? "wrap" : "insert", unresolved, tree_caret.node,
            tree_caret.offset);
          if (trs === undefined) {
            return;
          }

          for (var tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
            ret.push({ tr: trs[tr_ix], name: unresolved });
          }
        }
      }
      else {
        // We push an action rather than a transformation.
        ret.push({ tr: me.complex_pattern_action, name: undefined });
      }
    });

    return ret;
  };

  EditorP._cutHandler = function _cutHandler(e) {
    if (this.getDataCaret() === undefined) {
      return false;
    } // XXX alert the user?

    var range = this._getDOMSelectionRange();
    if (domutil.isWellFormedRange(range)) {
      var el = closestByClass(this._sel_anchor.node, "_real", this.gui_root);
      // We do not operate on elements that are readonly.
      if (!el || el.classList.contains("_readonly")) {
        return false;
      }

      // The only thing we need to pass is the event that triggered the
      // cut.
      this.fireTransformation(this.cut_tr, { e: e });
      return true;
    }

    this.straddling_modal.modal();
    return false;
  };

  EditorP._pasteHandler = function _pasteHandler(e) {
    var caret = this.getDataCaret();
    if (caret === undefined) {
      return false;
    } // XXX alert the user?

    var el = closestByClass(this._sel_anchor.node, "_real", this.gui_root);
    // We do not operate on elements that are readonly.
    if (!el || el.classList.contains("_readonly")) {
      return false;
    }

    // IE puts the clipboardData as a object on the window.
    var cd = e.originalEvent.clipboardData || this.my_window.clipboardData;

    var text = cd.getData("text");
    if (!text) {
      return false;
    }

    // This could result in an empty string.
    text = this._normalizeEnteredText(text);
    if (!text) {
      return false;
    }

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
        this._paste_modal.modal(function done() {
          if (this._paste_modal.getClickedAsText() === "Yes") {
            data = this.doc.createElement("div");
            data.textContent = text;
            // At this point data is a single top level
            // fake <div> element which contains the
            // contents we actually want to paste.
            this.fireTransformation(
              this.paste_tr,
              { node: caret.node, to_paste: data, e: e });
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
                            { node: caret.node, to_paste: data, e: e });
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
  EditorP.scrollIntoView = function scrollIntoView(left, top, right, bottom) {
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
    /* eslint-disable no-mixed-operators */
    left = left - vleft + gui_pos.left;
    right = right - vleft + gui_pos.left;
    top = top - vtop + gui_pos.top;
    bottom = bottom - vtop + gui_pos.top;
    /* eslint-enable */

    var sheight = this.doc.body.scrollHeight;
    var swidth = this.doc.body.scrollWidth;

    var by_y = 0;
    if (top < 0 || bottom > sheight) {
      by_y = top < 0 ? top : bottom;
    }

    var by_x = 0;
    if (left < 0 || right > swidth) {
      by_x = left < 0 ? left : right;
    }

    this.my_window.scrollBy(by_x, by_y);
  };

  EditorP._keydownHandler = log.wrap(function _keydownHandler(e) {
    var caret = this.getGUICaret();
    // Don't call it on undefined caret.
    if (caret) {
      this.$gui_root.trigger("wed-input-trigger-keydown", [e]);
    }
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
      return;
    }

    this.$gui_root.trigger("wed-global-keydown", [e]);
  });

  EditorP.pushGlobalKeydownHandler = function pushGlobalKeydownHandler(handler) {
    this._global_keydown_handlers.push(handler);
  };

  EditorP.popGlobalKeydownHandler = function popGlobalKeydownHandler(handler) {
    var popped = this._global_keydown_handlers.pop();
    if (popped !== handler) {
      throw new Error("did not pop the expected handler");
    }
  };

  EditorP._globalKeydownHandler = log.wrap(function _globalKeydownHandler(
    wed_event, e) {
    var caret; // damn hoisting
    var me = this;

    // These are things like the user hitting Ctrl, Alt, Shift, or
    // CapsLock, etc. Return immediately.
    if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0) {
      return true;
    }

    function terminate() {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }

    var handlers = this._global_keydown_handlers;
    for (var i = 0; i < handlers.length; ++i) {
      var ret = handlers[i](wed_event, e);
      if (ret === false) {
        terminate();
      }
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
      if (e.which === 114) {
        this.dumpUndo();
        return terminate();
      }
      // F4
      if (e.which === 115) {
        /* eslint-disable no-console */
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
        /* eslint-enable */
      }
    }

    var sel_focus = this._sel_focus;
    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
      var rr;
      if (key_constants.RIGHT_ARROW.matchesEvent(e)) {
        if (e.shiftKey) {
          // Extend the selection
          this._sel_focus = this.positionRight(this._sel_focus);
          rr = this._sel_anchor.makeRange(this._sel_focus);
          this.setSelectionRange(rr.range, rr.reversed);
        }
        else {
          this.moveCaretRight();
        }
        return terminate();
      }
      else if (key_constants.LEFT_ARROW.matchesEvent(e)) {
        if (e.shiftKey) {
          // Extend the selection
          this._sel_focus = this.positionLeft(this._sel_focus);
          rr = this._sel_anchor.makeRange(this._sel_focus);
          this.setSelectionRange(rr.range, rr.reversed);
        }
        else {
          this.moveCaretLeft();
        }
        return terminate();
      }
      return true;
    }
    else if (key_constants.ESCAPE.matchesEvent(e)) {
      if (this._closeAllTooltips()) {
        return terminate();
      }
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
      notify(this._development_mode ? "Development mode on." :
             "Development mode off.");
      if (this._development_mode) {
        log.showPopup();
      }
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
          if (sel_focus_node.nodeType === Node.TEXT_NODE) {
            sel_focus_node = sel_focus_node.parentNode;
          }
          $(sel_focus_node).trigger("wed-context-menu", [e]);
          return terminate();
        }
      }

      if (this._contextMenuHandler(e) === false) {
        return terminate();
      }
    }

    if (sel_focus === undefined) {
      return true;
    }

    var placeholder = closestByClass(sel_focus.node, "_placeholder",
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

        if (placeholder.parentNode.classList.contains("_attribute_value")) {
          text_possible = true;
        }
        else {
          // Maybe throwing an exception could stop this loop
          // early but that would have to be tested.
          this.validator.possibleAt(caret).forEach(function each(ev) {
            if (ev.params[0] === "text") {
              text_possible = true;
            }
          });
        }

        if (!text_possible) {
          return terminate();
        }
      }

      // Swallow these events when they happen in a placeholder.
      if (key_constants.BACKSPACE.matchesEvent(e) ||
          key_constants.DELETE.matchesEvent(e)) {
        return terminate();
      }
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

      trs[0].execute({ node: data_node, name: data_node.tagName });
    }
    else if (sel_focus.node.classList &&
             (sel_focus.node.classList.contains("_phantom") ||
              sel_focus.node.classList.contains("_phantom_wrap"))) {
      return terminate();
    }

    var text_undo;
    function handleRange() {
      var range = me.getSelectionRange();
      if (range && !range.collapsed) {
        if (!domutil.isWellFormedRange(range)) {
          return true;
        }

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

    var parent;
    var offset;

    if (key_constants.SPACE.matchesEvent(e)) {
      caret = this.getGUICaret();
      if (!caret) {
        return terminate();
      }

      if (attr_val || !closestByClass(caret.node, "_phantom", caret.root)) {
        this._handleKeyInsertingText(e);
      }

      return terminate();
    }
    else if (key_constants.DELETE.matchesEvent(e)) {
      if (attr_val) { // In attribute.
        if (attr_val.textContent === "") { // empty === noop
          return terminate();
        }

        this._spliceAttribute(attr_val,
                              this.getGUICaret().offset, 1, "");
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
          if (handleRange()) {
            return terminate();
          }

          // We need to handle the delete
          caret = this.getDataCaret();
          // If the container is not a text node, we may still
          // be just AT a text node from which we can
          // delete. Handle this.
          if (caret.node.nodeType !== Node.TEXT_NODE) {
            caret = caret.make(caret.node.childNodes[caret.offset], 0);
          }

          if (caret.node.nodeType === Node.TEXT_NODE) {
            parent = caret.node.parentNode;
            offset = indexOf(parent.childNodes, caret.node);

            text_undo = this._initiateTextUndo();
            this.data_updater.deleteText(caret, 1);
            // Don't set the caret inside a node that has been
            // deleted.
            if (caret.node.parentNode) {
              this.setDataCaret(caret, true);
            }
            else {
              this.setDataCaret(parent, offset, true);
            }
            text_undo.recordCaretAfter();
          }
        }
      }
      this._refreshValidationErrors();
      return terminate();
    }
    else if (key_constants.BACKSPACE.matchesEvent(e)) {
      if (attr_val) { // In attribute.
        if (attr_val.textContent === "") { // empty === noop
          return terminate();
        }

        this._spliceAttribute(attr_val,
                              this.getGUICaret().offset - 1, 1, "");
      }
      else {
        // Prevent backspacing over phantom stuff
        var prev = domutil.prevCaretPosition(sel_focus.toArray(),
                                             this.gui_root, true)[0];
        if (!prev.classList ||
            !(prev.classList.contains("_phantom") ||
              prev.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (handleRange()) {
            return terminate();
          }

          // We need to handle the backspace
          caret = this.getDataCaret();

          // If the container is not a text node, we may still
          // be just behind a text node from which we can
          // delete. Handle this.
          if (caret.node.nodeType !== Node.TEXT_NODE) {
            caret = caret.make(
              caret.node.childNodes[caret.offset - 1],
              caret.node.childNodes[caret.offset - 1].length);
          }

          if (caret.node.nodeType === Node.TEXT_NODE) {
            parent = caret.node.parentNode;
            offset = indexOf(parent.childNodes, caret.node);

            // At start of text, nothing to delete.
            if (caret.offset === 0) {
              return terminate();
            }

            text_undo = this._initiateTextUndo();
            this.data_updater.deleteText(caret.node, caret.offset - 1,
                                         1);
            // Don't set the caret inside a node that has been
            // deleted.
            if (caret.node.parentNode) {
              this.setDataCaret(caret.node, caret.offset - 1, true);
            }
            else {
              this.setDataCaret(parent, offset, true);
            }
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

  EditorP._keypressHandler = log.wrap(function _keypressHandler(e) {
    // IE is the odd browser that allows ESCAPE to show up as a keypress so
    // we have to prevent it from going any further.
    if (ESCAPE_KEYPRESS.matchesEvent(e)) {
      return true;
    }

    this.$gui_root.trigger("wed-input-trigger-keypress", [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
      return true;
    }

    this.$gui_root.trigger("wed-global-keypress", [e]);
    return undefined;
  });

  /**
   * Simulates typing text in the editor.
   *
   * @param {module:key~Key|Array.<module:key~Key>|string} text The text to type
   * in. An array of keys, a string or a single key.
   */
  EditorP.type = function type(text) {
    if (text instanceof key.Key) {
      text = [text];
    }

    for (var ix = 0; ix < text.length; ++ix) {
      var k = text[ix];
      if (typeof (k) === "string") {
        k = (k === " ") ? key_constants.SPACE : key.makeKey(k);
      }

      var event = new $.Event("keydown");
      k.setEventToMatch(event);
      this._$input_field.trigger(event);
    }
  };

  EditorP._globalKeypressHandler = log.wrap(function _globalKeypressHandler(
    wed_event, e) {
    if (this._sel_focus === undefined) {
      return true;
    }

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
    if (!e.which) {
      return true;
    }

    // Backspace, which for some reason gets here on Firefox...
    if (e.which === 8) {
      return terminate();
    }

    // On Firefox the modifier keys will generate a keypress
    // event, etc. Not so on Chrome. Yay for inconsistencies!
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return true;
    }

    var range = this.getSelectionRange();

    // When a range is selected, we would replace the range with the
    // text that the user entered.
    if (range !== undefined && !range.collapsed) {
      // Except that we do not want to do that unless it is
      // well-formed.
      if (!domutil.isWellFormedRange(range)) {
        return terminate();
      }

      this._initiateTextUndo();
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

  EditorP._handleKeyInsertingText = function _handleKeyInsertingText(e) {
    var text = String.fromCharCode(e.which);

    if (text === "") { // Nothing needed
      return false;
    }

    this._insertText(text);
    e.preventDefault();
    e.stopPropagation();
    return undefined;
  };

  EditorP._compositionHandler = log.wrap(function _compositionHandler(ev) {
    if (ev.type === "compositionstart") {
      this._composing = true;
      this._composition_data = {
        data: ev.originalEvent.data,
        start_caret: this._sel_focus,
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
    else {
      throw new Error("unexpected event type: " + ev.type);
    }
  });

  EditorP._inputHandler = log.wrap(function _inputHandler() {
    if (this._composing) {
      return;
    }
    if (this._$input_field.val() === "") {
      return;
    }
    this._insertText(this._$input_field.val());
    this._$input_field.val("");
    this._focusInputField();
  });

  EditorP._mousemoveHandler = log.wrap(function _mousemoveHandler(e) {
    var element_at_mouse = this.elementAtPointUnderLayers(e.clientX,
                                                          e.clientY);
    if (!this.gui_root.contains(element_at_mouse)) {
      return;
    } // Not in GUI tree.

    var edit_attributes = this.attributes === "edit";
    function editable(el) {
      return el.classList.contains("_real") ||
        (edit_attributes &&
         el.classList.contains("_attribute_value"));
    }

    var boundary;
    if (editable(element_at_mouse)) {
      boundary = this._pointToCharBoundary(e.clientX, e.clientY);
      if (!boundary) {
        return;
      }
    }
    else {
      var child;
      while (!editable(element_at_mouse)) {
        child = element_at_mouse;
        element_at_mouse = child.parentNode;
        if (!this.gui_root.contains(element_at_mouse)) {
          return;
        } // The mouse was in a bunch of non-editable elements.
      }
      var offset = indexOf(element_at_mouse.childNodes, child);
      var range = this.doc.createRange();
      range.setStart(element_at_mouse, offset);
      range.setEnd(element_at_mouse, offset + 1);
      var rect = range.getBoundingClientRect();
      if (Math.abs(rect.left - e.clientX) >= Math.abs(rect.right - e.clientX)) {
        offset++;
      }
      boundary = makeDLoc(this.gui_root, element_at_mouse, offset);
    }

    this._sel_focus = boundary;

    // This check reduces selection fiddling by an order of magnitude
    // when just straightforwardly selecting one character.
    if (!this._prev_sel_focus ||
        this._sel_focus.offset !== this._prev_sel_focus.offset ||
        this._sel_focus.node !== this._prev_sel_focus.node) {
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
  EditorP.elementAtPointUnderLayers = function elementAtPointUnderLayers(x, y) {
    this._hideLayers();
    var element = this.doc.elementFromPoint(x, y);
    this._popLayerState();
    return element;
  };


  /**
   * Push the current display state of the layers and hide them. Use
   * {@link module:wed~Editor#_popLayerState _popLayerState} restore
   * their state.
   */
  EditorP._hideLayers = function _hideLayers() {
    var state = Object.create(null);
    var names = this._layer_names;
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
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
  EditorP._popLayerState = function _popLayerState() {
    var state = this._layer_state_stack.pop();
    var names = this._layer_names;
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
      var layer = this[name];
      layer.style.display = state[name];
    }
  };


  EditorP._caretLayerMouseHandler = log.wrap(function _caretLayerMouseHandler(
    e) {
    if (e.type === "mousedown") {
      this._$caret_layer.on("mousemove",
                            this._caretLayerMouseHandler.bind(this));
      this._$caret_layer.one("mouseup",
                             this._caretLayerMouseHandler.bind(this));
    }
    var element_at_mouse = this.elementAtPointUnderLayers(e.clientX, e.clientY);
    var new_e = $.Event(e.type, e); // eslint-disable-line new-cap
    new_e.target = element_at_mouse;
    new_e.toElement = element_at_mouse;
    $(element_at_mouse).trigger(new_e);
    if (e.type === "mouseup") {
      this._$caret_layer.off("mousemove");
    }
    e.preventDefault();
    e.stopPropagation();
  });

  EditorP._moveToNormalizedLabelPosition =
    function _moveToNormalizedLabelPosition(target, label, boundary) {
      // Note that in the code that follows, the choice between testing
      // against ``target`` or against ``boundary.node`` is not arbitrary.
      var attr = closestByClass(target, "_attribute", label);
      if (attr) {
        if (closestByClass(boundary.node, "_attribute_value", label)) {
          this.setGUICaret(boundary);
        }
        else {
          this.setGUICaret(getAttrValueNode(attr.getElementsByClassName(
            "_attribute_value")[0]), 0);
        }
      }
      else {
        // Find the element name and put it there.
        this.setGUICaret(label.getElementsByClassName("_element_name")[0], 0);
      }
    };

  EditorP._mousedownHandler = log.wrap(function _mousedownHandler(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!domutil.pointInContents(this._scroller, ev.pageX, ev.pageY)) {
      return false;
    }

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary) {
      return true;
    }

    this.$gui_root.one("mouseup", this._mouseupHandler.bind(this));

    this.$widget.find(".wed-validation-error.selected").removeClass("selected");
    this.$error_list.find(".selected").removeClass("selected");

    var root = this.gui_root;
    var target = ev.target;
    var placeholder = closestByClass(target, "_placeholder", root);
    var label = closestByClass(target, "_label", root);
    switch (ev.which) {
    case 1:
      // Don't track selections in gui elements, except if they are
      // inside an attribute value.
      if (!closest(target, "._gui, ._phantom", root) ||
          closestByClass(target, "_attribute_value", root)) {
        this.$gui_root.on("mousemove.wed", this._mousemoveHandler.bind(this));
      }

      // If the caret is changing due to a click on a
      // placeholder, then put it inside the placeholder.
      if (placeholder) {
        this.setGUICaret(placeholder, 0);
      }
      else if (label) {
        // If the caret is changing due to a click on a
        // label, then normalize it to a valid position.
        this._moveToNormalizedLabelPosition(target, label, boundary);
      }
      else {
        this.setGUICaret(boundary);
      }

      // _sel_focus and _sel_anchor were set by setGUICaret.
      this._prev_sel_focus = undefined;
      if (ev.target.classList.contains("wed-validation-error")) {
        return true;
      }

      break;
    case 3:
      var range = this.getSelectionRange();
      if (!(range && !range.collapsed)) {
        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if (placeholder) {
          this.setGUICaret(placeholder, 0);
        }
        else if (label) {
          // If the caret is changing due to a click on a
          // label, then normalize it to a valid position.
          this._moveToNormalizedLabelPosition(target, label, boundary);
        }
        else {
          this.setGUICaret(boundary);
        }
      }
      break;
    default:
      break;
    }
    return false;
  });

  // In previous versions of wed all mouse button processing was done in
  // _mousedownHandler. However, this caused problems when processing context
  // menus events. On IE in particular the mouseup that would occur when a
  // context menu is brought up would happen on the newly brought up menu and
  // would cause focus problems.
  EditorP._mouseupHandler = log.wrap(function _mouseupHandler(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!domutil.pointInContents(this._scroller, ev.pageX, ev.pageY)) {
      return false;
    }

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary) {
      return true;
    }

    // Normalize.
    if (ev.type === "contextmenu") {
      ev.which = 3;
    }

    var root = this.gui_root;
    var target = ev.target;
    var placeholder = closestByClass(target, "_placeholder", root);
    var label = closestByClass(target, "_label", root);
    switch (ev.which) {
    case 3:
      // If the caret is changing due to a click on a placeholder,
      // then put it inside the placeholder.
      if (placeholder) {
        this.setGUICaret(target, 0);
      }

      if (label) {
        this._moveToNormalizedLabelPosition(target, label, boundary);
        $(target).trigger("wed-context-menu", [ev]);
      }
      else {
        // If the editor is just gaining focus with *this* click,
        // then this._sel_focus will not be set. It also means the
        // range is collapsed.
        if (!this._sel_focus) {
          this.setGUICaret(boundary);
        }

        if (closest(target, "*[data-wed-custom-context-menu]", root)) {
          $(target).trigger("wed-context-menu", [ev]);
        }
        else {
          this._contextMenuHandler(ev);
        }
      }
      break;
    default:
      break;
    }
    this.$gui_root.off("mousemove");
    ev.preventDefault();
    return false;
  });

  EditorP._mouseoverHandler = log.wrap(function _mouseoverHandler(ev) {
    var root = this.gui_root;
    var label = closestByClass(ev.target, "_label", root);
    if (label) {
      // Get tooltips from the current mode
      var self = this;
      var real = closestByClass(label, "_real", root);
      var orig_name = util.getOriginalName(real);
      var options = {
        title: function title() {
          // The check is here so that we can turn tooltips on and off
          // dynamically.
          if (!self.preferences.get("tooltips")) {
            return undefined;
          }
          return self.mode.shortDescriptionFor(orig_name);
        },
        container: "body",
        delay: { show: 1000 },
        placement: "auto top",
        trigger: "hover",
      };
      tooltip($(label), options);
      var tt = $.data(label, "bs.tooltip");
      tt.enter(tt);
    }
  });

  EditorP._mouseoutHandler = log.wrap(function _mouseoutHandler(ev) {
    var root = this.gui_root;
    var label = closestByClass(ev.target, "_label", root);
    if (label) {
      $(label).tooltip("destroy");
      // See _mouseoutHandler. We return false here for symmetry.
      return false;
    }

    return undefined;
  });

  EditorP._setupCompletionMenu = function _setupCompletionMenu() {
    this._dismissDropdownMenu();
    var range = this.getSelectionRange();

    // We must not have an actual range in effect
    if (!range || !range.collapsed) {
      return;
    }

    var caret = this.getGUICaret();
    var node = caret.node;
    var attr_val = closestByClass(node, "_attribute_value",
                                  this.gui_root);
    if (attr_val) {
      if (domutil.isNotDisplayed(attr_val, this.gui_root)) {
        return;
      }

      var doc = node.ownerDocument;
      var data_caret = this.getDataCaret();
      var data_node = data_caret.node;
      // We complete only at the end of an attribute value.
      if (data_caret.offset !== data_node.value.length) {
        return;
      }
      var possible = [];
      this.validator.possibleAt(data_caret.node, 0)
        .forEach(function each(ev) {
          if (ev.params[0] !== "attributeValue") {
            return;
          }

          if (ev.params[0] === "attributeValue") {
            var text = ev.params[1];
            if (text instanceof RegExp) {
              return;
            }

            possible.push(text);
          }
        });

      if (!possible.length) {
        return;
      }

      var narrowed = [];
      for (var i = 0; i < possible.length; ++i) {
        var possibility = possible[i];
        if (possibility.lastIndexOf(data_node.value, 0) === 0) {
          narrowed.push(possibility);
        }
      }

      // The current value in the attribute is not one that can be
      // completed.
      if (!narrowed.length ||
          (narrowed.length === 1 && narrowed[0] === data_node.value)) {
        return;
      }

      var pos = this.computeContextMenuPosition(undefined, true);

      this._current_dropdown =
        new completion_menu.CompletionMenu(
          this, doc, pos.left, pos.top, data_node.value, possible,
          function done() {
            this._current_dropdown = undefined;
          }.bind(this));
    }
  };

  /**
   * @param {Element} element The element for which we want a position.
   * @returns {{left: number, top: number}} The coordinates of the
   * element relative to the GUI root.
   */
  EditorP._positionFromGUIRoot = function _positionFromGUIRoot(element) {
    // _fake_caret is a special case because this function may be
    // called when the caret layer is invisible. So we can't rely on
    // offset. Fortunately, the CSS values are what we want, so...
    var pos;
    if (element === this._fake_caret) {
      pos = {
        left: +element.style.left.replace("px", ""),
        top: +element.style.top.replace("px", ""),
      };

      if (isNaN(pos.left) || isNaN(pos.top)) {
        throw new Error("NAN for left or top");
      }

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

  EditorP._dismissDropdownMenu = function _dismissDropdownMenu() {
    // We may be called when there is no menu active.
    if (this._current_dropdown) {
      this._current_dropdown.dismiss();
    }
  };

  /**
   * @param items Must be a sequence of <li> elements that will form the
   * menu. The actual data type can be anything that jQuery() accepts.
   */
  EditorP.displayContextMenu = function displayContextMenu(cm_class, x, y,
                                                           items, readonly) {
    // Eliminate duplicate items. We perform a check only in the
    // description of the action, and on ``data.name``.
    var seen = Object.create(null);
    items = items.filter(function test(item) {
      // "\0" not a legitimate value in descriptions.
      var actionKey = (item.action ? item.action.getDescription() : "") + "\0";
      if (item.data) {
        actionKey += item.data.name;
      }
      var keep = !seen[actionKey];
      seen[actionKey] = true;

      if (!keep || !readonly) {
        return keep;
      }

      // If we get here, then we need to filter out anything that
      // transforms the tree.
      return !(item.action instanceof transformation.Transformation);
    });

    this._dismissDropdownMenu();
    this.pushSelection();
    // eslint-disable-next-line new-cap
    this._current_dropdown = new cm_class(
      this.doc, x, y, items,
      function done() {
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
  EditorP.displayTypeaheadPopup = function displayTypeaheadPopup(
    x, y, width, placeholder, options, dismiss_callback) {
    this._dismissDropdownMenu();
    this.pushSelection();
    this._current_typeahead = new typeahead_popup.TypeaheadPopup(
      this.doc, x, y, width, placeholder, options,
      function done(obj) {
        this._current_typeahead = undefined;
        this.popSelection();
        if (dismiss_callback) {
          dismiss_callback(obj);
        }
      }.bind(this));
    return this._current_typeahead;
  };

  EditorP._refreshSaveStatus = log.wrap(function _refreshSaveStatus() {
    if (this._saver) {
      var save_status = this._saver.getSavedWhen();
      this._$save_status.children("span").first().text(save_status);
      if (!save_status) {
        this._$save_status.removeClass("label-success label-info")
          .addClass("label-default");
      }
      else {
        var kind = this._saver.getLastSaveKind();
        var to_add;
        var tip;
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
          "label-default label-info label-success")
          .addClass(to_add);
        this._$save_status.tooltip("destroy");
        this._$save_status.tooltip({
          title: tip,
          container: "body",
          placement: "auto top",
          trigger: "hover",
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
        this._$modification_status.children("i").css("visibility", "hidden");
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


  EditorP._onValidatorStateChange = function _onValidatorStateChange(
    working_state) {
    var state = working_state.state;
    var part_done = working_state.part_done;
    if (state === validator.WORKING) {
      // Do not show changes less than 5%
      if (part_done - this._last_done_shown < 0.05) {
        return;
      }
    }
    else if (state === validator.VALID || state === validator.INVALID) {
      // We're done so we might as well process the errors right
      // now.
      this._processValidationErrors();
      if (!this._first_validation_complete) {
        this._first_validation_complete = true;
        this._setCondition("first-validation-complete", { editor: this });
      }
    }

    this._last_done_shown = part_done;
    var percent = part_done * 100;
    var progress = this.validation_progress;
    progress.style.width = percent + "%";
    progress.classList.remove("progress-bar-info", "progress-bar-success",
                              "progress-bar-danger");
    progress.classList.add("progress-bar-" + state_to_progress_type[state]);
    this.validation_message.textContent = state_to_str[state];
  };

  EditorP._onValidatorError = function _onValidatorError(ev) {
    this._validation_errors.push(ev);
    // We "batch" validation errors to process multiple of them in one shot
    // rather than call _processValidationErrors each time.
    if (!this._process_validation_errors_timeout) {
      this._process_validation_errors_timeout = setTimeout(
        this._processValidationErrors.bind(this),
        this._process_validation_errors_delay);
    }
  };

  /**
   * This method refreshes the error messages and the error markers
   * associated with the errors that the editor already knows.
   *
   * @private
   */
  EditorP._refreshValidationErrors = function _refreshValidationErrors() {
    var errs = this.widget.getElementsByClassName("wed-validation-error");
    var el;
    // eslint-disable-next-line no-cond-assign
    while ((el = errs[0]) !== undefined) {
      el.parentNode.removeChild(el);
    }
    this.$error_list.children("li").remove();
    this._processed_validation_errors_up_to = -1;
    this._processValidationErrors();
  };


  function getGUINodeIfExists(editor, node) {
    try {
      return editor.fromDataLocation(node, 0).node;
    }
    catch (ex) {
      if (ex instanceof guiroot.AttributeNotFound) {
        return undefined;
      }

      throw ex;
    }
  }

  EditorP._onPossibleDueToWildcardChange =
    function _onPossibleDueToWildcardChange(node) {
      //
      // This function is designed to execute fairly quickly. **IT IS
      // IMPORTANT NOT TO BURDEN THIS FUNCTION.** It will be called for
      // every element and attribute in the data tree and thus making
      // this function slower will have a significant impact on
      // validation speed and the speed of wed generally.
      //
      var gui_node = getGUINodeIfExists(this, node);

      // This may happen if we are dealing with an attribute node.
      if (gui_node && gui_node.nodeType === Node.TEXT_NODE) {
        gui_node = closestByClass(gui_node, "_attribute", this.gui_root);
      }

      if (gui_node) {
        this.decorator.setReadOnly(gui_node, node.wed_possible_due_to_wildcard);
      }

      // If the GUI node does not exist yet, then the decorator will
      // take care of adding or removing _readonly when decorating the
      // node.
    };

  // This is a utility function for _processValidationError. If the mode
  // is set to not display attributes or if a custom decorator is set to
  // not display a specific attribute, then finding the GUI location of
  // the attribute won't be possible. In such case, we want to fail
  // nicely rather than crash to the ground.
  //
  // (NOTE: What we're talking about is not the label visibility level
  // being such that attributes are not *seen* but have DOM elements for
  // them in the GUI tree. We're talking about a situation in which the
  // mode's decorator does not create DOM elements for the attributes.)
  //
  function findInsertionPoint(editor, node, index) {
    try {
      return editor.fromDataLocation(node, index);
    }
    catch (ex) {
      if (ex instanceof guiroot.AttributeNotFound) {
        return editor.fromDataLocation(node.ownerElement, 0);
      }

      throw ex;
    }
  }


  EditorP._processValidationErrors = function _processValidationErrors() {
    // Clear the timeout... because this function may be called from
    // somewhere else than the timeout.
    if (this._process_validation_errors_timeout) {
      clearTimeout(this._process_validation_errors_timeout);
      this._process_validation_errors_timeout = undefined;
    }

    var ix = this._processed_validation_errors_up_to + 1;
    var errors = this._validation_errors;
    var max = errors.length;
    if (ix >= max) {
      return;
    } // Already done!

    // If we are not using the navigation panel, then we should
    // always show the error list.
    if (this._$navigation_panel.css("display") === "none") {
      this.$error_list.parents(".panel-collapse").collapse("show");
    }

    var items = [];
    while (ix < max) {
      items.push(this._processValidationError(errors[ix]));
      ix++;
    }
    this.$error_list.append(items);

    this._processed_validation_errors_up_to = ix - 1;
  };

  EditorP._processValidationError = function _processValidationError(ev) {
    var error = ev.error;
    var data_node = ev.node;
    var index = ev.index;

    var insert_at = findInsertionPoint(this, data_node, index);
    insert_at = this._normalizeCaretToEditableRange(insert_at);

    var invisible_attribute = false;
    if (isAttr(data_node)) {
      var node_to_test = insert_at.node;
      if (node_to_test.nodeType === Node.TEXT_NODE) {
        node_to_test = node_to_test.parentNode;
      }
      if (domutil.isNotDisplayed(node_to_test, insert_at.root)) {
        invisible_attribute = true;
      }
    }

    // Turn the names into qualified names.
    var converted_names = [];
    var patterns = error.getNames();
    for (var np_ix = 0; np_ix < patterns.length; ++np_ix) {
      var pattern = patterns[np_ix];
      var names = pattern.toArray();
      var converted_name = "";
      if (names !== null) {
        // Simple pattern, just translate all names one by one.
        var conv = [];
        for (var n_ix = 0; n_ix < names.length; ++n_ix) {
          var name = names[n_ix];
          conv.push(this.resolver.unresolveName(
            name.ns, name.name,
            error instanceof salve.AttributeNameError ||
              error instanceof salve.AttributeValueError));
        }
        converted_name = conv.join(" or ");
      }
      else {
        // We convert the complex pattern into something
        // reasonable.
        converted_name = util.convertPatternObj(pattern.toObject(),
                                                this.resolver);
      }
      converted_names.push(converted_name);
    }

    var item;
    var link_id = util.newGenericID();
    if (!invisible_attribute) {
      var marker = domutil.htmlToElements(
        "<span class='_phantom wed-validation-error'>&nbsp;</span>",
        insert_at.node.ownerDocument)[0];
      var $marker = $(marker);

      $marker.mousedown(log.wrap(function mousedown() {
        this.$error_list.parents(".panel-collapse").collapse("show");
        var $link = this.$error_list.find("#" + link_id);
        var $scrollable = this.$error_list.parent(".panel-body");
        $scrollable.animate({
          scrollTop: $link.offset().top - $scrollable.offset().top +
            $scrollable[0].scrollTop,
        });
        this.$widget.find(".wed-validation-error.selected")
          .removeClass("selected");
        $(ev.currentTarget).addClass("selected");
        $link.siblings().removeClass("selected");
        $link.addClass("selected");

        // We move the caret ourselves and prevent further
        // processing of this event. Older versions of wed let the
        // event trickle up and be handled by the general caret
        // movement code but that would sometimes result in a
        // caret being put in a bad position.
        this.setGUICaret(insert_at);
        return false;
      }.bind(this)));

      var marker_id = marker.id = util.newGenericID();
      var loc = wed_util.boundaryXY(insert_at);
      var scroller_pos = this._scroller.getBoundingClientRect();
      marker.style.top = loc.top - scroller_pos.top +
        this._scroller.scrollTop + "px";
      marker.style.left = loc.left - scroller_pos.left +
        this._scroller.scrollLeft + "px";
      this._$error_layer.append($marker);

      item = domutil.htmlToElements(
        "<li><a href='#" + marker_id + "'>" +
          error.toStringWithNames(converted_names) + "</a></li>",
        insert_at.node.ownerDocument)[0];

      $(item.firstElementChild).click(this._errorItemHandler_bound);
    }
    else {
      item = domutil.htmlToElements(
        "<li>" + error.toStringWithNames(converted_names) + "</li>",
        insert_at.node.ownerDocument)[0];
      item.title = "This error belongs to an attribute " +
        "which is not currently displayed.";
    }

    item.id = link_id;
    return item;
  };


  EditorP._errorItemHandler = log.wrap(function _errorItemHandler(ev) {
    this.$widget.find(".wed-validation-error.selected").removeClass(
      "selected");
    var marker = document.querySelector(ev.target.attributes.href.value);
    marker.classList.add("selected");
    var $parent = $(ev.target.parentNode);
    $parent.siblings().removeClass("selected");
    $parent.addClass("selected");
  });


  EditorP._onResetErrors = function _onResetErrors(ev) {
    if (ev.at !== 0) {
      throw new Error("internal error: wed does not yet support " +
                      "resetting errors at an arbitrary location");
    }

    this._validation_errors = [];
    this.$error_list.children("li").remove();
    this.$widget.find(".wed-validation-error").remove();
  };

  /**
   * Sets the list of items to show in the navigation list. This will
   * make the list appear if it was not displayed previously.
   *
   * @param {Node|jQuery|Array.<Node>} items The items to show.
   */
  EditorP.setNavigationList = function setNavigationList(items) {
    this._$navigation_list.empty();
    this._$navigation_list.append(items);

    // Show the navigation panel.
    this._$navigation_panel.css("display", "");
  };

  EditorP.makeModal = function makeModal(options) {
    var ret = new modal.Modal(options);
    var $top = ret.getTopLevel();
    // Ensure that we don't lose the caret when a modal is displayed.
    $top.on("show.bs.modal.modal", function show() {
      this.pushSelection();
    }.bind(this));
    $top.on("hidden.bs.modal.modal", function hidden() {
      this.popSelection();
    }.bind(this));
    this.$widget.prepend($top);
    return ret;
  };

  EditorP.increaseLabelVisibilityLevel =
    function increaseLabelVisibilityLevel() {
      if (this._current_label_level >= this.max_label_level) {
        return;
      }

      var pos = this._caretPositionOnScreen();
      this._current_label_level++;
      var labels = this.gui_root.getElementsByClassName(
        "_label_level_" + this._current_label_level);
      for (var i = 0, limit = labels.length; i < limit; i++) {
        labels[i].classList.remove("_invisible");
      }

      this._refreshValidationErrors();
      this._refreshFakeCaret();
      // Pos could be undefined if this function is called when wed
      // starts.
      if (!pos) {
        return;
      }

      var pos_after = this._caretPositionOnScreen();
      this.gui_root.scrollTop -= pos.top - pos_after.top;
      this.gui_root.scrollLeft -= pos.left - pos_after.left;
    };

  EditorP.decreaseLabelVisiblityLevel = function decreaseLabelVisiblityLevel() {
    if (!this._current_label_level) {
      return;
    }

    var pos = this._caretPositionOnScreen();
    var prev = this._current_label_level;
    this._current_label_level--;
    var labels = this.gui_root.getElementsByClassName("_label_level_" + prev);
    for (var i = 0, limit = labels.length; i < limit; i++) {
      labels[i].classList.add("_invisible");
    }

    this._refreshValidationErrors();
    this._refreshFakeCaret();

    // Pos could be undefined if this function is called when wed
    // starts.
    if (!pos) {
      return;
    }

    var pos_after = this._caretPositionOnScreen();
    this.gui_root.scrollTop -= pos.top - pos_after.top;
    this.gui_root.scrollLeft -= pos.left - pos_after.left;
  };

  EditorP._closeAllTooltips = function _closeAllTooltips() {
    var tts = this.doc.querySelectorAll("div.tooltip");
    var closed = false;
    for (var i = 0; i < tts.length; ++i) {
      var for_el = $.data(tts[i], "wed-tooltip-for");
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
//  LocalWords:  SimpleEventEmitter minified css Ctrl
//  LocalWords:  Ok contenteditable namespaces errorlist navlist li
//  LocalWords:  ul nav sb href jQuery DOM html mixins onerror gui
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
