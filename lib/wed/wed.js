/**
 * @module wed
 * @desc The main module for wed.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var rangy = require("rangy");
var validator = require("./validator");
var Validator = validator.Validator;
var util = require("./util");
var name_resolver = require("./name_resolver");
var domutil = require("./domutil");
var domlistener = require("./domlistener");
var transformation = require("./transformation");
var validate = require("salve/validate");
var oop = require("./oop");
var undo = require("./undo");
var wundo = require("./wundo");
var jqutil = require("./jqutil");
var TreeUpdater = require("./tree_updater").TreeUpdater;
var GUIUpdater = require("./gui_updater").GUIUpdater;
var UndoRecorder = require("./undo_recorder").UndoRecorder;
var key_constants = require("./key_constants");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var Conditioned = require("./lib/conditioned").Conditioned;
var modal = require("./gui/modal");
var exceptions = require("./exceptions");
var AbortTransformationException = exceptions.AbortTransformationException;
require("bootstrap");

exports.version = "0.6.0";

var getOriginalName = util.getOriginalName;

function Editor() {
    // Call the constructor for our mixins
    SimpleEventEmitter.call(this);
    Conditioned.call(this);

    this._mode_data = {};
}

oop.implement(Editor, SimpleEventEmitter);
oop.implement(Editor, Conditioned);

Editor.prototype.init = function (widget, options) {

    if (options === undefined)
        options = module.config();

    // Records whether the first parse has happened.
    this._first_validation_complete = false;

    this._destroyed = false;

    // Marks caret position in places where putting a selection caret
    // is not possible.
    this._$fake_caret = $("<span class='_wed_caret' contenteditable='false'>&nbsp;</span>");
    this._fake_caret = undefined;
    this._refreshing_caret = 0;

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not
    // alter anything outside our frame.
    this.$frame = this.$widget.closest("html");
    this.my_window = this.$frame.get(0).ownerDocument.defaultView;

    this.options = options;

    // $gui_root and root represent the document root in the HTML elements
    // displayed. The top level element of the XML document being
    // edited will be the single child of $gui_root/root.
    this.$gui_root = $("<div class='wed-document'/>");

    this.$widget.wrapInner(this.$gui_root);
    // jQuery does not update this.$gui_root to reflect its position in the
    // DOM tree.
    this.$gui_root = $(this.widget.childNodes[0]);

    this.gui_root = this.$gui_root.get(0);

    // $data_root is the document we are editing, $gui_root will become
    // decorated with all kinds of HTML elements so we keep the two
    // separate.
    this.$data_root = this.$gui_root.clone();

    // Put the data_root into a document fragment to keep rangy happy.
    var frag = this.widget.ownerDocument.createDocumentFragment();
    frag.appendChild(this.$data_root.get(0));

    domutil.linkTrees(this.$data_root.get(0), this.$gui_root.get(0));
    this.data_updater = new TreeUpdater(this.$data_root.get(0));
    this._gui_updater = new GUIUpdater(this.$gui_root.get(0),
                                       this.data_updater);
    this._undo_recorder = new UndoRecorder(this, this.data_updater);

    this.$gui_root.wrap('<div class="row"><div class="col-lg-10"><div class="row"/></div></div>');
    this.$sidebar = $('<div id="sidebar" class="col-lg-2"/>');
    this.$widget.find('.row').first().prepend(this.$sidebar);
    // Needed by Validator
    this.$gui_root.parent().before("<div class='row'><div class='progress'><span></span><div id='validation-progress' class='progress-bar' style='width: 0%'></div></div></div>");
    this.$validation_progress = this.$widget.find("#validation-progress");
    this.$validation_message = this.$validation_progress.prev('span');

    this.$sidebar.append('\
<div class="accordion">\
 <div class="accordion-group">\
  <div class="accordion-heading">\
   <a class="accordion-toggle" data-toggle="collapse" href="#sb-nav">Navigation</a>\
  </div>\
 </div>\
 <div id="sb-nav" class="accordion-body collapse in">\
  <div class="accordion-inner">\
   <ul id="navlist" class="nav nav-list">\
    <li class="inactive">A list of navigation links will appear here</li>\
   </ul>\
  </div>\
 </div>\
 <div class="accordion-group">\
  <div class="accordion-heading">\
   <a class="accordion-toggle" data-toggle="collapse" href="#sb-errors">Errors</a>\
  </div>\
 </div>\
 <div id="sb-errors" class="accordion-body collapse in">\
  <div class="accordion-inner">\
   <ul id="sb-errorlist" class="nav nav-list">\
    <li class="inactive"></li>\
   </ul>\
  </div>\
 </div>\
</div>');

    this.menu_layer = $("<div class='wed-menu-layer'>").get(0);
    this.$gui_root.before(this.menu_layer);

    this.caret_layer = $("<div class='wed-caret-layer'>").get(0);
    this.$gui_root.before(this.caret_layer);


    this._namespace_modal = this.makeModal();
    this._namespace_modal.setTitle("Assign names for namespaces");
    this._namespace_modal.addOkCancel();

    this._paste_modal = this.makeModal();
    this._paste_modal.setTitle("Invalid structure");
    this._paste_modal.setBody(
        "<p>The data you are trying to paste appears to be XML. \
        However, pasting it here will result in a structurally invalid \
        document. Do you want to paste it as text instead? (If you answer \
        negatively, the data won't be pasted at all.)<p>");
    this._paste_modal.addYesNo();

    this.straddling_modal = this.makeModal();
    this.straddling_modal.setTitle("Invalid modification");
    this.straddling_modal.setBody(
        "<p>The text selected straddles disparate elements of the document. \
        You may be able to achieve what you want to do by selecting \
        smaller sections.<p>");
    this.straddling_modal.addButton("Ok", true);

    this._raw_caret = undefined;

    this._selection_stack = [];

    // XXX this should probably go and be replaced by a check to make
    // sure bootstrap.css or a variant has been loaded. (Or
    // configurable to load something else than the minified version?)
    var fontawesome_css = require.toUrl("font-awesome/css/font-awesome.min.css");
    this.$frame.children("head").prepend('<link rel="stylesheet" href="' + fontawesome_css + '" type="text/css" />');
    var bootstrap_css = require.toUrl("bootstrap/../../css/bootstrap.min.css");
    this.$frame.children("head").prepend('<link rel="stylesheet" href="' + bootstrap_css + '" type="text/css" />');

    // This domlistener is used only for validation.
    this.validation_domlistener = new domlistener.Listener(this.$data_root);

    // This domlistener is used for everything else
    this.gui_domlistener = new domlistener.Listener(this.gui_root);

    // Setup the cleanup code.
    $(this.my_window).on('unload.wed', { editor: this }, unloadHandler);

    this._last_done_shown = 0;
    this.$error_list = this.$widget.find("#sb-errorlist");

    this._undo = new undo.UndoList();

    this.mode_path = options.mode.path;
    this.paste_tr = new transformation.Transformation(this, "Paste", paste);
    this.cut_tr = new transformation.Transformation(this, "Cut", cut);
    this.split_node_tr =
        new transformation.Transformation(
            this, "Split <element_name>",
            transformation.splitNode);
    this.merge_with_previous_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "Merge <element_name> with previous",
            transformation.mergeWithPreviousHomogeneousSibling);

    this.merge_with_next_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "Merge <element_name> with next",
            transformation.mergeWithNextHomogeneousSibling);

    // This is an ad hoc cut function which modifies the DOM directly
    // for everything except the final merging of text nodes.
    this.cut_function = domutil.genericCutFunction.bind(
        {deleteText: domutil.deleteText,
         deleteNode: domutil.deleteNode,
         mergeTextNodes:
         this.data_updater.mergeTextNodes.bind(this.data_updater)});

    this.setMode(this.mode_path, options.mode.options);
};

Editor.prototype.setMode = function (mode_path, options) {
    require([mode_path], function (mode_module) {
        mode_module.Mode.optionResolver(
            options,
            function (resolved_opts) {
            this.onModeChange(new mode_module.Mode(resolved_opts));
        }.bind(this));
    }.bind(this));
};

Editor.prototype.onModeChange = function (mode) {
    if (this._destroyed)
        return;
    this.mode = mode;
    mode.init(this);

    var styles = this.mode.getStylesheets();
    for(var style_ix = 0, style; (style = styles[style_ix]) !== undefined;
        ++style_ix)
        this.$frame.children("head").append(
            '<link rel="stylesheet" href="' + require.toUrl(style) +
                '" type="text/css" />');

    this.$gui_root.css("overflow-y", "auto");
    this._resizeHandler();

    this.resolver = mode.getAbsoluteResolver();
    this.validator = new Validator(this.options.schema,
                                   this.$data_root.get(0));
    this.validator.addEventListener(
        "state-update", this._onValidatorStateChange.bind(this));
    this.validator.addEventListener(
        "error", this._onValidatorError.bind(this));
    this.validator.addEventListener(
        "reset-errors", this._onResetErrors.bind(this));

    this.validator.initialize(this._postInitialize.bind(this));
};

Editor.prototype._postInitialize = function  () {
    if (this._destroyed)
        return;

    // Make the validator revalidate the structure from the point
    // where a change occurred.
    this.validation_domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap, .wed-document",
        function ($root, $added, $removed, $prev, $next, $target) {
        if ($added.is("._real, ._phantom_wrap") ||
            $removed.is("._real, ._phantom_wrap")) {
            this._last_done_shown = 0;
            this.validator.restartAt($target.get(0));
        }
    }.bind(this));

    this.validation_domlistener.startListening();

    this.decorator = this.mode.makeDecorator(this.gui_domlistener, this);
    this.decorator.init(this.$gui_root);

    this.gui_domlistener.addHandler(
        "children-changed",
        "*",
        function ($root, $added, $removed, $prev, $next, $target) {
        var $all = $added.add($removed);
        // We want to avoid having the trigger fire if the only thing
        // that changed is the marker we use to calculate caret
        // position.
        if (this._refreshing_caret)
            return;
        this.gui_domlistener.trigger("refresh-caret");
    }.bind(this));

    this.gui_domlistener.addHandler(
        "text-changed",
        "*",
        function () {
        if (this._refreshing_caret)
            return;

        this.gui_domlistener.trigger("refresh-caret");
    }.bind(this));

    this.gui_domlistener.addHandler(
        "trigger",
        "refresh-caret",
        function () {
        this._refreshFakeCaret();
    }.bind(this));

    // If a placeholder is edited, delete it.
    this.gui_domlistener.addHandler(
        "children-changed",
        "._placeholder",
        function ($root, $added, $removed, $prev, $next, $target) {
        if ($added.is("._real, ._phantom_wrap") ||
            $removed.is("._real, ._phantom_wrap"))
            $target.children().unwrap();
    });

    // If a placeholder is edited, delete it.
    this.gui_domlistener.addHandler(
        "text-changed",
        "._placeholder",
        function ($root, $target) {
        // Make sure we do no chase after targets that are no
        // longer part of the DOM.
        if ($target.closest(document.documentElement).length > 0) {
            var text = $.trim($target.text());

            // Don't create an empty text node.
            if (text.length > 0) {
                var text_node = document.createTextNode(text);
                $target.parent().replaceWith(text_node);
                this.setCaret(text_node, text_node.nodeValue.length);
            }
        }
    }.bind(this));


    // If an element is edited and contains a placeholder, delete
    // the placeholder
    this.gui_domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap",
        function ($root, $added, $removed, $prev, $next, $target) {
        // Narrow it to the elements we care about.
        var $narrow_added =
            $added.filter("._real, ._phantom_wrap, ._phantom._text").
            add($added.filter(jqutil.textFilter));
        var $narrow_removed =
            $removed.filter("._real, ._phantom_wrap, ._phantom._text").
            add($removed.filter(jqutil.textFilter));

        if ($narrow_added.length + $narrow_removed.length === 0)
            return;

        if ($target.children('._real, ._phantom._text, ._phantom_wrap').
            length === 0 &&
            $target.contents().filter(jqutil.textFilter).length === 0) {
            var nodes =
                    this.mode.nodesAroundEditableContents($target.get(0));
            var ph = this.mode.makePlaceholderFor($target.get(0));
            if (nodes[0] !== null)
                $(nodes[0]).after(ph);
            else if (nodes[1] !== null)
                $(nodes[1]).before(ph);
            else
                $target.append(ph);
        }
        else
            $target.children("._placeholder").remove();
    }.bind(this));

    this.gui_domlistener.addHandler(
        "included-element",
        "._real, ._phantom_wrap",
        function ($root, $tree, $parent, $prev, $next, $target) {
        if ($target.children(
            '._real, ._phantom._text, ._phantom_wrap').length === 0 &&
            $target.contents().filter(jqutil.textFilter).length === 0) {
            var nodes = this.mode.nodesAroundEditableContents($target.get(0));
            var ph = this.mode.makePlaceholderFor($target.get(0));
            if (nodes[0] !== null)
                $(nodes[0]).after(ph);
            else if (nodes[1] !== null)
                $(nodes[1]).before(ph);
            else
                $target.append(ph);
        }
    }.bind(this));


    this.gui_domlistener.addHandler(
        "excluded-element",
        "*",
        function ($root, $tree, $parent, $prev, $next, $element) {
        if (!this._raw_caret)
            return; // no caret to move

        var container = this._raw_caret[0];
        var $container = $(container);
        if ($container.closest($element).length > 0) {
            var parent = $parent.get(0);
            // We must move the caret to a sane position.
            if ($prev.length > 0 && $prev.closest($root).length > 0 &&
                $parent.closest($root).length > 0)
                this.setCaret(parent,
                              Array.prototype.indexOf.call(
                                  parent.childNodes,
                                  $prev.get(0)) + 1);
            else if ($next.length > 0 && $next.closest($root).length > 0 &&
                     $parent.closest($root).length > 0)
                this.setCaret(parent,
                              Array.prototype.indexOf.call(
                                  parent.childNodes,
                                  $next.get(0)));
            else if ($parent.closest($root).length > 0)
                this.setCaret(parent, parent.childNodes.length);
            else {
                // There's nowhere sensible to put it at
                this._removeFakeCaret();
                this._raw_caret = undefined;
            }
        }
    }.bind(this));

    if (this.gui_root.childNodes.length === 0) {
        var namespaces = this.validator.getNamespaces();

        // Drop the xml namespace, because we don't need to define
        // it. It will appear at most once in the array.
        var xml = namespaces.indexOf(name_resolver.XML1_NAMESPACE);
        if (xml >= 0)
            namespaces.splice(xml, 1);

        var mappings = Object.create(null);
        if (namespaces.length === 1)
            // Just make this namespace the default one
            mappings[""] = namespaces[0];
        else { // Ask the user
            var modal = this._namespace_modal;
            var body = [];
            namespaces.forEach(function (ns) {
                // XXX this is incomplete
                body.push('<input type="text" name="..."/>');
                body.push("<label>", ns, "</label>");
            });
            this._namespace_modal.setBody(body.join(""));
            modal.modal();
        }

        var attrs = Object.create(null);
        Object.keys(mappings).forEach(function (k) {
            this.resolver.definePrefix(k, mappings[k]);
            if (k === "")
                attrs.xmlns = mappings[k];
            else
                attrs["xmlns:" + k] = mappings[k];
        }.bind(this));

        var evs = this.validator.possibleAt(this.$data_root.get(0),
                                            0).toArray();
        if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
            transformation.insertElement(
                this.data_updater, this.$data_root.get(0), 0,
                this.resolver.unresolveName(evs[0].params[1],
                                            evs[0].params[2]),
                attrs);
        }

        ///else
        /// XXX log an error somewhere
    }

    this.$gui_root.on('keydown',
                      util.eventHandler(this._keydownHandler.bind(this)));
    this.$gui_root.on('wed-global-keydown',
                      this._globalKeydownHandler.bind(this));

    this.$gui_root.on('keypress',
                      util.eventHandler(this._keypressHandler.bind(this)));
    this.$gui_root.on('wed-global-keypress',
                      this._globalKeypressHandler.bind(this));
    this.$gui_root.on('click.wed', this._mouseHandler.bind(this));
    // No click in the next binding because click does not
    // distinguish left, middle, right mouse buttons.
    this.$gui_root.on('keyup mouseup',
                      this._caretChangeEmitter.bind(this));
    this.$gui_root.on('caretchange',
                      this._caretChangeHandler.bind(this));
    this.$gui_root.on('contextmenu',
                      util.eventHandler(this._contextMenuHandler.bind(this)));

    this.$gui_root.on('paste',
                      util.eventHandler(this._pasteHandler.bind(this)));

    this.$gui_root.on('cut',
                      util.eventHandler(this._cutHandler.bind(this)));
    $(this.my_window).on('resize.wed', this._resizeHandler.bind(this));

    var nav_links = [];
    this.$gui_root.find(".head").each(function (x, el) {
        nav_links.push("<li><a href='#" + el.id + "'>" + $(el).text() +
                       "</a></li>");
    });
    this.$sidebar.find("#navlist>.inactive").replaceWith(nav_links.join(""));

    this.validator.start();

    this.gui_domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo = new undo.UndoList();
    this._setCondition("initialized", {editor: this});
};

/**
 * This method asks the editor to process any pending operation which
 * may impact the display. This method is meant to be used internally
 * by the editor and for testing/debugging purposes
 * only. Consequently, the various modes that customize wed's behavior
 * must not use this method. If calling this method makes a mode that
 * did not work well work normally, then either the code that was not
 * working well is buggy (and calling _syncDisplay is not the
 * solution) or there is a bug in wed that should be fixed.
 */
