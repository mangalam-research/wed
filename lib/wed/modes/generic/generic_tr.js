/**
 * @module modes/generic/generic_tr
 * @desc Transformation registry for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic_tr */function f(require,
                                                               exports) {
  "use strict";

  var salve = require("salve");
  var dloc = require("wed/dloc");
  var domutil = require("wed/domutil");
  var transformation = require("wed/transformation");

  var indexOf = domutil.indexOf;
  var insertElement = transformation.insertElement;
  var Transformation = transformation.Transformation;
  var unwrap = transformation.unwrap;

  function err_filter(err) {
    var err_msg = err.error.toString();
    return err_msg.lastIndexOf("tag required: ", 0) === 0;
  }

  /**
   * Perform the autoinsertion algorithm on an element.
   *
   * @param {Node} el The element that should be subject to the
   * autoinsertion algorithm.
   * @param {module:wed~Editor} editor The editor which owns the element.
   */
  function _autoinsert(el, editor) {
    while (true) { // eslint-disable-line no-constant-condition
      var errors = editor.validator.getErrorsFor(el);

      errors = errors.filter(err_filter);
      if (errors.length === 0) {
        break;
      }

      var ename = errors[0].error.getNames()[0];

      var locations = editor.validator.possibleWhere(
        el, new salve.Event("enterStartTag", ename.ns, ename.name));

      if (locations.length !== 1) {
        break;
      }

      var name = editor.resolver.unresolveName(ename.ns, ename.name);
      var actions = editor.mode.getContextualActions("insert", name,
                                                     el, locations[0]);

      // Don't auto insert if it happens that the operation would be
      // ambiguous (ie. if there is more than one way to insert the
      // element).
      if (actions.length !== 1) {
        break;
      }

      // Don't auto insert if the operation needs input from the
      // user.
      if (actions[0].needsInput) {
        break;
      }

      //
      // We move the caret ourselves rather than using
      // move_caret_to. In this context, it does not matter because
      // autoinsert is meant to be called by a transformation
      // anyway.
      //
      editor.setDataCaret(dloc.makeDLoc(dloc.getRoot(el), el, locations[0]));
      actions[0].execute({ name: name });
    }
  }

  /**
   * @param {module:wed~Editor} forEditor The editor for which to create
   * transformations.
   */
  function makeTagTr(forEditor) {
    var ret = {};
    ret.insert =
      new Transformation(
        forEditor,
        "insert",
        "Create new <name>",
        "",
        function handle(editor, data) {
          var caret = editor.getDataCaret();
          var absolute_resolver = editor.mode.getAbsoluteResolver();
          var ename = absolute_resolver.resolveName(data.name);
          var walker = editor.validator._getWalkerAt(
            caret.node, caret.offset, false);
          var unresolved = walker.unresolveName(ename.ns, ename.name);
          var el = insertElement(editor.data_updater, caret.node,
                                 caret.offset, ename.ns, data.name);
          if (!unresolved) {
            // The namespace used by the element has not been
            // defined yet. So we need to define it.
            var prefix = absolute_resolver.prefixFromURI(ename.ns);
            var name = (prefix === "") ? "xmlns" : "xmlns:" + prefix;
            var xmlns_uri = absolute_resolver.resolveName("xmlns:q").ns;
            editor.data_updater.setAttributeNS(
              el, xmlns_uri, name, ename.ns);
          }

          if (editor.mode.options.autoinsert) {
            _autoinsert(el, editor);

            // Set el to the deepest first child, so that the
            // caret is put in the right position.
            while (el) {
              var child = el.firstChild;
              if (!child) {
                break;
              }
              el = child;
            }
          }
          editor.setDataCaret(el, 0);
        });

    ret.unwrap =
      new Transformation(
        forEditor,
        "unwrap",
        "Unwrap the content of this element",
        undefined,
        function handle(editor, data) {
          var parent = data.node.parentNode;
          var index = indexOf(parent.childNodes, data.node);
          unwrap(editor.data_updater, data.node);
          editor.setDataCaret(parent, index);
        });

    ret.wrap =
      new Transformation(
        forEditor,
        "wrap",
        "Wrap in <name>",
        undefined,
        function handle(editor, data) {
          var range = editor.getSelectionRange();
          if (!range) {
            throw new Error("wrap transformation called with " +
                            "undefined range");
          }

          if (range.collapsed) {
            throw new Error("wrap transformation called with " +
                            "collapsed range");
          }
          var start_caret = editor.toDataLocation(range.startContainer,
                                                  range.startOffset);
          var end_caret = editor.toDataLocation(range.endContainer,
                                                range.endOffset);
          var ename =
                editor.mode.getAbsoluteResolver().resolveName(data.name);
          var el = transformation.wrapInElement(
            editor.data_updater, start_caret.node, start_caret.offset,
            end_caret.node, end_caret.offset, ename.ns, data.name);
          var parent = el.parentNode;
          editor.setDataCaret(
            parent, indexOf(parent.childNodes, el) + 1);
        });


    ret["wrap-content"] =
      new Transformation(
        forEditor,
        "wrap-content",
        "Wrap content in <name>",
        undefined,
        function handle(editor, data) {
          var toWrap = data.node;
          var ename = editor.mode.getAbsoluteResolver().resolveName(data.name);
          transformation.wrapInElement(editor.data_updater, toWrap, 0, toWrap,
                                       toWrap.childNodes.length,
                                       ename.ns, data.name);
        });

    ret["delete-element"] =
      new Transformation(
        forEditor,
        "delete-element",
        "Delete this element",
        undefined,
        function handle(editor, data) {
          var node = data.node;
          var parent = node.parentNode;
          var index = indexOf(parent.childNodes, node);
          var gui_loc = editor.fromDataLocation(node, 0);
          if (!gui_loc.node.classList.contains("_readonly")) {
            editor.data_updater.removeNode(node);
            editor.setDataCaret(parent, index);
          }
        });

    ret["delete-parent"] =
      new Transformation(
        forEditor,
        "delete-parent",
        "Delete <name>",
        undefined,
        function handle(editor, data) {
          var node = data.node;
          var parent = node.parentNode;
          var index = indexOf(parent.childNodes, node);
          var gui_loc = editor.fromDataLocation(node, 0);
          if (!gui_loc.node.classList.contains("_readonly")) {
            editor.data_updater.removeNode(node);
            editor.setDataCaret(parent, index);
          }
        });

    ret["add-attribute"] =
      new Transformation(
        forEditor,
        "add-attribute",
        "Add @<name>",
        undefined,
        function handle(editor, data) {
          var node = data.node;
          var gui_loc = editor.fromDataLocation(node, 0);
          if (!gui_loc.node.classList.contains("_readonly")) {
            editor.data_updater.setAttribute(node, data.name, "");
            var attr = node.getAttributeNode(data.name);
            editor.setDataCaret(attr, 0);
          }
        });

    ret["delete-attribute"] =
      new Transformation(
        forEditor,
        "delete-attribute",
        "Delete this attribute",
        undefined,
        function handle(editor, data) {
          var node = data.node;
          var element = node.ownerElement;
          var gui_owner_loc = editor.fromDataLocation(element, 0);
          var gui_owner = gui_owner_loc.node;
          if (!gui_owner.classList.contains("_readonly")) {
            var encoded = node.name;
            var start_label = domutil.childByClass(gui_owner,
                                                   "__start_label");

            // An earlier version of this code relied on the order
            // of attributres in the data tree. However, this
            // order is not consistent from platform to
            // platform. Using the order of attributes in the GUI
            // is consistent. Therefore we go to the GUI to find
            // the next attribute.

            var values = start_label.getElementsByClassName(
              "_attribute_value");

            // We have to get the parent node because fromDataLocation
            // brings us to the text node that contains the value.
            var gui_node = editor.fromDataLocation(node, 0).node.parentNode;
            var index = indexOf(values, gui_node);
            var next_gui_value = values[index + 1];
            var next_attr = next_gui_value &&
                  editor.toDataNode(next_gui_value);

            editor.data_updater.setAttribute(element, encoded, null);

            // We set the caret inside the next attribute, or if it
            // does not exist, inside the label.
            if (next_attr) {
              editor.setDataCaret(next_attr, 0);
            }
            else {
              editor.setGUICaret(
                gui_owner_loc.node.getElementsByClassName(
                  "_element_name")[0],
                0);
            }
          }
        });

    ret["insert-text"] =
      new Transformation(
        forEditor,
        "insert-text",
        "Insert \"<name>\"",
        undefined,
        function handle(editor, data) {
          editor.type(data.name);
        });

    ret.split = forEditor.split_node_tr;

    return ret;
  }

  exports.makeTagTr = makeTagTr;
});

//  LocalWords:  TransformationRegistry Mangalam MPL Dubeau
