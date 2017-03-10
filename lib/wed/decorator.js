 /**
  * @module decorator
  * @desc Basic decoration facilities.
  * @author Louis-Dominique Dubeau
  * @license MPL 2.0
  * @copyright Mangalam Research Center for Buddhist Languages
  */
define(/** @lends module:decorator */ function f(require, exports) {
  "use strict";

  var util = require("./util");
  var $ = require("jquery");
  var domutil = require("./domutil");
  var action_context_menu = require("./gui/action_context_menu");
  var dloc = require("./dloc");

  var indexOf = domutil.indexOf;
  var closestByClass = domutil.closestByClass;

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
  Decorator.prototype.addHandlers = function addHandlers() {
    this._domlistener.addHandler(
      "added-element",
      "._real, ._phantom, ._phantom_wrap",
      this.contentEditableHandler.bind(this));
  };

  /**
   * Start listening to changes to the DOM tree.
   */
  Decorator.prototype.startListening = function startListening() {
    this._domlistener.startListening();
  };

  /**
   * This function adds a separator between each child element of the
   * element passed as <code>el</code>. The function only considers
   * "._real" elements.
   *
   * @param {Node} el The element to decorate.
   * @param {string|Node} sep A separator.
   */
  Decorator.prototype.listDecorator = function listDecorator(el, sep) {
    // We expect to work with a homogeneous list. That is, all
    // children the same element.
    var name_map = {};
    var child = el.firstElementChild;
    while (child) {
      if (child.classList.contains("_real")) {
        name_map[util.getOriginalName(child)] = 1;
      }
      child = child.nextElementSibling;
    }

    var tags = Object.keys(name_map);
    if (tags.length > 1) {
      throw new Error("calling listDecorator on a non-homogeneous list.");
    }

    if (tags.length === 0) {
      return;
    } // Nothing to work with

    // First drop all children that are separators
    child = el.firstElementChild;
    while (child) {
      // Grab it before the node is removed.
      var next = child.nextElementSibling;
      if (child.hasAttribute("data-wed--separator-for")) {
        this._gui_updater.removeNode(child);
      }
      child = next;
    }

    var tag_name = tags[0];

    // If sep is a string, create an appropriate div.
    var sep_node;
    if (typeof sep === "string") {
      sep_node = el.ownerDocument.createElement("div");
      sep_node.appendChild(el.ownerDocument.createTextNode(sep));
    }
    else {
      sep_node = sep;
    }

    sep_node.classList.add("_text");
    sep_node.classList.add("_phantom");
    sep_node.setAttribute("data-wed--separator-for", tag_name);

    var first = true;
    child = el.firstElementChild;
    while (child) {
      if (child.classList.contains("_real")) {
        if (!first) {
          this._gui_updater.insertBefore(el, sep_node.cloneNode(true),
                                         child);
        }
        else {
          first = false;
        }
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
  Decorator.prototype.contentEditableHandler = function contentEditableHandler(
    root, parent, previous_sibling, next_sibling, element) {
    var edit_attributes = this._editor.attributes === "edit";
    function mod(el) {
      // All elements that may get a selection must be focusable to
      // work around bug:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
      el.setAttribute("tabindex", "-1");
      el.setAttribute("contenteditable",
                      el.classList.contains("_real") ||
                      (edit_attributes &&
                       el.classList.contains("_attribute_value")));
      var child = el.firstElementChild;
      while (child) {
        mod(child);
        child = child.nextElementSibling;
      }
    }
    mod(element);
  };

  function tryToSetDataCaret(editor, data_caret) {
    try {
      editor.setDataCaret(data_caret, true);
    }
    catch (e) {
      // Do nothing.
    }
  }

  /**
   * Add a start label at the start of an element and an end label at the
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
  Decorator.prototype.elementDecorator = function elementDecorator(
    root, el, level, pre_context_handler, post_context_handler) {
    if (level > this._editor.max_label_level) {
      throw new Error("level higher than the maximum set by the mode: " +
                      level);
    }

    // Save the caret because the decoration may mess up the GUI caret.
    var data_caret = this._editor.getDataCaret();
    if (data_caret &&
        !(data_caret.node instanceof this._editor.my_window.Attr &&
          data_caret.node.ownerElement === $.data(el, "wed_mirror_node"))) {
      data_caret = undefined;
    }

    var data_node = $.data(el, "wed_mirror_node");
    this.setReadOnly(el, this._editor.validator.getNodeProperty(
      data_node, "PossibleDueToWildcard"));

    var orig_name = util.getOriginalName(el);
    // _[name]_label is used locally to make the function idempotent.
    var cls = "_" + orig_name + "_label";

    // We must grab a list of nodes to remove before we start removing
    // them because an element that has a placeholder in it is going
    // to lose the placeholder while we are modifying it. This could
    // throw off the scan.
    var to_remove = domutil.childrenByClass(el, cls);
    var i;
    var remove;
    for (i = 0; i < to_remove.length; ++i) {
      remove = to_remove[i];
      el.removeChild(remove);
    }

    var attributes_html = [];
    if (this._editor.attributes === "show" ||
        this._editor.attributes === "edit") {
      // include the attributes
      var attributes = util.getOriginalAttributes(el);
      var names = Object.keys(attributes).sort();
      var name;
      for (i = 0; i < names.length; ++i) {
        name = names[i];
        attributes_html.push([
          "<span class=\"_phantom _attribute\">",
          "<span class=\"_phantom _attribute_name\">", name,
          "</span>=\"<span class=\"_phantom _attribute_value\">",
          domutil.textToHTML(attributes[name]),
          "</span>\"</span>",
        ].join(""));
      }
    }
    var attributes_str = (attributes_html.length ? " " : "") +
          attributes_html.join(" ");

    var doc = el.ownerDocument;
    cls += " _label_level_" + level;
    var pre = doc.createElement("span");
    pre.className = "_gui _phantom __start_label _start_wrapper " + cls +
      " _label";
    var pre_ph = doc.createElement("span");
    pre_ph.className = "_phantom";
    pre_ph.innerHTML = "&nbsp;<span class='_phantom _element_name'>" +
      orig_name + "</span>" + attributes_str + " >&nbsp;";
    pre.appendChild(pre_ph);
    this._gui_updater.insertNodeAt(el, 0, pre);

    var post = doc.createElement("span");
    post.className = "_gui _phantom __end_label _end_wrapper " + cls +
      " _label";
    var post_ph = doc.createElement("span");
    post_ph.className = "_phantom";
    post_ph.innerHTML = "&nbsp;&lt; <span class='_phantom _element_name'>" +
      orig_name + "</span>&nbsp;";
    post.appendChild(post_ph);
    this._gui_updater.insertBefore(el, post, null);

    // Setup a handler so that clicking one label highlights it and
    // the other label.
    var $pre = $(pre);
    var $post = $(post);
    if (pre_context_handler !== undefined) {
      $pre.on("wed-context-menu", pre_context_handler);
    }
    else {
      $pre.on("wed-context-menu", false);
    }

    if (post_context_handler !== undefined) {
      $post.on("wed-context-menu", post_context_handler);
    }
    else {
      $post.on("wed-context-menu", false);
    }

    if (data_caret) {
      tryToSetDataCaret(this._editor, data_caret);
    }
  };

  /**
   * Add or remove the CSS class _readonly on the basis of the 2nd argument.
   *
   * @param {Element} el The element to modify. Must be in the GUI tree.
   * @param {boolean} readonly Whether the element is readonly or not.
   */
  Decorator.prototype.setReadOnly = function setReadOnly(el, readonly) {
    var cl = el.classList;
    (readonly ? cl.add : cl.remove).call(cl, "_readonly");
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
  Decorator.prototype._contextMenuHandler = function _contextMenuHandler(
    at_start, wed_ev, ev) {
    var editor = this._editor;
    var node = wed_ev.target;
    var menu_items = [];
    var mode = editor.mode;
    var doc = node.ownerDocument;
    var li;
    var at_start_to_txt = {
      undefined: "",
      true: " before this element",
      false: " after this element",
    };
    var trs;
    var tr_ix;
    var tr;

    /* eslint-disable no-shadow */
    function pushItem(data, tr, at_start) {
      var li = editor._makeMenuItemForAction(tr, data);
      var a = li.getElementsByTagName("a")[0];
      var text = doc.createTextNode(at_start_to_txt[at_start]);
      a.appendChild(text);
      a.normalize();
      menu_items.push({ action: tr, item: li, data: data });
    }

    function processAttributeNameEvent(ev, element) {
      if (ev.params[1].simple()) {
        var names = ev.params[1].toArray();
        for (var name_ix = 0; name_ix < names.length; ++name_ix) {
          var name = names[name_ix];
          var unresolved = editor.resolver.unresolveName(name.ns,
                                                         name.name);

          if (editor.isAttrProtected(unresolved, element)) {
            return;
          }

          var trs = mode.getContextualActions(
            "add-attribute", unresolved, element);
          if (trs === undefined) {
            return;
          }

          for (var tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
            var tr = trs[tr_ix];
            pushItem({ name: unresolved, node: element }, tr);
          }
        }
      }
      else {
        pushItem(undefined, editor.complex_pattern_action);
      }
    }

    var real = closestByClass(node, "_real", editor.gui_root);
    var readonly = real && real.classList.contains("_readonly");

    var attr_val = closestByClass(node, "_attribute_value", editor.gui_root);
    var parent;
    var tree_caret;
    if (attr_val) {
      var data_node = editor.toDataNode(attr_val);
      var el = data_node.ownerElement;
      parent = el.parentNode;
      var offset = indexOf(parent.childNodes, el);
      tree_caret = dloc.makeDLoc(editor.data_root, parent, offset);
      editor.validator.possibleAt(tree_caret, true).forEach(
        function forEach(ev) {
          if (ev.params[0] !== "attributeName") {
            return;
          }
          var to_add_to = tree_caret.node.childNodes[tree_caret.offset];
          processAttributeNameEvent(ev, to_add_to);
        });

      var name = data_node.name;
      if (!editor.isAttrProtected(data_node)) {
        trs = mode.getContextualActions("delete-attribute", name,
                                        data_node);
        if (trs === undefined) {
          return false;
        }

        for (tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
          tr = trs[tr_ix];
          pushItem({ name: name, node: data_node }, tr);
        }
      }
    }
    else {
      // We want the first real parent.
      node = closestByClass(node, "_real", editor.gui_root);

      var top_node = (node.parentNode === editor.gui_root);

      // We first gather the transformations that pertain to the
      // node to which the label belongs.
      var orig = util.getOriginalName(node);

      var doc_url = this._editor.mode.documentationLinkFor(orig);
      if (doc_url) {
        li = doc.createElement("li");
        li.appendChild(this._editor.makeDocumentationLink(doc_url));
        menu_items.push({ action: null, item: li, data: null });
      }

      if (!top_node) {
        trs = mode.getContextualActions(
          ["unwrap", "delete-element"],
          orig, $.data(node, "wed_mirror_node"), 0);
        if (trs !== undefined) {
          trs.forEach(function forEach(tr) {
            pushItem({ node: node, name: orig }, tr, undefined);
          });
        }
      }

      // Then we check what could be done before the node (if the
      // user clicked on an start element label) or after the node
      // (if the user clicked on an end element label).
      parent = node.parentNode;
      var index = indexOf(parent.childNodes, node);

      // If we're on the end label, we want the events *after* the node.
      if (!at_start) {
        index++;
      }
      tree_caret = editor.toDataLocation(parent, index);

      if (at_start && editor.attributes === "edit") {
        editor.validator.possibleAt(tree_caret, true).forEach(
          function forEach(ev) {
            if (ev.params[0] !== "attributeName") {
              return;
            }
            var to_add_to = tree_caret.node.childNodes[tree_caret.offset];
            processAttributeNameEvent(ev, to_add_to);
          });
      }

      if (!top_node) {
        trs = editor.getElementTransformationsAt(tree_caret);
        for (tr_ix = 0; tr_ix < trs.length; ++tr_ix) {
          tr = trs[tr_ix];
          if (tr.name !== undefined) {
            // Regular case: we have a real transformation.
            pushItem({ name: tr.name, move_caret_to: tree_caret },
                     tr.tr, at_start);
          }
          else {
            // It is an action rather than a transformation.
            pushItem(undefined, tr.tr);
          }
        }
      }
    }

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0) {
      return true;
    }

    var pos = editor.computeContextMenuPosition(ev);
    editor.displayContextMenu(action_context_menu.ContextMenu,
                              pos.left, pos.top, menu_items, readonly);
    return false;
  };
});

//  LocalWords:  sep el focusable lt enterStartTag unclick nbsp li
//  LocalWords:  tabindex listDecorator contenteditable href jQuery
//  LocalWords:  gui domlistener domutil util validator jquery
//  LocalWords:  Mangalam MPL Dubeau