Editor.prototype._syncDisplay = function () {
    this.gui_domlistener.processImmediately();
};

/**
 * @param {module:transformation~Transformation} tr The transformation
 * to fire.
 * @param {Node} node The DOM node to fire it on. This can be a node
 * from the GUI tree or from the data tree.
 * @param {String} element_name The element_name to use in the
 * description of the transformation.
 * @param transformation_data Arbitrary data to be passed to the
 * transformation.
 */
Editor.prototype.fireTransformation = function(tr, node, element_name,
                                               transformation_data) {
    this.dismissContextMenu();

    var raw_caret = this._getRawCaret();
    if (raw_caret === undefined)
        throw new Error("transformation applied with undefined caret.");
    var current_group = this._undo.getGroup();
    if (current_group instanceof wundo.TextUndoGroup)
            this._undo.endGroup();

    this._undo.startGroup(
        new wundo.UndoGroup("Undo " + tr.getDescriptionFor(transformation_data),
                            this));
    try {
        try {
            if (node !== undefined) {
                // Convert the gui node to a data node
                if ($(node).closest(this.$gui_root).length > 0) {
                    var path = this.nodeToPath(node);
                    node = domutil.pathToNode(this.$data_root.get(0), path);
                }
                else if ($(node).closest(this.$data_root).length === 0) {
                    throw new Error("node is neither in the gui tree nor "+
                                    "the data tree");
                }
            }
            tr.handler(this, node, element_name, transformation_data);
            // Ensure that all operations that derive from this
            // transformation are done *now*.
        }
        finally {
            this._syncDisplay();
            this._undo.endGroup();
        }
    }
    catch(ex) {
        this.undo();
        if (!(ex instanceof AbortTransformationException))
            throw ex;
    }
};

