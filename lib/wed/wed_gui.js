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
  var key_constants = require("./key-constants");
  var modal = require("./gui/modal");
  var typeahead_popup = require("./gui/typeahead_popup");
  var key = require("./key");
  var wed_util = require("./wed-util");
  var tooltip = require("./gui/tooltip").tooltip;
  require("bootstrap");
  var notify = require("./gui/notify").notify;

  var Editor = core.Editor;
  var getGUINodeIfExists = wed_util.getGUINodeIfExists;
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

    this._scroller.coerceHeight(height);

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

    if (this.validationController) {
      // We must refresh these because resizing the editor pane may
      // cause text to move up or down due to line wrap.
      this.validationController.refreshErrors();
    }
    this.caretManager.mark.refresh();
  });

  /**
   * Opens a documenation link.
   * @param {string} url The url to open.
   */
  EditorP.openDocumentationLink = function openDocumentationLink(url) {
    window.open(url);
  };

  /**
   * Returns the list of element transformations for the location
   * pointed to by the caret.
   *
   * @param {module:dloc~DLoc} tree_caret The location in the
   * document. This must be a data location, not a GUI location.
   * @param {string | Array.<string>} types The types of transformations to get.
   * @return {Array.<{tr: module:transformation~Transformation, name: string}>}
   * An array of objects having the fields ``tr`` which contain the actual
   * transformation and ``name`` which is the unresolved element name
   * for this transformation. It is exceptionally possible to have an
   * item of the list contain a {@link module:action~Action} for ``tr``
   * and ``undefined`` for ``name``.
   */
  EditorP.getElementTransformationsAt = function getElementTransformationsAt(
    tree_caret, types) {
    var mode = this.mode;
    var resolver = mode.getAbsoluteResolver();
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
            types, unresolved, tree_caret.node, tree_caret.offset);
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
    if (this.caretManager.getDataCaret() === undefined) {
      return false;
    } // XXX alert the user?

    var sel = this.caretManager.sel;
    if (sel.wellFormed) {
      var el = closestByClass(sel.anchor.node, "_real", this.gui_root);
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
    var caret = this.caretManager.getDataCaret();
    if (caret === undefined) {
      return false;
    } // XXX alert the user?

    var el = closestByClass(this.caretManager.anchor.node, "_real",
                            this.gui_root);
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

  EditorP._keydownHandler = log.wrap(function _keydownHandler(e) {
    var caret = this.caretManager.getNormalizedCaret();
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
        return terminate();
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
        this.caretManager.dumpCaretInfo();
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
        this.caretManager.focusInputField();
        console.log("document.activeElement after",
                    document.activeElement);
        console.log("document.querySelector(\":focus\") after",
                    document.querySelector(":focus"));
        return terminate();
        /* eslint-enable */
      }
    }

    var sel_focus = this.caretManager.caret;
    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
      var direction;
      if (key_constants.RIGHT_ARROW.matchesEvent(e)) {
        direction = "right";
      }
      else if (key_constants.LEFT_ARROW.matchesEvent(e)) {
        direction = "left";
      }
      else if (key_constants.DOWN_ARROW.matchesEvent(e)) {
        direction = "down";
      }
      else if (key_constants.UP_ARROW.matchesEvent(e)) {
        direction = "up";
      }

      if (direction) {
        this.caretManager.move(direction, e.shiftKey);
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

      if (this.editingMenuManager.contextMenuHandler(e) === false) {
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
      caret = this.caretManager.getDataCaret();

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
      return terminate();
    }
    else if (sel_focus.node.classList &&
             (sel_focus.node.classList.contains("_phantom") ||
              sel_focus.node.classList.contains("_phantom_wrap"))) {
      return terminate();
    }

    var text_undo;
    var parent;
    var offset;

    if (key_constants.SPACE.matchesEvent(e)) {
      caret = this.caretManager.getNormalizedCaret();
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
                              this.caretManager.getNormalizedCaret().offset, 1,
                              "");
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
          if (this._cutSelection()) {
            this.validationController.refreshErrors();
            return terminate();
          }

          // We need to handle the delete
          caret = this.caretManager.getDataCaret();
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
              this.caretManager.setCaret(caret, { textEdit: true });
            }
            else {
              this.caretManager.setCaret(parent, offset, { textEdit: true });
            }
            text_undo.recordCaretAfter();
          }
        }
      }
      this.validationController.refreshErrors();
      return terminate();
    }
    else if (key_constants.BACKSPACE.matchesEvent(e)) {
      if (attr_val) { // In attribute.
        if (attr_val.textContent === "") { // empty === noop
          return terminate();
        }

        this._spliceAttribute(attr_val,
                              this.caretManager.getNormalizedCaret().offset - 1,
                              1, "");
      }
      else {
        // Prevent backspacing over phantom stuff
        var prev = domutil.prevCaretPosition(sel_focus.toArray(),
                                             this.gui_root, true)[0];
        if (!prev.classList ||
            !(prev.classList.contains("_phantom") ||
              prev.classList.contains("_phantom_wrap"))) {
          // When a range is selected, we delete the whole range.
          if (this._cutSelection()) {
            this.validationController.refreshErrors();
            return terminate();
          }

          // We need to handle the backspace
          caret = this.caretManager.getDataCaret();

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
              this.caretManager.setCaret(caret.node, caret.offset - 1,
                                         { textEdit: true });
            }
            else {
              this.caretManager.setCaret(parent, offset, { textEdit: true });
            }
            text_undo.recordCaretAfter();
          }
        }
      }
      this.validationController.refreshErrors();
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
    if (this.caretManager.caret === undefined) {
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

    this._cutSelection();
    this._handleKeyInsertingText(e);
    return terminate();
  });

  EditorP._cutSelection = function _cutSelection() {
    var sel = this.caretManager.sel;
    if (sel && !sel.collapsed) {
      if (!sel.wellFormed) {
        return true;
      }

      var text_undo = this._initiateTextUndo();
      var pair = sel.asDataCarets();
      var cut_ret = this.data_updater.cut(pair[0], pair[1]);
      this.caretManager.setCaret(cut_ret[0], { textEdit: true });
      text_undo.recordCaretAfter();
      return true;
    }

    return false;
  };

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
        start_caret: this.caretManager.caret,
      };
      this._input_field.style.zIndex = 10;
      this.caretManager.mark.refresh();
    }
    else if (ev.type === "compositionupdate") {
      this._composition_data.data = ev.originalEvent.data;
    }
    else if (ev.type === "compositionend") {
      this._composing = false;
      this._input_field.style.zIndex = "";
      this._input_field.style.top = "";
      this._input_field.style.left = "";
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
    this.caretManager.focusInputField();
  });

  EditorP._mousemoveHandler = log.wrap(function _mousemoveHandler(e) {
    var element_at_mouse = this.doc.elementFromPoint(e.clientX, e.clientY);
    if (!this.gui_root.contains(element_at_mouse)) {
      return;
    } // Not in GUI tree.

    function editable(el) {
      var cl = el.classList;
      return cl.contains("_real") ||
        (cl.contains("_attribute_value") &&
         this.modeTree.getAttributeHandling(el) === "edit");
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
      boundary = this.caretManager.makeCaret(element_at_mouse, offset);
    }

    this.caretManager.setRange(this.caretManager.anchor, boundary);
  });

  EditorP._mousedownHandler = log.wrap(function _mousedownHandler(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!this._scroller.isPointInside(ev.pageX, ev.pageY)) {
      return false;
    }

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary) {
      return true;
    }

    this.$gui_root.one("mouseup", this._mouseupHandler.bind(this));

    this._errorLayer.unselectAll();
    this.$error_list.find(".selected").removeClass("selected");

    var root = this.gui_root;
    var target = ev.target;
    var placeholder = closestByClass(target, "_placeholder", root);
    var label = closestByClass(target, "_label", root);
    var caretManager = this.caretManager;
    switch (ev.which) {
    case 1:
      // Don't track selections in gui elements, except if they are
      // inside an attribute value.
      if (!closest(target, "._gui, ._phantom", root) ||
          closestByClass(target, "_attribute_value", root)) {
        this.$gui_root.on("mousemove.wed", this._mousemoveHandler.bind(this));
      }

      // If the caret is changing due to a click on a placeholder, then put it
      // inside the placeholder.
      if (placeholder) {
        caretManager.setCaret(placeholder, 0);
      }
      else if (label) {
        // If the caret is changing due to a click on a label, then normalize it
        // to a valid position.
        caretManager.setCaretToLabelPosition(target, label, boundary);
      }
      else {
        caretManager.setCaret(boundary);
      }

      if (ev.target.classList.contains("wed-validation-error")) {
        return true;
      }

      break;
    case 3:
      var range = this.caretManager.range;
      if (!(range && !range.collapsed)) {
        // If the caret is changing due to a click on a placeholder, then put it
        // inside the placeholder.
        if (placeholder) {
          caretManager.setCaret(placeholder, 0);
        }
        else if (label) {
          // If the caret is changing due to a click on a label, then normalize
          // it to a valid position.
          caretManager.setCaretToLabelPosition(target, label, boundary);
        }
        else {
          caretManager.setCaret(boundary);
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
    if (!this._scroller.isPointInside(ev.pageX, ev.pageY)) {
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
    var caretManager = this.caretManager;
    switch (ev.which) {
    case 3:
      // If the caret is changing due to a click on a placeholder,
      // then put it inside the placeholder.
      if (placeholder) {
        caretManager.setCaret(target, 0);
      }

      if (label) {
        caretManager.setCaretToLabelPosition(target, label, boundary);
        $(target).trigger("wed-context-menu", [ev]);
      }
      else {
        // If the editor is just gaining focus with *this* click,
        // then this.caretManager.caret will not be set. It also means the
        // range is collapsed.
        if (!caretManager.caret) {
          caretManager.setCaret(boundary);
        }

        if (closest(target, "*[data-wed--custom-context-menu]", root)) {
          $(target).trigger("wed-context-menu", [ev]);
        }
        else {
          this.editingMenuManager.contextMenuHandler(ev);
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
          if (self._destroyed) {
            return undefined;
          }

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
    this.editingMenuManager.dismiss();
    this.caretManager.pushSelection();
    this._current_typeahead = new typeahead_popup.TypeaheadPopup(
      this.doc, x, y, width, placeholder, options,
      function done(obj) {
        this._current_typeahead = undefined;
        this.caretManager.popSelection();
        if (dismiss_callback) {
          dismiss_callback(obj);
        }
      }.bind(this));
    return this._current_typeahead;
  };

  EditorP._refreshSaveStatus = log.wrap(function _refreshSaveStatus() {
    if (this.saver) {
      var save_status = this.saver.getSavedWhen();
      this._$save_status.children("span").first().text(save_status);
      if (!save_status) {
        this._$save_status.removeClass("label-success label-info")
          .addClass("label-default");
      }
      else {
        var kind = this.saver.getLastSaveKind();
        var to_add;
        var tip;
        switch (kind) {
        case saver.SaveKind.AUTO:
          to_add = "label-info";
          tip = "The last save was an autosave.";
          break;
        case saver.SaveKind.MANUAL:
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

      var modified = this.saver.getModifiedWhen();
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

  EditorP._onValidatorStateChange = function _onValidatorStateChange(
    working_state) {
    var state = working_state.state;
    if (state === validator.VALID || state === validator.INVALID) {
      if (!this._firstValidationComplete) {
        this._firstValidationComplete = true;
        this.firstValidationCompleteResolve(this);
      }
    }
  };

  EditorP._onPossibleDueToWildcardChange =
    function _onPossibleDueToWildcardChange(node) {
      //
      // This function is designed to execute fairly quickly. **IT IS IMPORTANT
      // NOT TO BURDEN THIS FUNCTION.** It will be called for every element and
      // attribute in the data tree and thus making this function slower will
      // have a significant impact on validation speed and the speed of wed
      // generally.
      //
      var gui_node = getGUINodeIfExists(this, node);

      // This may happen if we are dealing with an attribute node.
      if (gui_node && gui_node.nodeType === Node.TEXT_NODE) {
        gui_node = closestByClass(gui_node, "_attribute", this.gui_root);
      }

      if (gui_node) {
        this.decorator.setReadOnly(gui_node,
                                   this.validator.getNodeProperty(
                                     node, "PossibleDueToWildcard"));
      }

      // If the GUI node does not exist yet, then the decorator will take care
      // of adding or removing _readonly when decorating the node.
    };

  /**
   * Expand the error panel if there is no navigation.
   */
  EditorP.expandErrorPanelWhenNoNavigation =
    function expandErrorPanelWhenNoNavigation() {
      if (this._$navigation_panel[0].style.display === "none") {
        this.$error_list.parents(".panel-collapse").collapse("show");
      }
    };

  EditorP._errorItemHandler = log.wrap(function _errorItemHandler(ev) {
    var marker = document.querySelector(ev.target.attributes.href.value);
    this._errorLayer.select(marker);
    var $parent = $(ev.target.parentNode);
    $parent.siblings().removeClass("selected");
    $parent.addClass("selected");
  });

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
      this.caretManager.pushSelection();
    }.bind(this));
    $top.on("hidden.bs.modal.modal", function hidden() {
      this.caretManager.popSelection();
    }.bind(this));
    this.$widget.prepend($top);
    return ret;
  };

  EditorP.increaseLabelVisibilityLevel =
    function increaseLabelVisibilityLevel() {
      if (this._current_label_level >= this.max_label_level) {
        return;
      }

      this._current_label_level++;
      var labels = this.gui_root.getElementsByClassName(
        "_label_level_" + this._current_label_level);
      for (var i = 0, limit = labels.length; i < limit; i++) {
        labels[i].classList.remove("_invisible");
      }

      // We cannot just refresh the errors because some errors may appear or
      // disappear due to the visibility change.
      this.validationController.recreateErrors();
      this.caretManager.mark.refresh();
    };

  EditorP.decreaseLabelVisiblityLevel = function decreaseLabelVisiblityLevel() {
    if (!this._current_label_level) {
      return;
    }

    var prev = this._current_label_level;
    this._current_label_level--;
    var labels = this.gui_root.getElementsByClassName("_label_level_" + prev);
    for (var i = 0, limit = labels.length; i < limit; i++) {
      labels[i].classList.add("_invisible");
    }

    // We cannot just refresh the errors because some errors may appear or
    // disappear due to the visibility change.
    this.validationController.recreateErrors();
    this.caretManager.mark.refresh();
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

  /**
   * Registers elements that are outside wed's editing pane but should
   * be considered to be part of the editor. These would typically be
   * menus or toolbars that a larger application that uses wed for
   * editing adds around the editing pane.
   *
   * @param {Node|jQuery|Array.<Node>} elements The elements to
   * register.
   */
  EditorP.excludeFromBlur = function excludeFromBlur(elements) {
    this._$excluded_from_blur.add(elements);
  };

  /**
   * Finds the location of the character closest to the ``x, y``
   * coordinates. Very often this will be the character whose bounding
   * client rect encloses the coordinates. However, if no such character
   * exists the algorithm will return the closest character. If multiple
   * characters are at the same distance, then the first one found will
   * be returned.
   *
   * @private
   * @param {number} x The x coordinate in client coordinates.
   * @param {number} y The y coordinate in client coordinates.
   * @returns {module:dloc~DLoc|undefined} The location of the boundary
   * character. The value return is ``undefined`` if the coordinates are
   * outside the client or if the element in which the click occurred is
   * not inside the editor pane (a descendant of ``this.gui_root``).
   */
  EditorP._findLocationAt = function _findLocationAt(x, y) {
    var element_at_mouse = this.doc.elementFromPoint(x, y);
    // This could happen if x, y is outside our screen.
    if (!element_at_mouse) {
      return undefined;
    }

    // The element_at_mouse is not in the editing pane.
    if (!this.gui_root.contains(element_at_mouse)) {
      return undefined;
    }

    return this._findLocationInElementAt(element_at_mouse, x, y);
  };


  EditorP._findLocationInElementAt = function _findLocationInElementAt(node, x,
                                                                       y,
                                                                       text_ok) {
    if (text_ok !== false) {
      text_ok = true;
    }

    var range = this.doc.createRange();

    var min;

    //
    // This function works only in cases where a space that is
    // effectively rendered as a line break on the screen has a height
    // and width of zero. (Logically this makes sense, there is no
    // part of the screen which really belongs to the space.)
    //
    function checkRange(checkNode, start) {
      var rects;
      if (checkNode.nodeType === Node.TEXT_NODE) {
        range.setStart(checkNode, start);
        range.setEnd(checkNode, start + 1);
        rects = range.getClientRects();
      }
      else {
        rects = checkNode.childNodes[start].getClientRects();
      }

      for (var rect_ix = 0; rect_ix < rects.length; ++rect_ix) {
        var rect = rects[rect_ix];
        // Not a contender...
        if (rect.height === 0 || rect.width === 0) {
          continue;
        }

        var dist = util.distsFromRect(x, y, rect.left, rect.top,
                                      rect.right, rect.bottom);
        if (!min || min.dist.y > dist.y ||
            (min.dist.y === dist.y && min.dist.x > dist.x)) {
          min = {
            dist: dist,
            node: checkNode,
            start: start,
          };

          // Returning true means the search can end.
          return (dist.y === 0 && dist.x === 0);
        }
      }

      return false;
    }

    var child = node.firstChild;
    var child_ix = 0;
    /* eslint-disable no-restricted-syntax, no-labels */
    main_loop:
    while (child) {
      if (text_ok && child.nodeType === Node.TEXT_NODE) {
        for (var i = 0; i < child.length; ++i) {
          if (checkRange(child, i)) {
            // Can't get any better than this.
            break main_loop;
          }
        }
      }
      else if (checkRange(node, child_ix)) {
          // Can't get any better than this.
        break;
      }
      child = child.nextSibling;
      child_ix++;
    }
    /* eslint-enable */

    if (!min) {
      return this.caretManager.makeCaret(node, 0);
    }

    return this.caretManager.makeCaret(min.node, min.start);
  };

  EditorP._pointToCharBoundary = function _pointToCharBoundary(x, y) {
    // This obviously won't work for top to bottom scripts.
    // Probably does not work with RTL scripts either.
    var boundary = this._findLocationAt(x, y);
    if (boundary) {
      var node = boundary.node;
      var offset = boundary.offset;
      var node_type = node.nodeType;

      if (((node_type === Node.ELEMENT_NODE) &&
           (offset < node.childNodes.length)) ||
          ((node_type === Node.TEXT_NODE) && (offset < node.length))) {
        // Adjust the value we return so that the location returned is
        // the one closest to the x, y coordinates.

        var range = this.doc.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        var rect = range.getBoundingClientRect();
        switch (node_type) {
        case Node.TEXT_NODE:
          // We use newPosition to adjust the position so that the caret ends up
          // in a location that makes sense from an editing standpoint.
          var right = this.caretManager.newPosition(boundary, "right");
          var left = this.caretManager.newPosition(boundary.make(node,
                                                                 offset + 1),
                                                   "left");
          if (right && !left) {
            boundary = right;
          }
          else if (left && !right) {
            boundary = left;
          }
          else if (right && left) {
            boundary = (Math.abs(wed_util.boundaryXY(right).left - x) >=
                        Math.abs(wed_util.boundaryXY(left).left - x) ?
                        left : right);
          }
          break;
        case Node.ELEMENT_NODE:
          // We don't use newPosition here because we want to skip over the
          // *whole* element.
          var before;
          var pointed_node = node.childNodes[offset];
          if (pointed_node.nodeType === Node.ELEMENT_NODE) {
            var closestPos = this._findLocationInElementAt(pointed_node,
                                                           x, y);
            var limit = (closestPos.node.nodeType === Node.ELEMENT_NODE) ?
                  closestPos.node.childNodes.length - 1 : -1;
            switch (closestPos.offset) {
            case 0:
              before = true;
              break;
            case limit:
              before = false;
              break;
            default:
              break;
            }
          }

          if (before === undefined) {
            before = Math.abs(rect.left - x) < Math.abs(rect.right - x);
          }

          if (!before) {
            boundary = boundary.make(node, offset + 1);
          }

          break;
        default:
          throw new Error("unexpected node type: " + node_type);
        }
      }
    }
    return boundary;
  };

  /**
   * @private
   * @param {Object} ev The CaretChange event.
   */
  EditorP._caretChange = log.wrap(function _caretChange(ev) {
    var options = ev && ev.options ? ev.options : {};
    var textEdit = options.textEdit;
    var focus = options.focus;

    var caret = ev.caret;
    if (!caret) {
      return;
    }

    // We don't want to do this on regaining focus.
    if (!focus) {
      this.editingMenuManager.setupCompletionMenu();
    }

    // Caret movement terminates a text undo, unless the caret is moved by a
    // text edit.
    if (!textEdit) {
      this._terminateTextUndo();
    }

    // The class owns_caret can be on more than one element. The classic case is
    // if the caret is at an element label.
    var el;
    /* eslint-disable no-cond-assign */
    while ((el = this._caret_owners[0]) !== undefined) {
      el.classList.remove("_owns_caret");
    }
    while ((el = this._clicked_labels[0]) !== undefined) {
      el.classList.remove("_label_clicked");
    }
    while ((el = this._withCaret[0]) !== undefined) {
      el.classList.remove("_with_caret");
    }
    /* eslint-enable */

    var old_caret = ev.prevCaret;
    if (old_caret) {
      var old_tp = closest(old_caret.node, "._placeholder._transient",
                           old_caret.root);
      if (old_tp && caret.root.contains(old_tp)) {
        this._gui_updater.removeNode(old_tp);
      }
    }

    var node = (caret.node.nodeType === Node.ELEMENT_NODE) ?
          caret.node : caret.node.parentNode;
    var root = caret.root;

    // This caret is no longer in the gui tree. It is probably an intermediary
    // state so don't do anything with it.
    if (!this.gui_root.contains(node)) {
      return;
    }

    var real = closestByClass(node, "_real", root);
    if (real) {
      real.classList.add("_owns_caret");
    }

    var manager = ev.manager;
    var gui = closestByClass(node, "_gui", root);
    // Make sure that the caret is in view.
    if (gui) {
      if (!manager.anchor ||
          closestByClass(manager.anchor.node, "_gui", root) === gui) {
        var children = domutil.childrenByClass(gui.parentNode, "_gui");
        for (var i = 0; i < children.length; ++i) {
          children[i].classList.add("_label_clicked");
        }

        gui.classList.add("_with_caret");
      }
    }
    else {
      node.classList.add("_owns_caret");
    }

    if (!focus) {
      manager.mark.scrollIntoView();
    }

    // We need to refresh the mark here because the modifications we made above
    // to the CSS may have caused GUI items to appear or disappear and may have
    // mucked up the caret mark.
    this.caretManager.mark.refresh();

    var steps = [];
    while (node !== this.gui_root) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("unexpected node type: " + node.nodeType);
      }

      if (!node.classList.contains("_placeholder") &&
          !closestByClass(node, "_phantom", root)) {
        steps.unshift("<span class='_gui _label'><span>&nbsp;" +
                      util.getOriginalName(node) + "&nbsp;</span></span>");
      }
      node = node.parentNode;
    }
    this._wed_location_bar.innerHTML = steps.length ? steps.join("/") :
      "<span>&nbsp;</span>";
  });
});

//  LocalWords:  unclick saveSelection rethrown focusNode setGUICaret ns
//  LocalWords:  caretChangeEmitter caretchange toDataLocation RTL keyup
//  LocalWords:  compositionstart keypress keydown TextUndoGroup Yay
//  LocalWords:  getCaret endContainer startContainer uneditable prev
//  LocalWords:  CapsLock insertIntoText prepend
//  LocalWords:  offscreen validthis jshint enterStartTag xmlns xml
//  LocalWords:  namespace mousedown mouseup mousemove compositionend
//  LocalWords:  compositionupdate revalidate tabindex hoc stylesheet
//  LocalWords:  SimpleEventEmitter minified css Ctrl
//  LocalWords:  Ok contenteditable namespaces errorlist navlist li
//  LocalWords:  ul nav sb href jQuery DOM html mixins onerror gui
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
