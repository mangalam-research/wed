/**
 * @module modes/test/test_mode
 * @desc A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_mode*/function f(require, exports) {
  "use strict";

  var Mode = require("wed/modes/generic/generic").Mode;
  var oop = require("wed/oop");
  var Action = require("wed/action").Action;
  var transformation = require("wed/transformation");
  var _ = require("lodash");

  var ValidationError = require("salve").ValidationError;

  function Validator(data_root) {
    this._data_root = data_root;
  }

  Validator.prototype.validateDocument = function validateDocument() {
    return [{
      error: new ValidationError("Test"),
      node: this._data_root,
      index: 0,
    }];
  };

  var domutil = require("wed/domutil");
  var Decorator = require("wed/decorator").Decorator;
  var GenericDecorator =
        require("wed/modes/generic/generic-decorator").GenericDecorator;
  var $ = require("jquery");
  var util = require("wed/util");
  var log = require("wed/log");
  var context_menu = require("wed/gui/context-menu");
  var key = require("wed/key");
  var key_constants = require("wed/key-constants");
  var input_trigger_factory = require("wed/input-trigger-factory");

  var indexOf = domutil.indexOf;

  /**
   * @class
   * @extends module:modes/generic/generic_decorator~GenericDecorator
   * @param {module:modes/generic/generic~Mode} mode The mode object.
   * @param {module:modes/generic/metadata~Metadata} metadata
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
  // eslint-disable-next-line no-unused-vars
  function TestDecorator(mode, metadata, options) {
    // Pass the rest of arguments to super's constructor.
    GenericDecorator.apply(this, arguments);

    // Under normal circumstances, this is an empty set so all
    // elements are decorated.
    this._element_level = {
      term: 2,
      ref: 2,
      text: 1,
    };
  }

  oop.inherit(TestDecorator, GenericDecorator);

  TestDecorator.prototype.addHandlers = function addHandlers() {
    GenericDecorator.prototype.addHandlers.apply(this, arguments);
    input_trigger_factory.makeSplitMergeInputTrigger(
      this.editor,
      "hi",
      key.makeKey(";"),
      key_constants.BACKSPACE,
      key_constants.DELETE);
  };

  TestDecorator.prototype.elementDecorator = function elementDecorator(root,
                                                                       el) {
    var data_node = this.editor.toDataNode(el);
    var rend = data_node.attributes.rend;
    if (rend) {
      rend = rend.value;
    }

    var orig_name = util.getOriginalName(el);
    // We don't run the default when we wrap p.
    if (!(orig_name === "p" && rend === "wrap")) {
      Decorator.prototype.elementDecorator.call(
        this, root, el, this._element_level[orig_name] || 1,
        log.wrap(this.contextMenuHandler.bind(this, true)),
        log.wrap(this.contextMenuHandler.bind(this, false)));
    }

    if (orig_name === "ref") {
      $(el).children("._text._phantom").remove();
      this.guiUpdater.insertBefore(
        el,
        $("<div class='_text _phantom _end_wrapper'>)</div>")[0],
        el.lastChild);

      var $before = $("<div class='_text _phantom _start_wrapper'>(</div>");
      this.guiUpdater.insertBefore(el, $before[0],
                                     el.firstChild.nextSibling);

      $before.on("wed-context-menu",
                 { node: el },
                 this._navigationContextMenuHandler.bind(this));
      $before.attr("data-wed-custom-context-menu", true);
    }

    if (orig_name === "p") {
      switch (rend) {
      case "foo":
        $(el).children("._gui_test").remove();
        this.guiUpdater
          .insertBefore(
            el,
            $("<div class='_gui _phantom _gui_test btn " +
              "btn-default'>Foo</div>")[0],
            el.lastChild);

        var found;
        var child = data_node.firstElementChild;
        while (!found && child) {
          if (child.tagName === "abbr") {
            found = child;
          }
          child = child.nextElementSibling;
        }
        if (found) {
          this.guiUpdater
            .insertBefore(
              el,
              $("<div class='_gui _phantom _gui_test btn " +
                "btn-default'>Foo2</div>")[0],
              el.lastChild);
          this.guiUpdater
            .insertBefore(
              el,
              $("<div class='_gui _phantom _gui_test btn " +
                "btn-default'>Foo3</div>")[0],
              el.lastChild);
        }
        break;
      case "wrap":
        if (domutil.closestByClass(el, "_gui_test")) {
          break;
        }

        var wrapper = $("<div class='_gui _phantom_wrap _gui_test btn " +
                        "btn-default'></div>")[0];
        this.guiUpdater.insertBefore(el.parentNode, wrapper, el);
        this.guiUpdater.insertBefore(wrapper, el, null);
        break;
      default:
        break;
      }
    }
  };

  TestDecorator.prototype._navigationContextMenuHandler = log.wrap(
    function _navigationContextMenuHandler(wed_ev, ev) {
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
      var actions = this.mode.getContextualActions("insert", orig_name,
                                                   container, offset);
      // data to pass to transformations
      var data = {
        name: orig_name,
        moveCaretTo: this.editor.caretManager.makeCaret(container, offset),
      };
      var act_ix;
      var act;
      for (act_ix = 0; act_ix < actions.length; ++act_ix) {
        act = actions[act_ix];
        tuples.push([act, data, act.getLabelFor(data) + " before this one"]);
      }

      // Convert the tuples to actual menu items.
      var items = [];
      for (var tix = 0; tix < tuples.length; ++tix) {
        var tup = tuples[tix];
        var $a = $("<a tabindex='0' href='#'>" + tup[2] + "</a>");
        $a.click(tup[1], tup[0].boundTerminalHandler);
        items.push($("<li></li>").append($a)[0]);
      }

      // eslint-disable-next-line no-new
      new context_menu.ContextMenu(this.editor.doc,
                                   ev.clientX, ev.clientY, items);

      return false;
    });


  var LOCAL_OPTIONS = ["ambiguous_fileDesc_insert",
                       "fileDesc_insert_needs_input",
                       "hide_attributes"];

  /**
   * This mode is purely designed to help test wed, and nothing
   * else. Don't derive anything from it and don't use it for editing.
   *
   * @class
   * @extends module:modes/generic/generic~Mode
   * @param {module:wed~Editor} editor The editor with which the mode is
   * being associated.
   * @param {Object} options The options for the mode.
   */
  function TestMode(editor, options) {
    var opts = _.omit(options, LOCAL_OPTIONS);
    Mode.call(this, editor, opts);
    this._test_mode_options = _.pick(options, LOCAL_OPTIONS);

    if (this.constructor !== TestMode) {
      throw new Error("this is a test mode; don't derive from it!");
    }

    this.wedOptions.metadata = {
      name: "Test",
      authors: ["Louis-Dominique Dubeau"],
      description: "TEST MODE. DO NOT USE IN PRODUCTION!",
      license: "MPL 2.0",
      copyright:
      "2013, 2014 Mangalam Research Center for Buddhist Languages",
    };
    this.wedOptions.label_levels = {
      max: 2,
      initial: 1,
    };

    if (options.hide_attributes) {
      this.wedOptions.attributes = "hide";
    }
  }

  oop.inherit(TestMode, Mode);

  function TypeaheadAction() {
    Action.apply(this, arguments);
  }

  oop.inherit(TypeaheadAction, Action);

  TypeaheadAction.prototype.execute = function execute() {
    var editor = this.editor;

    var substringMatcher = function substringMatcher(strs) {
      return function findMatches(q, cb) {
        var re = new RegExp(q, "i");

        var matches = [];
        for (var i = 0; i < strs.length; ++i) {
          var str = strs[i];
          if (re.test(str)) {
            matches.push({ value: str });
          }
        }

        cb(matches);
      };
    };

    var test_data = [];
    for (var i = 0; i < 100; ++i) {
      test_data.push("Test " + i);
    }

    var options = {
      options: {
        autoselect: true,
        hint: true,
        highlight: true,
        minLength: 1,
      },
      datasets: [{
        source: substringMatcher(test_data),
      }],
    };

    var pos = editor.computeContextMenuPosition(undefined, true);
    var typeahead =
          editor.displayTypeaheadPopup(pos.left, pos.top, 300,
                                       "Test", options,
                                       function finish(obj) {
                                         if (obj) {
                                           editor.type(obj.value);
                                         }
                                       });
    typeahead.hideSpinner();
    var range = editor.caretManager.range;

    // This is purposely not as intelligent as what real mode would
    // need.
    if (range && !range.collapsed) {
      typeahead.setValue(range.toString());
    }
  };

  function DraggableModalAction() {
    Action.apply(this, arguments);
  }

  oop.inherit(DraggableModalAction, Action);

  DraggableModalAction.prototype.execute = function execute() {
    var editor = this.editor;
    var modal = editor.mode._draggable;
    modal.modal();
  };

  function ResizableModalAction() {
    Action.apply(this, arguments);
  }

  oop.inherit(ResizableModalAction, Action);

  ResizableModalAction.prototype.execute = function execute() {
    var editor = this.editor;
    var modal = editor.mode._resizable;
    modal.modal();
  };

  function DraggableResizableModalAction() {
    Action.apply(this, arguments);
  }

  oop.inherit(DraggableResizableModalAction, Action);

  DraggableResizableModalAction.prototype.execute = function execute() {
    var editor = this.editor;
    var modal = editor.mode._draggable_resizable;
    modal.modal();
  };

  TestMode.prototype.init = function init() {
    return Mode.prototype.init.apply(this, arguments)
      .then(function afterSuper() {
        var editor = this.editor;
        this._typeahead_action = new TypeaheadAction(
          editor, "Test typeahead", undefined,
          "<i class='fa fa-plus fa-fw'></i>", true);

        this._draggable = editor.makeModal({ draggable: true });
        this._resizable = editor.makeModal({ resizable: true });
        this._draggable_resizable = editor.makeModal({
          resizable: true,
          draggable: true,
        });

        this._draggable_action = new DraggableModalAction(
          editor, "Test draggable", undefined, undefined, true);
        this._resizable_action = new ResizableModalAction(
          editor, "Test resizable", undefined, undefined, true);
        this._draggable_resizable_action = new DraggableResizableModalAction(
          editor, "Test draggable resizable", undefined, undefined, true);
      }.bind(this));
  };

  TestMode.prototype.getContextualActions = function getContextualActions(
    type, tag, container, offset) {
    if (this._test_mode_options.fileDesc_insert_needs_input &&
        tag === "fileDesc" && type === "insert") {
      return [new transformation.Transformation(
        this.editor, "insert", "foo", undefined, undefined, true,
        // We don't need a real handler because it will not be called.
        function noop() {})];
    }

    var ret = Mode.prototype.getContextualActions.call(this, type, tag,
                                                       container, offset);

    if (this._test_mode_options.ambiguous_fileDesc_insert &&
        tag === "fileDesc" && type === "insert") {
      // We just duplicate the transformation.
      ret = ret.concat(ret);
    }

    if (tag === "ref" && (type === "insert" || type === "wrap")) {
      ret.push(this._typeahead_action, this._draggable_action,
               this._resizable_action, this._draggable_resizable_action);
    }

    return ret;
  };


  TestMode.prototype.makeDecorator = function makeDecorator() {
    var obj = Object.create(TestDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this.metadata, this.options].concat(args);
    TestDecorator.apply(obj, args);
    return obj;
  };

  TestMode.prototype.getAttributeCompletions =
    function getAttributeCompletions(attr) {
      if (attr.name === "n") {
        return ["completion1", "completion2"];
      }

      return [];
    };


  TestMode.prototype.getValidator = function getValidator() {
    return new Validator(this.editor.data_root);
  };

  exports.Mode = TestMode;
});

//  LocalWords:  domutil metas tei oop util Mangalam MPL
//  LocalWords:  Dubeau