Editor.prototype._fireTransformation = function (e) {
    this.fireTransformation(e.data.tr, e.data.node, e.data.element_name,
                            undefined);
};

Editor.prototype.recordUndo = function (undo) {
    this._undo.record(undo);
};

Editor.prototype.undo = function () {
    this._undo_recorder.suppressRecording(true);
    this._undo.undo();
    this._syncDisplay();
    this._undo_recorder.suppressRecording(false);
};

Editor.prototype.redo = function () {
    this._undo_recorder.suppressRecording(true);
    this._undo.redo();
    this._syncDisplay();
    this._undo_recorder.suppressRecording(false);
};

Editor.prototype.dumpUndo = function () {
    console.log(this._undo.toString());
};

Editor.prototype.undoMarker = function (msg) {
    this._syncDisplay();
    this.recordUndo(new wundo.MarkerUndo(msg));
};

Editor.prototype.undoingOrRedoing = function () {
    return this._undo.undoingOrRedoing();
};

Editor.prototype._resizeHandler = function () {
    var height_after = 0;

    function addHeight() {
        /* jshint validthis:true */
        height_after += $(this).outerHeight(true);
    }

    var $examine = this.$widget;
    while($examine.length > 0) {
        var $next = $examine.nextAll();
        $next.each(addHeight);
        $examine = $examine.parent();
    }

    // The height is the inner height of the window:
    // a. minus what appears before it.
    // b. minus what appears after it.
    var height = this.my_window.innerHeight -
            // This is the space before
            this.$gui_root.offset().top -
            // This is the space after
            height_after;

    this.$gui_root.css("max-height", height);
    this.$gui_root.css("min-height", height);
};

Editor.prototype._contextMenuHandler = function (e, jQthis) {
    // If the caret is changing due to a click on a placeholder,
    // then put it inside the placeholder.
    var $ph = $(e.target).closest("._placeholder");
    if ($ph.length > 0)
        this.setCaret($ph.get(0).childNodes[0], 0);

    var selection = this.getSelection();
    var original_range = this.getSelectionRange();
    var range = original_range.cloneRange();
    var start_is_focus = ((selection.focusNode === range.startContainer) &&
                          (selection.focusOffset === range.startOffset));
    range.collapse(start_is_focus);

    var $node_of_interest;
    var offset;
    if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
        $node_of_interest = $(range.startContainer);
        offset = range.startOffset;
    }
    else {
        $node_of_interest = $(range.startContainer.parentNode);
        offset = Array.prototype.indexOf.call(
            range.startContainer.parentNode.childNodes,
            range.startContainer);
    }

        // Move out of any placeholder
    var $ph = $node_of_interest.closest("._placeholder");
    if ($ph.length > 0) {
        offset = Array.prototype.indexOf.call(
            $ph.get(0).parentNode.childNodes, $ph.get(0));
        $node_of_interest = $ph.parent();
    }

    var menu_items = [];
    if (!$node_of_interest.hasClass("_phantom") &&
        // Should not be part of a gui element.
        $node_of_interest.parent("._gui").length === 0) {
        // We want to wrap if we have an actual rage
        var wrap = !original_range.collapsed;
        $node_of_interest = $(
            domutil.pathToNode(this.$data_root.get(0),
                               this.nodeToPath($node_of_interest.get(0))));
        this.validator.possibleAt(
            $node_of_interest.get(0),
            offset).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag")
                    return;

                var unresolved = this.resolver.unresolveName(
                    ev.params[1], ev.params[2]);

                var trs = this.mode.getContextualActions(
                    wrap ? "wrap" : "insert", unresolved);
                if (trs === undefined)
                    return;

                for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined;
                    ++tr_ix) {
                    var data = {element_name: unresolved };
                    var $a = $("<a tabindex='0' href='#'>" +
                               tr.getDescriptionFor(data) + "</a>");
                    $a.click(data,
                             tr.bound_handler);
                    menu_items.push($("<li></li>").append($a).get(0));
                }
            }.bind(this));

        if ($node_of_interest.get(0) !== this.gui_root.childNodes[0]) {
            var orig = getOriginalName($node_of_interest.get(0));
            var trs = this.mode.getContextualActions("delete-parent", orig);
            if (trs !== undefined) {
                trs.forEach(function (tr) {
                    var data = {node: $node_of_interest.get(0),
                                element_name: orig };
                    var $a = $("<a tabindex='0' href='#'>" +
                               tr.getDescriptionFor(data) + "</a>");
                    $a.click(data,
                             tr.bound_handler);
                    menu_items.push($("<li>").append($a).get(0));
                }.bind(this));
            }
        }

        var items = this.mode.getContextualMenuItems();
        items.forEach(function (item) {
            var $a = $("<a tabindex='0' href='#'>"+ item[0] + "</a>");
            $a.click(item[1]);
            menu_items.push($("<li>").append($a).get(0));
        });
    }

    var $sep = $node_of_interest.parents().addBack().
            siblings("[data-wed--separator-for]").first();
    var node_of_interest = $node_of_interest.get(0);
    var $transformation_node = $sep.siblings().filter(function () {
        return (this === node_of_interest) ||
            $(this).has(node_of_interest).length > 0;
    });
    var sep_for = $sep.attr("data-wed--separator-for");
    if (sep_for !== undefined) {
        var trs = this.mode.getContextualActions(
            ["merge-with-next", "merge-with-previous", "append",
             "prepend"], sep_for);
        trs.forEach(function (tr) {
            var data = {node: $transformation_node.get(0),
                        element_name: sep_for};
            var $a = $("<a tabindex='0' href='#'>" +
                       tr.getDescriptionFor(data) + "</a>");
            $a.click(data, tr.bound_handler);
            menu_items.push($("<li></li>").append($a).get(0));
        }.bind(this));
    }

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0)
        return true;

    // We must wait to do this after we are done with the range.
    var pos = this._rangeToPixelPosition();

    this.displayContextMenu(pos.left, pos.top, menu_items);
    return false;
};

Editor.prototype._cutHandler = function(e, jQthis) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    // The strategy here is:
    // - If the cut should be prevented, return false.
    // - If the cut should go ahead:
    //  - Set a timer to update the data tree after the browser cut happens.
    //  - Return true to let the browser cut. This will cut from the gui tree.

    var range = this.getSelectionRange();
    if (domutil.isWellFormedRange(range)) {
        var start_caret = this.toDataCaret(range.startContainer,
                                           range.startOffset);
        var end_caret = this.toDataCaret(range.endContainer, range.endOffset);
        this.my_window.setTimeout(function () {
            this.fireTransformation(this.cut_tr, caret[0], undefined,
                                    {e: e, jQthis: jQthis,
                                     start_caret: start_caret,
                                     end_caret: end_caret});
        }.bind(this), 1);
        return true;
    }
    else {
        this.straddling_modal.modal();
        return false;
    }
};

function cut(editor, node, element_name, data) {
    var start_caret = data.start_caret;
    var end_caret = data.end_caret;

    editor.cut_function(start_caret, end_caret);
}

Editor.prototype._pasteHandler = function(e, jQthis) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    var cd = e.originalEvent.clipboardData;
    var as_html = (Array.prototype.indexOf.call(cd.types, "text/html") > -1);
    var $data = $("<div class='_real'>");
    if (as_html) {
        // Create a DOM fragment from it.
        $data.append(cd.getData("text/html"));

        // We must remove phantom_wrap elements while keeping their
        // contents.
        $data.find("._phantom_wrap").each(function () {
            var $this = $(this);
            $this.replaceWith($this.contents());
        });

        // Span at the top level may be used to wrap text nodes.
        $data.children('span').each(function () {
            $(this).replaceWith(this.childNodes);
        });

        // Anything not _real must be removed. The way pasting works
        // there may be foreign HTML elements included in the
        // fragment even if it is originating from a wed document.
        $data.find(":not(._real)").remove();

        // If we end up with nothing, treat it as text.
        if ($data.contents().length === 0)
            as_html = false;
        else {
            // Otherwise, check whether it is valid.
            var errors = this.validator.speculativelyValidate(
                caret[0], caret[1], $data.contents().toArray());
            if (errors) {
                this._paste_modal.modal(function () {
                    if (this._paste_modal.getClickedAsText() === "Yes") {
                        $data = $("<div class='_real'>");
                        $data.append(document.createTextNode(
                            cd.getData("text/plain")));
                        // At this point $data is single top level
                        // fake <div> element which contains the
                        // contents we actually want to paste.
                        this.fireTransformation(this.paste_tr, caret[0],
                                                undefined,
                                                {$data: $data, e: e,
                                                 jQthis: jQthis});
                    }
                }.bind(this));
                return false;
            }
        }

    }

    if (!as_html) {
        $data = $("<div class='_real'>");
        $data.append(cd.getData("text/plain"));
    }

    // At this point $data is single top level fake <div> element
    // which contains the contents we actually want to paste.
    this.fireTransformation(this.paste_tr, caret[0], undefined,
                            {$data: $data, e: e, jQthis: jQthis});
    return false;
};


function paste(editor, node, element_name, data) {
    var $data = data.$data;
    var $data_clone = $data.clone();
    var caret = editor.getDataCaret();
    var wrapper = $data.get(0);
    var new_caret, ret;
    if (wrapper.childNodes.length === 1 &&
        wrapper.firstChild.nodeType === Node.TEXT_NODE) {
        ret = editor.data_updater.insertText(caret[0], caret[1],
                                             wrapper.firstChild.nodeValue);
        new_caret = (ret[0] === ret[1]) ?
            [caret[0], caret[1] + wrapper.firstChild.nodeValue.length] :
            [ret[1], ret[1].nodeValue.length];
    }
    else {
        var frag = document.createDocumentFragment();
        $data.contents().each(function () {
            frag.appendChild(this);
        });
        switch(caret[0].nodeType) {
        case Node.TEXT_NODE:
            var parent = caret[0].parentNode;
            ret = editor.data_updater.insertIntoText(caret[0], caret[1], frag);
            new_caret = ret[1];
            break;
        case Node.ELEMENT_NODE:
            var child = caret[0].childNodes[caret[1]];
            var after =  child ? child.nextSibling : null;
            editor.data_updater.insertBefore(caret[0], frag, child);
            new_caret = [caret[0],
                         after ? Array.prototype.indexOf.call(
                             caret[0].childNodes, after) :
                         caret[0].childNodes.length];
            break;
        default:
            throw new Error("unexpected node type: " + caret[0].nodeType);
        }
    }
    editor.setDataCaret(new_caret);
    editor.$gui_root.trigger('wed-post-paste', [data.e, data.jQthis, caret,
                                                $data_clone]);
}

Editor.prototype.moveCaretRight = function () {
    this._removeFakeCaret();
    var pos = this._getRawCaret();
    if (pos === undefined || pos === null)
        return; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos[0]).closest("._gui").get(0);
    if (closest_gui !== undefined) {
        pos = pos.slice(); // clone it first
        pos[1] = Array.prototype.indexOf.call(
            closest_gui.parentNode.childNodes, closest_gui) + 1;
        pos[0] = closest_gui.parentNode;
    }

    while(true)
    {
        pos = domutil.nextCaretPosition(pos, this.gui_root, false);
        if (pos === null)
            break;

        var $node = $(pos[0]);
        closest_gui = $node.closest("._gui").get(0);
        if (closest_gui !== undefined) {
            // Stopping in a gui element is fine, but normalize the
            // position to the start of the gui element.
            pos = [closest_gui, 0];
            break;
        }

        if (// Can't stop inside a phantom node.
            (($node.closest("._phantom").length > 0) ||
             // Or beyond the first position in a placeholder node.
             (pos[1] > 0 && $node.closest("._placeholder").length > 0)))
            continue;

        // Make sure the position makes sense form an editing
        // standpoint.
        if (pos[0].nodeType === Node.ELEMENT_NODE) {
            var next_node = pos[0].childNodes[pos[1]];
            if (next_node === undefined || // end of element
                // We do not stop in front of element nodes.
                next_node.nodeType === Node.ELEMENT_NODE)
                continue; // can't stop here
        }

        // This is symptomatic of some browsers that won't
        // allow the caret in some positions. If we were to go
        // ahead with this, the caret would be effectvely
        // trapped in this position. So we have to continue.
        if (!this._canSetCaretHere(pos))
            continue;

        // If we get here, the position is good!
        break;
    }

    if (pos !== null)
        this.setCaret(pos[0], pos[1]);
};

Editor.prototype.moveCaretLeft = function () {
    this._removeFakeCaret();
    var pos = this._getRawCaret();
    if (pos === undefined || pos === null)
        return; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos[0]).closest("._gui").get(0);
    if (closest_gui !== undefined) {
        pos = pos.slice(); // clone it first
        pos[1] = Array.prototype.indexOf.call(
            closest_gui.parentNode.childNodes, closest_gui);
        pos[0] = closest_gui.parentNode;
    }

    while(true)
    {
        pos = domutil.prevCaretPosition(pos, this.gui_root, false);
        if (pos === null)
            break;

        var $node = $(pos[0]);
        closest_gui = $node.closest("._gui").get(0);
        if (closest_gui !== undefined) {
            // Stopping in a gui element is fine, but normalize
            // the position to the start of the gui element.
            pos = [closest_gui, 0];
            break;
        }

        var $closest_ph = $node.closest("._placeholder");
        if ($closest_ph.length > 0) {
            // Stopping in a placeholder is fine, but normalize
            // the position to the start of the text.
            pos[0] = $closest_ph.get(0).childNodes[0];
            pos[1] = 0;
            break;
        }

        // Can't stop inside a phantom node.
        if ($node.closest("._phantom").length > 0)
            continue;

        // Make sure the position makes sense form an editing
        // standpoint.
        if (pos[0].nodeType === Node.ELEMENT_NODE) {
            var prev_node = pos[0].childNodes[pos[1] - 1];
            if (prev_node === undefined ||
                // We do not stop at the back of elements
                prev_node.nodeType === Node.ELEMENT_NODE)
                continue; // can't stop here
        }

        // This is symptomatic of some browsers that won't allow the
        // caret in some positions. If we were to go ahead with this,
        // the caret would be effectvely trapped in this position. So
        // we have to continue.
        if (!this._canSetCaretHere(pos))
            continue;

        // If we get here, the position is good!
        break;
    }

    if (pos !== null)
        this.setCaret(pos[0], pos[1]);
};

Editor.prototype._canSetCaretHere = function (pos) {
    var r = rangy.createRange();
    r.setStart(pos[0], pos[1]);
    var sel = this.getSelection();
    // Save the range before doing this so that we can restore it.
    // Note that rangy won't help here because it will insert a span
    // and mess up our caret position.
    var saved = sel.rangeCount && sel.getRangeAt(0);
    var ret;
    try {
        sel.setSingleRange(r);
        var r2 = sel.rangeCount > 0 && sel.getRangeAt(0);

        ret = (r2 && r2.startContainer === pos[0] &&
               r2.startOffset === pos[1]);
    }
    finally {
        if (saved)
            sel.setSingleRange(saved);
        else
            sel.removeAllRanges();
    }
    return ret;
};


Editor.prototype.setCaret = function (node, offset, force_fake) {
    this._syncDisplay();
    this._removeFakeCaret();
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    var r = rangy.createRange();
    r.setStart(node, offset);
    var sel = this.getSelection();
    sel.setSingleRange(r);

    // Check whether the position "took".
    var r2 = sel.rangeCount > 0 && sel.getRangeAt(0);
    if (force_fake || !r2 || !r2.equals(r)) {
        sel.removeAllRanges(); // Clear the selection
        // We set a fake caret.
        this._setFakeCaretTo(node, offset);
    }
    this._caretChangeEmitter();
};

Editor.prototype._setFakeCaretTo = function (node, offset) {
    this._fake_caret = [node, offset];
    this._refreshFakeCaret();
};

Editor.prototype._removeFakeCaret = function () {
    this._fake_caret = undefined;
    this._refreshFakeCaret();
};

Editor.prototype._refreshFakeCaret = function () {
    this._syncDisplay();
    $(this.caret_layer).empty();
    if (!this._fake_caret)
        return;

    var node = this._fake_caret[0];
    var offset = this._fake_caret[1];

    // If we are in a _gui element, then the element itself changes to
    // show the caret position.
    if ($(node).closest("._gui").length > 0)
        return;

    var $mark =
            $("<span style='height: 100%; display: inline-block; " +
              "font-size: inherit;'>&nbsp;</span>");
    var mark = $mark.get(0);

    try {
        this._refreshing_caret++;
        switch (node.nodeType)
        {
        case Node.TEXT_NODE:
            var parent = node.parentNode;
            var prev = node.previousSibling;
            var next = node.nextSibling;
            domutil.insertIntoText(node, offset, mark);
            break;
        case Node.ELEMENT_NODE:
            node.insertBefore(mark, node.childNodes[offset]);
            break;
        default:
            throw new Error("unexpected node type: " + node.nodeType);
        }

        var position = $mark.position();
        var height = $mark.height();

        if (node.nodeType === Node.TEXT_NODE) {
            // node was deleted form the DOM tree by the insertIntoText
            // operation, wee need to bring it back.

            // We delete everthing after what was prev to the original
            // node, and before what was next to it.
            var delete_this = prev ? prev.nextSibling : parent.firstChild;
            while(delete_this !== next) {
                parent.removeChild(delete_this);
                delete_this = prev ? prev.nextSibling : parent.firstChild;;
            }
            parent.insertBefore(node, next);
        }
        else
            $mark.remove();
    }
    finally {
        this._syncDisplay();
        this._refreshing_caret--;
    }


    this._$fake_caret.css("top", position.top);
    this._$fake_caret.css("left", position.left);
    this._$fake_caret.css("height", height);
    this._$fake_caret.css("max-height", height);
    this._$fake_caret.css("min-height", height);
    $(this.caret_layer).append(this._$fake_caret);
};

Editor.prototype._keydownHandler = function (e, jQthis) {
    this.$gui_root.trigger('wed-input-trigger-keydown', [e, jQthis]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return;

    this.$gui_root.trigger('wed-global-keydown', [e, jQthis]);
};

Editor.prototype._globalKeydownHandler = function (wed_event, e, jQthis) {
    // These are things like the user hitting Ctrl, Alt, Shift, or
    // CapsLock, etc. Return immediately.
    if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0)
        return true;

    if (true) {
        if (e.which === 113)
            console.log($(this.getDataCaret()[0]).closest("._real"));
    }

    function terminate() {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
        if (key_constants.RIGHT_ARROW.matchesEvent(e)) {
            this._undo.endAllGroups();
            this.moveCaretRight();
            return terminate();
        }
        else if (key_constants.LEFT_ARROW.matchesEvent(e)) {
            this._undo.endAllGroups();
            this.moveCaretLeft();
            return terminate();
        }
        return true;
    }
    else if (key_constants.CTRL_Z.matchesEvent(e)) {
        this.undo();
        return terminate();
    }
    else if (key_constants.CTRL_Y.matchesEvent(e)) {
        this.redo();
        return terminate();
    }
    else if (key_constants.CTRL_C.matchesEvent(e)) {
        return true;
    }
    else if (key_constants.CTRL_X.matchesEvent(e)) {
        return true;
    }
    else if (key_constants.SPACE.matchesEvent(e)) {
        // On Chrome we must handle it here.
        this._handleKeyInsertingText(e);
        return terminate();
    }
    else if (key_constants.CTRL_FORWARD_SLASH.matchesEvent(e) &&
             this._contextMenuHandler.call(this, e, jQthis) === false)
        return terminate();

    var range = this.getSelectionRange();

    // When a range is selected, we would replace the range with the
    // text that the user entered. Except that we do not want to do
    // that unless it is a clean edit. What's a clean edit?  It is an
    // edit which starts and end in the same element.
    if (range !== undefined) {
        if (range.startContainer === range.endContainer) {
            var ret = (range.startContainer.nodeType === Node.TEXT_NODE) ?
                    // Text node, we are uneditable if our parent is
                    // of the _phantom class.
                    !($(range.startContainer.parentNode).
                      hasClass('_phantom') ||
                      $(range.startContainer.parentNode).hasClass('_phantom_wrap')):
                // Otherwise, we are uneditable if any child is
                // ._phantom.
                !($(range.startContainer).find('._phantom') ||
                  $(range.startContainer).find('._phantom_wrap'));

            if (!ret)
                return terminate();
        }

        // If the two containers are elements, the startContainer
        // could be:
        //
        // - parent of the endContainer,
        // - child of the endContainer,
        // - sibling of the endContainer,

        if (!range.collapsed)
            return terminate();
    }

    var raw_caret = this._getRawCaret();

    // Damn hoisting
    var caret;
    if (raw_caret !== undefined) {
        var $placeholders = $(raw_caret[0]).closest('._placeholder');
        if ($placeholders.length > 0) {
            // We're in a placeholder, so...

            // Reminder: if the caret is currently inside a
            // placeholder getCaret will return a caret value just in
            // front of the placeholder.
            caret = this.getDataCaret();

            // A place holder could be in a place that does not allow
            // text. If so, then do not allow entering regular text in
            // this location.
            if (!util.anySpecialKeyHeld(e) &&
                !this.validator.possibleAt(caret[0], caret[1]).
                has(new validate.Event("text")))
                return terminate();

            // Swallow these events when they appen in a placeholder.
            if (util.anySpecialKeyHeld(e) ||
                key_constants.BACKSPACE.matchesEvent(e) ||
                key_constants.DELETE.matchesEvent(e))
                return terminate();
        }

        if ($(raw_caret[0]).hasClass('_phantom') ||
            $(raw_caret[0]).hasClass('_phantom_wrap')) {
            return terminate();
        }
    }

    if (key_constants.DELETE.matchesEvent(e)) {
        // Prevent deleting phantom stuff
        if (!$(domutil.nextCaretPosition(raw_caret, this.gui_root, true)[0])
            .is("._phantom, ._phantom_wrap")) {
            // We need to handle the delete
            caret = this.getDataCaret();
            // If the container is not a text node, we may still
            // be just AT a text node from which we can
            // delete. Handle this.
            if (caret[0].nodeType !== Node.TEXT_NODE)
                caret = [caret[0].childNodes[caret[1]], 0];

            if (caret[0].nodeType === Node.TEXT_NODE) {
                this._initiateTextUndo();
                this.data_updater.deleteText(caret[0], caret[1], 1);
                this._syncDisplay();
                this.setDataCaret(caret[0], caret[1]);
            }
        }
        return terminate();
    }

    if (key_constants.BACKSPACE.matchesEvent(e)) {
        // Prevent backspacing over phantom stuff
        if (!$(domutil.prevCaretPosition(raw_caret, this.gui_root, true)[0])
            .is("._phantom, ._phantom_wrap")) {
            // We need to handle the backspace
            caret = this.getDataCaret();

            // If the container is not a text node, we may still
            // be just behind a text node from which we can
            // delete. Handle this.
            if (caret[0].nodeType !== Node.TEXT_NODE)
                caret = [caret[0].childNodes[caret[1]],
                         caret[0].childNodes[caret[1]].length - 1];

            if (caret[0].nodeType === Node.TEXT_NODE) {
                var parent = caret[0].parentNode;
                var offset = Array.prototype.indexOf.call(parent.childNodes,
                                                          caret[0]);

                // At start of text, nothing to delete.
                if (caret[1] === 0)
                    return terminate();

                this._initiateTextUndo();
                this.data_updater.deleteText(caret[0], caret[1] - 1, 1);
                this._syncDisplay();
                // Don't set the caret inside a node that has been
                // deleted.
                if (caret[0].parentNode)
                    this.setDataCaret(caret[0], caret[1] - 1);
                else
                    this.setDataCaret(parent, offset);
            }
        }
        return terminate();
    }
    return true;
};

Editor.prototype._initiateTextUndo = function () {
    // Handle undo information
    var current_group = this._undo.getGroup();
    if (current_group === undefined)
        this._undo.startGroup(new wundo.TextUndoGroup("text", this,
                                                      this._undo, 10));
    else if (!(current_group instanceof wundo.TextUndoGroup))
        throw new Error("group not undefined and not a TextUndoGroup");
};

Editor.prototype._keypressHandler = function (e, jQthis) {
    // We always return false because we never want the default to
    // execute.
    this.$gui_root.trigger('wed-input-trigger-keypress', [e, jQthis]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return;

    this.$gui_root.trigger('wed-global-keypress', [e, jQthis]);
};

Editor.prototype._globalKeypressHandler = function (wed_event, e, jQthis) {
    var raw_caret = this._getRawCaret();
    if (raw_caret === undefined)
        return true;

    // On Firefox keypress events are generated for things like
    // hitting the left or right arrow. The which value is 0 in
    // these cases. On Chrome, hitting the left or right arrow
    // will generate keyup, keydown events but not keypress. Yay
    // for inconsistencies!
    if (!e.which)
        return true;

    // On Firefox the modifier keys will generate a keypress
    // event, etc. Not so on Chrome. Yay for inconsistencies!
    if (e.ctrlKey || e.altKey || e.metaKey)
        return true;

    this._handleKeyInsertingText(e);
    return false;
};

Editor.prototype._handleKeyInsertingText = function (e) {
    var caret = this._getRawCaret();

    var $container = $(caret[0]);
    var $placeholders = $container.closest('._placeholder');
    if ($placeholders.length > 0) {
        // Move our caret to just before the node before removing it.
        this.setCaret(this.getCaret());
        $placeholders.remove();
    }

    $placeholders = $container.children('._placeholder');
    if ($placeholders.length > 0)
        $placeholders.remove();

    this._initiateTextUndo();
    var text = String.fromCharCode(e.which);

    if (text === "") // Nothing needed
        return false;

    caret = this.getDataCaret();
    var insert_ret = this.data_updater.insertText(caret[0], caret[1], text);
    this._syncDisplay();
    this.setDataCaret(insert_ret[1], caret[1] + 1);
    e.preventDefault();
    e.stopPropagation();
};

Editor.prototype._mouseHandler = function (e) {
    if (e.type === "click") {
        this._undo.endAllGroups();

        if (this.menu_layer.childNodes.length > 0) {
            this.dismissContextMenu();
            return false; // This click does not do anything else.
        }
    }

    return true;
};

Editor.prototype._menuHandler = function (e, jQthis) {
    var $jQthis = $(jQthis);
    function findFocus(going_down) {
        var $ret = $jQthis.find('a:focus');
        if ($ret.length > 0)
            return $ret;

        // Take the first or last element displayed.
        if (going_down) {
            $jQthis.find('li').each(function () {
                var $this = $(this);
                if ($this.position().top >= 0) {
                    // We need to return the element which is before the
                    // one to receive focus.
                    $ret = $this.prev().children('a');
                    return false;
                }

                return true;
            });

        }
        else {
            var height = $jQthis.innerHeight();
            // We start from the bottom for this.
            $($jQthis.find('li').get().reverse()).each(function () {
                var $this = $(this);
                if ($this.position().top + $this.height() <= height) {
                    // We need to return the element which is after the
                    // one to receive focus.
                    $ret = $this.next().children('a');
                    return false;
                }

                return true;
            });
        }

        return $ret;
    }

    if (e.type === "menuselect") {
        this.dismissContextMenu();
        return false;
    }
    else if (e.type === "mouseenter") {
        $jQthis.focus();
        return false;
    }
    else if (e.type === "keydown") {
        var $focus;
        switch(e.keyCode) {
        case 27: // ESC
            this.dismissContextMenu();
            break;
        case 13: // Enter
        case 32: // Space
            $focus = $jQthis.find('a:focus');
            if ($focus.length > 0)
                $focus.click();
            else
                $jQthis.data('wed-hover').click();
            this.dismissContextMenu();
            break;
        case 38: // Up
            $focus = findFocus(false);
            if ($focus.length > 0)
                $focus.parent('li').prev().find('a').focus();
            else
                $jQthis.find('a').last().focus();
            break;
        case 40: // Down
            $focus = findFocus(true);
            if ($focus.length > 0)
                $focus.parent('li').next().find('a').focus();
            else
                $jQthis.find('a').first().focus();
            break;
        }
        return false;
    }

    return true;
};

/**
 *
 * This method returns the current position of the caret. However, in
 * sanitizes its return value to avoid providing positions where
 * inserting new elements or text is not allowed. One prime example of
 * this would be inside of a _placeholder or a _gui element.
 *
 * @returns {Array.<Integer>} The returned value is an array of size
 * two which has for first element the node where the caret is located
 * and for second element the offset into this node. The pair of node
 * and offset is to be interpreted as the same way it is interpreted
 * for DOM ranges. Callers must not change the value they get.
 */
Editor.prototype.getCaret = function () {
    this._syncDisplay();
    // Caret is unset
    var raw_caret = this._getRawCaret();
    if (raw_caret === undefined)
        return undefined;

    return this.normalizeCaret(raw_caret);
};

Editor.prototype.normalizeCaret = function (node, offset) {
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    var pg = $(node).closest("._placeholder, ._gui").get(0);
    // We are in a placeholder or gui node, make the caret be
    // the parent of the this node.
    if (pg !== undefined) {
        var parent = pg.parentNode;
        return [parent,
                Array.prototype.indexOf.call(parent.childNodes, pg)];
    }

    return [node, offset];
};

Editor.prototype._getRawCaret = function () {
    // Make sure the caret is not stale.
    this._syncDisplay();
    if (!this._raw_caret)
        return undefined;
    return this._raw_caret.slice();
};

Editor.prototype.fromDataCaret = function (node, offset) {
    return this._gui_updater.fromDataCaret(node, offset);
};

Editor.prototype.toDataCaret = function(node, offset) {
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }

    var normalized = this.normalizeCaret(node, offset);
    node = normalized[0];
    offset = normalized[1];

    var data_node;
    if (node.nodeType === Node.TEXT_NODE) {
        data_node = domutil.pathToNode(this.$data_root.get(0),
                                       this.nodeToPath(node));
        return [data_node, offset];
    }

    if (offset >= node.childNodes.length) {
        data_node = domutil.pathToNode(this.$data_root.get(0),
                                       this.nodeToPath(node));
        return [data_node, data_node.childNodes.length];
    }

    var child = node.childNodes[offset];
    if ($(child).is("._placeholder, ._gui, ._wed_caret")) {
        var $prev = $(node.childNodes[offset]).prev(
            ":not(._placeholder, ._gui, ._wed_caret)");
        if ($prev.length === 0) {
            data_node = domutil.pathToNode(this.$data_root.get(0),
                                           this.nodeToPath(node));
            return [data_node, 0];
        }

        data_node = domutil.pathToNode(this.$data_root.get(0),
                                       this.nodeToPath($prev.get(0)));
        return [data_node.parentNode,
                Array.prototype.indexOf.call(
                    data_node.parentNode.childNodes, data_node) + 1];
    }

    data_node = domutil.pathToNode(this.$data_root.get(0),
                                   this.nodeToPath(child));
    return [data_node.parentNode,
            Array.prototype.indexOf.call(data_node.parentNode.childNodes,
                                         data_node)];
};

Editor.prototype.getDataCaret = function () {
    var caret = this.getCaret();
    if (caret === undefined)
        return undefined;
    return this.toDataCaret(caret);
};

Editor.prototype.setDataCaret = function (node, offset) {
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }
    this.setCaret(this.fromDataCaret(node, offset));
};


Editor.prototype.getCaretAsPath = function () {
    var caret = this.getCaret();
    return [this.nodeToPath(caret[0]), caret[1]];
};

Editor.prototype.setCaretAsPath = function (caret) {
    var real_caret = [this.pathToNode(caret[0]), caret[1]];
    this.setCaret(real_caret);
};

Editor.prototype.getDataCaretAsPath = function () {
    var caret = this.getDataCaret();
    return [domutil.nodeToPath(this.$data_root.get(0), caret[0]), caret[1]];
};

Editor.prototype.setDataCaretAsPath = function (caret) {
    var real_caret = [domutil.pathToNode(this.$data_root.get(0), caret[0]),
                      caret[1]];
    this.setDataCaret(real_caret);
};

Editor.prototype.toDataNode = function (node) {
    return domutil.pathToNode(this.$data_root.get(0), this.nodeToPath(node));
};


Editor.prototype._caretChangeEmitter = function (ev) {
    if (ev === undefined)
        ev = {which: undefined, type: undefined, target: undefined};

    // We need this rigmarole because on Chrome 28 the caret won't be
    // set to its new position on a "mouseup" or "click" event until
    // *after* the event handler has run!!!
    if (ev.type === "mouseup" || ev.type === "click")
        window.setTimeout(this._caretChangeEmitterTimeout.bind(this, ev), 1);
    else
        this._caretChangeEmitterTimeout(ev);
};

Editor.prototype._caretChangeEmitterTimeout = function (ev) {
    if (ev.type === "mouseup") {
        // Clicking always remove a fake caret element.
        this._removeFakeCaret();

        var r; // damn hoisting

        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if ($(ev.target).closest("._placeholder").length > 0) {
            r = rangy.createRange();
            r.setStart(ev.target, 0);
            this.getSelection().setSingleRange(r);
        }

        // If clicked inside a gui element, normalize the caret to the
        // start of that element.
        var closest_gui = $(ev.target).closest("._gui").get(0);
        if (closest_gui)
            this.setCaret(closest_gui, 0);
    }

    var selection = this.getSelection();
    var focus_node;
    var focus_offset;

    if (this._fake_caret) {
        focus_node = this._fake_caret[0];
        focus_offset = this._fake_caret[1];
    }
    else if (selection.rangeCount > 0) {
        focus_node = selection.focusNode;
        focus_offset = selection.focusOffset;
    }

    // No selection
    if (focus_node === undefined || focus_node === null)
        return;

    if (this._raw_caret === undefined ||
        this._raw_caret[0] !== focus_node ||
        this._raw_caret[1] !== focus_offset) {
        var old_caret = this._raw_caret;
        this._raw_caret = [focus_node, focus_offset];
        var ev_node = (focus_node.nodeType === Node.ELEMENT_NODE)?
                focus_node: focus_node.parentNode;

        $(ev_node).trigger("caretchange", [this._raw_caret, old_caret]);
    }
};

Editor.prototype._caretChangeHandler = function (e, caret, old_caret) {
    $(this.gui_root).find("._owns_caret").removeClass("_owns_caret");
    var $node = $((caret[0].nodeType === Node.ELEMENT_NODE)?
                  caret[0]: caret[0].parentNode);
    $node.addClass("_owns_caret");
    if ($node.closest("._gui").length > 0)
        $node.click();
    var $old_gui = (old_caret !== undefined) ?
            $(old_caret[0]).closest("._gui"):$();
    if ($old_gui.length > 0)
        $old_gui.trigger("unclick");
};

Editor.prototype.dismissContextMenu = function () {
    // We may be called when there is no menu active.
    if (this.menu_layer.childNodes.length > 0) {
        $(this.menu_layer).empty();
        this.popSelection();
    }
};

/**
 * @param items Must be a sequence of <li> elements that will form the
 * menu. The actual data type can be anything that jQuery() accepts.
 */
Editor.prototype.displayContextMenu = function (x, y, items) {
    this.dismissContextMenu();
    var $dropdown = $("<div class='dropdown'>");
    var $menu = $("<ul tabindex='0' class='dropdown-menu' role='menu'>");
    $dropdown.append($menu);
    $menu.css("overflow-y", "auto");
    $dropdown.css("top", y);
    $dropdown.css("left", x);
    // The menu layer overlays the $gui_root so we can calculate the
    // dimensions relative to it.
    var position = this.$gui_root.position();
    var height = this.$gui_root.height();
    // Subtract the gui_root-relative position from the total height
    // of the gui_root.
    $menu.css("max-height", height - (y - position.top));

    $menu.append($(items));

    $(this.menu_layer).prepend($dropdown);
    $menu.dropdown('toggle');
    $menu.on('keydown mouseleave mouseenter',
             util.eventHandler(this._menuHandler.bind(this)));
    $menu.find('a').hover(function () {
        $menu.data('wed-hover', this);
    });
    this.pushSelection();
    $menu.focus();
};

Editor.prototype.pushSelection = function () {
    var range = this.getSelection();
    if (range !== undefined)
        this._selection_stack.push(rangy.saveSelection(this.my_window));
    else
        this._selection_stack.push(this._getRawCaret());
};

Editor.prototype.popSelection = function () {
    var it = this._selection_stack.pop();
    if (it instanceof Array)
        this.setCaret(it);  // setCaret() will call _caretChangeEmitter.
    else if (it !== undefined) {
        rangy.restoreSelection(it);
        // Call with a minimal object
        this._caretChangeEmitter();
    }
    else
        // Null value means there was no selection, ergo...
        this.clearSelection();
};

Editor.prototype.clearSelection = function () {
    this._removeFakeCaret();
    this._raw_caret = undefined;
    this.getSelection().removeAllRanges();
};

Editor.prototype.getSelection = function () {
    return rangy.getSelection(this.my_window);
};

Editor.prototype.getSelectionRange = function () {
    return domutil.getSelectionRange(this.my_window);
};

Editor.prototype.setSelectionRange = function (range) {
    this.getSelection().setSingleRange(range);
    this.setCaret(range.startContainer, range.startOffset);
};

Editor.prototype.getDataSelectionRange = function () {
    var range = this.getSelectionRange();
    var data_range = rangy.createRange();
    var start_caret = this.toDataCaret(range.startContainer, range.startOffset);
    data_range.setStart(start_caret[0], start_caret[1]);
    if (!range.collapsed) {
        var end_caret = this.toDataCaret(range.endContainer, range.endOffset);
        data_range.setEnd(end_caret[0], end_caret[1]);
    }
    return data_range;
};

Editor.prototype.setDataSelectionRange = function (range) {
    var gui_range = rangy.createRange();
    var start_caret = this.fromDataCaret(range.startContainer, range.startOffset);
    gui_range.setStart(start_caret[0], start_caret[1]);
    if (!range.collapsed) {
        var end_caret = this.fromDataCaret(range.endContainer, range.endOffset);
        gui_range.setEnd(end_caret[0], end_caret[1]);
    }
    this.setSelectionRange(gui_range);
};


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
    var error = ev.error;
    var element = ev.element;

    if (element.id === "")
        element.id = util.newGenericID();

    // Turn the expanded names back into qualified names.
    var names = error.getNames();
    for(var ix = 0; ix < names.length; ++ix) {
        names[ix] = this.resolver.unresolveName(names[ix].ns, names[ix].name);
    }

    var $item = $("<li><a href='#" + element.id + "'>" +
                  error.toStringWithNames(names) + "</li>");
    this.$error_list.append($item);
};

Editor.prototype._onResetErrors = function (ev) {
    this.$error_list.children("li").slice(ev.at).remove();
};

Editor.prototype.nodeToPath = function (node) {
    return domutil.nodeToPath(this.gui_root, node);
};

Editor.prototype.pathToNode = function (path) {
    return domutil.pathToNode(this.gui_root, path);
};

Editor.prototype.makeModal = function () {
    var ret = new modal.Modal();
    this.$widget.prepend(ret.getTopLevel());
    return ret;
};

Editor.prototype.getModeData = function (key) {
    return this._mode_data[key];
};

Editor.prototype.setModeData = function (key, value) {
    this._mode_data[key] = value;
};

Editor.prototype.destroy = function () {
    if (this._destroyed)
        return;

    //
    // This is imperfect but the goal here is to do as much work as
    // possible, even if things have not been initialized fully.
    //
    // The last recorded exception will be rethrown at the end.
    //
    var recorded;
    try {
        if (this.gui_domlistener !== undefined)
            this.gui_domlistener.stopListening();
    } catch(ex) { recorded = ex; }


    try {
        if (this.validation_domlistener !== undefined)
            this.validation_domlistener.stopListening();
    } catch(ex) { recorded = ex; }


    // These ought to prevent jQuery leaks.
    try {
        var $gui_root = this.$gui_root;
        $gui_root.off();
        $gui_root.removeData();
        $gui_root.empty();
        this.$frame.find('*').off('.wed');
        // This will also remove the unload handler.
        $(this.my_window).off('.wed');
    } catch (ex) { recorded = ex; }

    try {
        if (this.validator)
            this.validator.stop();
    } catch (ex) { recorded = ex; }

    // Trash our variables: this will likely cause immediate
    // failure if the object is used again.
    Object.keys(this).forEach(function (x) {
        this[x] = undefined;
    }.bind(this));

    // ... but keep these two. Calling destroy over and over is okay.
    this._destroyed = true;
    this.destroy = function () {};

    if (recorded !== undefined)
        throw recorded;
};

//
// This function changes the DOM tree temporarily. There does not seem
// to be a reliable portable way to get the position of a range
// otherwise.
//
// THIS MESSES UP THE RANGE! That is, the value of range after is
// going to be different from before.
//

Editor.prototype._rangeToPixelPosition = function() {
    var saved = rangy.saveSelection(this.my_window);

    // We must grab the range after rangy.saveSelection() has been
    // called because rangy.saveSelection() modifies the DOM and thus
    // makes any selection recorded earlier invalid.
    var selection = this.getSelection();
    var range = this.getSelectionRange().cloneRange();
    var start_is_focus = ((selection.focusNode === range.startContainer) && (selection.focusOffset === range.startOffset));
    range.collapse(start_is_focus);

    var ret;
    var container = range.startContainer;
    var $marker = $("<span/>");
    switch(container.nodeType) {
    case Node.TEXT_NODE:
        // We have to temporarily break the node into two text nodes
        // and put a marker between the two.
        var frag = document.createDocumentFragment();
        var start_node = document.createTextNode(container.nodeValue.slice(0, range.startOffset));
        var end_node = document.createTextNode(container.nodeValue.slice(range.startOffset));
        var marker = $marker.get(0);
        frag.appendChild(start_node);
        frag.appendChild(marker);
        frag.appendChild(end_node);
        var parent = container.parentNode;

        parent.replaceChild(frag, container);
        ret = $marker.position();
        parent.removeChild(start_node);
        parent.removeChild(marker);
        parent.replaceChild(container, end_node);
        break;
    case Node.ELEMENT_NODE:
        container.insertBefore($marker.get(0),
                               container.childNodes[range.startOffset]);
        ret = $marker.position();
        $marker.remove();
        break;
    default:
        throw new Error("unexpected node type while handling range; type: " +
                        container.nodeType);
    }
    rangy.restoreSelection(saved);
    return ret;
};

function unloadHandler(e) {
    e.data.editor.destroy();
}

exports.Editor = Editor;

});
