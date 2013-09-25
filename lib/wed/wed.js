/**
 * @module wed
 * @desc The main module for wed.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log = require("./log");
var saver = require("./saver");
var rangy = require("rangy");
var validator = require("./validator");
var Validator = validator.Validator;
var util = require("./util");
var name_resolver = require("./name_resolver");
var domutil = require("./domutil");
var mutation_domlistener = require("./mutation_domlistener");
var updater_domlistener = require("./updater_domlistener");
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
var context_menu = require("./gui/context_menu");
var exceptions = require("./exceptions");
var onerror = require("./onerror");
var key = require("./key");
var AbortTransformationException = exceptions.AbortTransformationException;
require("bootstrap");
require("jquery.bootstrap-growl");
require("./onbeforeunload");

var _indexOf = Array.prototype.indexOf;

exports.version = "0.10.0";
var version = exports.version;

var getOriginalName = util.getOriginalName;

function Editor() {
    // Call the constructor for our mixins
    SimpleEventEmitter.call(this);
    Conditioned.call(this);

    this._mode_data = {};
    this._development_mode = false;
    this._text_undo_max_length = 10;
    onerror.editors.push(this);
}

oop.implement(Editor, SimpleEventEmitter);
oop.implement(Editor, Conditioned);

Editor.prototype.init = log.wrap(function (widget, options) {
    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not
    // alter anything outside our frame.
    this.$frame = this.$widget.closest("html");
    this.my_window = this.$frame.get(0).ownerDocument.defaultView;
    onerror.register(this.my_window);

    // This enables us to override options.
    options = $.extend(true, {}, module.config(), options);

    this.name = options.name;

    if (options.ajaxlog)
        log.addURL(options.ajaxlog.url, options.ajaxlog.headers);

    this._save = options.save;
    // Records whether the first parse has happened.
    this._first_validation_complete = false;

    this._destroyed = false;

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
    this.data_root = this.$data_root.get(0);
    this.$data_root.css("display", "none");

    // Put the data_root into a document fragment to keep rangy happy.
    var frag = this.widget.ownerDocument.createDocumentFragment();
    frag.appendChild(this.data_root);

    domutil.linkTrees(this.data_root, this.gui_root);
    this.data_updater = new TreeUpdater(this.data_root);
    this._gui_updater = new GUIUpdater(this.gui_root, this.data_updater);
    this._undo_recorder = new UndoRecorder(this, this.data_updater);

    if (this._save && this._save.url) {
        this._saver = new saver.Saver(this._save.url, this._save.headers,
                                      version, this.data_updater,
                                      this.data_root);
        this._saver.addEventListener("saved", this._onSaverSaved.bind(this));
        this._saver.addEventListener("failed", this._onSaverFailed.bind(this));
    }
    else
        log.error("wed cannot save data due to the absence of a save_url option");

    this.$gui_root.wrap('<div class="row"><div id="wed-frame" class="col-lg-10 col-md-10 col-sm-10"><div class="row"/></div></div>');
    this.$sidebar = $('<div id="sidebar" class="col-lg-2 col-md-2 col-sm-2"/>');
    this.$widget.find('.row').first().prepend(this.$sidebar);
    // Needed by Validator
    this.$gui_root.parent().before("<div class='row'><div class='progress'><span></span><div id='validation-progress' class='progress-bar' style='width: 0%'></div></div></div>");
    this.$validation_progress = this.$widget.find("#validation-progress");
    this.$validation_message = this.$validation_progress.prev('span');

    // We duplicate data-parent on the toggles and on the collapsible
    // elements due to a bug in Bootstrap 3.0.0 RC2. See
    // https://github.com/twbs/bootstrap/issues/9933.
    this.$sidebar.append('\
<div id="sidebar-panel" class="panel-group wed-sidebar-panel">\
 <div class="panel">\
  <div class="panel-heading">\
   <div class="panel-title">\
    <a class="accordion-toggle" data-toggle="collapse" data-parent="#sidebar-panel" href="#sb-nav-collapse">Navigation</a>\
   </div>\
  </div>\
  <div id="sb-nav-collapse" data-parent="#sidebar-panel" class="panel-collapse collapse in">\
   <div id="sb-nav" class="panel-body">\
    <ul id="navlist" class="nav nav-list">\
     <li class="inactive">A list of navigation links will appear here</li>\
    </ul>\
   </div>\
  </div>\
 </div>\
 <div class="panel">\
  <div class="panel-heading">\
   <div class="panel-title">\
    <a class="accordion-toggle" data-toggle="collapse" data-parent="#sidebar-panel" href="#sb-errors-collapse">Errors</a>\
   </div>\
  </div>\
  <div id="sb-errors-collapse" data-parent="#sidebar-panel" class="panel-collapse collapse">\
   <div id="sb-errors" class="panel-body">\
    <ul id="sb-errorlist" class="nav nav-list wed-errorlist">\
     <li class="inactive"></li>\
    </ul>\
   </div>\
  </div>\
 </div>\
</div>');

    this._current_dropdown = undefined;

    this._$fake_caret = $("<span class='_wed_caret' contenteditable='false'> </span>");
    this._$input_field = $("<input class='wed-comp-field' type='text'></input>");
    this._fake_caret = undefined;
    this._refreshing_caret = 0;

    this._$caret_layer = $("<div class='wed-caret-layer'>");
    this._$caret_layer.append(this._$input_field);
    this._caret_layer = this._$caret_layer[0];
    this.$gui_root.before(this._caret_layer);

    this.alert_layer = $("<div class='wed-alert-layer'><div class='wed-alert-layer-contents'></div></div>").get(0);
    this.$gui_root.before(this.alert_layer);
    this.alert_layer_contents = this.alert_layer.childNodes[0];

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

    this.help_modal = this.makeModal();
    this.help_modal.setTitle("Help");
    this.help_modal.setBody(
        "<ul>\
          <li>Clicking the right mouse button on the document contents brings up a contextual menu.</li>\
          <li>Clicking the right mouse button on the links in the navigation panel brings up a contextual menu.</li>\
          <li>F1: help</li>\
          <li>Ctrl-S: Save</li>\
          <li>Ctrl-X: Cut</li>\
          <li>Ctrl-V: Paste</li>\
          <li>Ctrl-C: Copy</li>\
          <li>Ctrl-Z: Undo</li>\
          <li>Ctrl-Y: Redo</li>\
          <li>Ctrl-/: Bring up a contextual menu.</li>\
        </ul>");
    this.help_modal.addButton("Close", true);

    this.$navigation_list = this.$widget.find("#navlist");

    this._raw_caret = undefined;
    this._sel_anchor = undefined;
    this._sel_focus = undefined;

    this._selection_stack = [];

    // XXX this should probably go and be replaced by a check to make
    // sure bootstrap.css or a variant has been loaded. (Or
    // configurable to load something else than the minified version?)
    var fontawesome_css = require.toUrl("font-awesome/css/font-awesome.min.css");
    this.$frame.children("head").prepend('<link rel="stylesheet" href="' +
                                         fontawesome_css +
                                         '" type="text/css" />');
    var bootstrap_css = require.toUrl("bootstrap/../../css/bootstrap.min.css");
    this.$frame.children("head").prepend('<link rel="stylesheet" href="' +
                                         bootstrap_css +
                                         '" type="text/css" />');

    // This domlistener is used only for validation.
    this.validation_domlistener =
        new mutation_domlistener.Listener(this.$data_root);

    // This domlistener is used for everything else
    this.gui_domlistener = new updater_domlistener.Listener(this.gui_root,
                                                            this._gui_updater);
    // Setup the cleanup code.
    $(this.my_window).on('unload.wed', { editor: this }, unloadHandler);
    $(this.my_window).on('popstate', function (ev) {
        if (document.location.hash === "") {
            this.$gui_root.scrollTop(0);
        }
    }.bind(this));

    this._last_done_shown = 0;
    this.$error_list = this.$widget.find("#sb-errorlist");
    this._validation_errors = [];

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
});

Editor.prototype.setMode = log.wrap(function (mode_path, options) {
    var onload = function (mode_module) {
        mode_module.Mode.optionResolver(
            options,
            function (resolved_opts) {
            this.onModeChange(new mode_module.Mode(resolved_opts));
        }.bind(this));
    }.bind(this);

    require([mode_path], onload, function (err) {

        if (mode_path.indexOf("/") !== -1)
            // It is an actual path so don't try any further loading
            throw new Error("can't load mode " + mode_path);

        var path = "./modes/" + mode_path + "/" + mode_path;
        require([path], onload,
                function (err) {
            require([path + "_mode"], onload);
        });
    });
});

Editor.prototype.onModeChange = log.wrap(function (mode) {
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

    this.$gui_root.attr("tabindex", "-1");
    this.$gui_root.focus();

    this.resolver = mode.getAbsoluteResolver();
    this.validator = new Validator(this.options.schema, this.data_root);
    this.validator.addEventListener(
        "state-update", this._onValidatorStateChange.bind(this));
    this.validator.addEventListener(
        "error", this._onValidatorError.bind(this));
    this.validator.addEventListener(
        "reset-errors", this._onResetErrors.bind(this));

    this.validator.initialize(this._postInitialize.bind(this));
});

Editor.prototype._postInitialize = log.wrap(function  () {
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

    this.decorator = this.mode.makeDecorator(this.gui_domlistener,
                                             this, this._gui_updater);

    this.decorator.addHandlers();

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

    // If an element is edited and contains a placeholder, delete
    // the placeholder
    this._updating_placeholder = 0;
    this.gui_domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap",
        function ($root, $added, $removed, $prev, $next, $target) {
        if (this._updating_placeholder)
            return;
        this._updating_placeholder++;
        try {
            var $to_consider = $target.contents().filter(function () {
                return jqutil.textFilter.call(this) ||
                    $(this).is('._real, ._phantom._text, ._phantom_wrap');
            });
            var ph;
            // Narrow it to the elements we care about.
            if ($to_consider.length === 0 ||
                ($to_consider.length === 1 && $to_consider.is($removed))) {
                if ($target.children("._placeholder").length !== 0)
                    return;
                var target = $target.get(0);
                var nodes = this.mode.nodesAroundEditableContents(target);
                ph = this.mode.makePlaceholderFor(target).get(0);
                this._gui_updater.insertBefore(target, ph, nodes[1]);
            }
            else {
                ph = $target.children("._placeholder").not("._transient")[0];
                if (ph)
                    this._gui_updater.removeNode(ph);
            }
        }
        finally {
            this._updating_placeholder--;
        }
    }.bind(this));

    this.gui_domlistener.addHandler(
        "included-element",
        "._real, ._phantom_wrap",
        function ($root, $tree, $parent, $prev, $next, $target) {
        if (this._updating_placeholder)
            return;

        if ($target.children("._placeholder").length !== 0)
            return;

        this._updating_placeholder++;
        try {
            var $to_consider = $target.contents().filter(function () {
                return jqutil.textFilter.call(this) ||
                    $(this).is('._real, ._phantom._text, ._phantom_wrap');
            });
            if ($to_consider.length === 0) {
                var target = $target.get(0);
                var nodes = this.mode.nodesAroundEditableContents(target);
                var ph = this.mode.makePlaceholderFor(target).get(0);
                this._gui_updater.insertBefore(target, ph, nodes[1]);
            }
        }
        finally {
            this._updating_placeholder--;
        }

    }.bind(this));


    this.gui_domlistener.addHandler(
        "excluded-element",
        "*",
        function ($root, $tree, $parent, $prev, $next, $element) {
        // Mark our placeholder as dying.
        if ($element.is("._placeholder"))
            $element.addClass("_dying");

        if (!this._raw_caret)
            return; // no caret to move

        var container = this._raw_caret[0];
        var $container = $(container);
        if ($container.closest($element).length > 0) {
            var parent = $parent.get(0);
            // We must move the caret to a sane position.
            if ($prev.length > 0 && $prev.closest($root).length > 0 &&
                $parent.closest($root).length > 0)
                this.setCaret(parent, _indexOf.call(parent.childNodes,
                                                    $prev.get(0)) + 1);
            else if ($next.length > 0 && $next.closest($root).length > 0 &&
                     $parent.closest($root).length > 0)
                this.setCaret(parent,
                              _indexOf.call(parent.childNodes, $next.get(0)));
            else if ($parent.closest($root).length > 0)
                this.setCaret(parent, parent.childNodes.length);
            else {
                // There's nowhere sensible to put it at
                this._removeFakeCaret();
                this._raw_caret = undefined;
            }
        }
    }.bind(this));

    this.decorator.startListening(this.$gui_root);

    this.$gui_root.on('wed-global-keydown',
                      this._globalKeydownHandler.bind(this));

    this.$gui_root.on('wed-global-keypress',
                      this._globalKeypressHandler.bind(this));

    this.$gui_root.on('keydown', this._keydownHandler.bind(this));
    this.$gui_root.on('keypress', this._keypressHandler.bind(this));

    this._$input_field.on('keydown', this._keydownHandler.bind(this));
    this._$input_field.on('keypress', this._keypressHandler.bind(this));

    this._$input_field.on('compositionstart compositionupdate compositionend',
                      this._compositionHandler.bind(this));
    this._$input_field.on('input', this._inputHandler.bind(this));

    this._$input_field.on('keyup', this._caretChangeEmitter.bind(this));

    // No click in the next binding because click does not
    // distinguish left, middle, right mouse buttons.
    this.$gui_root.on('mouseup', this._caretChangeEmitter.bind(this));
    this.$gui_root.on('mousedown',this._mousedownHandler.bind(this));
    this.$gui_root.on('caretchange',
                      this._caretChangeHandler.bind(this));

    // Give the boot to the default handler.
    this.$gui_root.on('contextmenu', false);
    this._$caret_layer.on('contextmenu', false);

    this.$gui_root.on('paste', log.wrap(this._pasteHandler.bind(this)));

    this.$gui_root.on('cut', log.wrap(this._cutHandler.bind(this)));
    $(this.my_window).on('resize.wed', this._resizeHandler.bind(this));

    this.$gui_root.on('focus', log.wrap(function (ev) {
        this._focusInputField();
        ev.preventDefault();
        ev.stopPropagation();
    }.bind(this)));

    this.$gui_root.on('click', 'a', function (ev) {
        if (ev.ctrlKey)
            window.location = ev.currentTarget.href;
        else
            this._caretChangeEmitter();
        return false;
    }.bind(this));

    // This is a guard to make sure that mousemove handlers are
    // removed once the button is up again.
    $('body').on('mouseup', function (ev) {
        this.$gui_root.off('mousemove.wed');
    }.bind(this));

    this._$caret_layer.on("mousedown mouseup click",
                         this._caretLayerMouseHandler.bind(this));

    // Make ourselves visible.
    this.$widget.removeClass("loading");
    this.$widget.css("display", "block");

    var ns_mapping;
    if (this.gui_root.childNodes.length === 0) {
        var namespaces = this.validator.getNamespaces();

        // Drop the xml namespace, because we don't need to define
        // it. It will appear at most once in the array.
        var xml = namespaces.indexOf(name_resolver.XML1_NAMESPACE);
        if (xml >= 0)
            namespaces.splice(xml, 1);

        ns_mapping = Object.create(null);
        if (namespaces.length === 1)
            // Just make this namespace the default one
            ns_mapping[""] = namespaces[0];
        else {
            namespaces.forEach(function (ns) {
                var pre = this.resolver.prefixFromURI(ns);
                if (pre !== undefined)
                    ns_mapping[pre] = ns;
            }.bind(this));
        }

        if (Object.keys(ns_mapping).length === 0) {
            // Ask the user
            var modal = this._namespace_modal;
            var body = ["<form>"];
            var ix = 0;
            namespaces.forEach(function (ns) {
                body.push("<label>", ns, "</label>");
                body.push('<input type="text" name="ns' + ix + '"/>');
                ix++;
            });
            body.push("</form>");
            var $body = $(body.join(""));
            modal.setBody($body);
            modal.modal(function () {
                ix = 0;
                namespaces.forEach(function (ns) {
                    ns_mapping[$body.find("[name=ns"+ ix + "]").val() ||
                               ""] = ns;
                    ix++;
                });
                this._postInitialize2(ns_mapping);
            }.bind(this));
            return;
        }
    }

    this._postInitialize2(ns_mapping);
});

Editor.prototype._postInitialize2 = log.wrap(function (ns_mapping) {
    if (ns_mapping) {
        var attrs = Object.create(null);
        Object.keys(ns_mapping).forEach(function (k) {
            this.resolver.definePrefix(k, ns_mapping[k]);
            if (k === "")
                attrs.xmlns = ns_mapping[k];
            else
                attrs["xmlns:" + k] = ns_mapping[k];
        }.bind(this));

        var evs = this.validator.possibleAt(this.data_root, 0).toArray();
        if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
            transformation.insertElement(
                this.data_updater, this.data_root, 0,
                this.resolver.unresolveName(evs[0].params[1],
                                            evs[0].params[2]),
                attrs);
        }
    }

    this.validator.start();

    this.gui_domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo = new undo.UndoList();
    this._setCondition("initialized", {editor: this});
});

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
    // This is necessary because our context menu saves/restores the
    // selection using rangy. If we move on without this call, then
    // the transformation could destroy the markers that rangy put in
    // and rangy will complain.
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
                var $node = $(node);
                // Convert the gui node to a data node
                if ($node.closest(this.$gui_root).length > 0) {
                    var path = this.nodeToPath(node);
                    node = this.data_updater.pathToNode(path);
                }
                else if ($node.closest(this.$data_root).length === 0)
                    throw new Error("node is neither in the gui tree nor "+
                                    "the data tree");
            }
            tr.handler(this, node, element_name, transformation_data);
            // Ensure that all operations that derive from this
            // transformation are done *now*.
        }
        catch(ex) {
            // We want to log it before we attempt to do anything else.
            if (!(ex instanceof AbortTransformationException))
                log.unhandled(ex);
            throw ex;
        }
        finally {
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
    try {
        this._undo_recorder.suppressRecording(true);
        this._undo.undo();
    }
    finally {
        this._undo_recorder.suppressRecording(false);
    }
};

Editor.prototype.redo = function () {
    try {
        this._undo_recorder.suppressRecording(true);
        this._undo.redo();
    }
    finally {
        this._undo_recorder.suppressRecording(false);
    }
};

Editor.prototype.dumpUndo = function () {
    console.log(this._undo.toString());
};

Editor.prototype.undoMarker = function (msg) {
    this.recordUndo(new wundo.MarkerUndo(msg));
};

Editor.prototype.undoingOrRedoing = function () {
    return this._undo.undoingOrRedoing();
};

Editor.prototype.resize = function () {
    this._resizeHandler();
};

Editor.prototype._resizeHandler = log.wrap(function () {
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
    var $parent = this.$widget.find("#wed-frame");
    var pheight = $parent.outerHeight(true);
    $parent.siblings().css("max-height", pheight).css("min-height", pheight).
        css("height", pheight);

    var $sp = this.$widget.find(".wed-sidebar-panel");
    $sp.css("max-height", pheight).css("min-height", pheight).
        css("height", pheight);

    var $panels = $sp.find(".panel");
    var $headings = $panels.children(".panel-heading");
    var hheight = 0;
    $headings.each(function () {
        var $this = $(this);
        hheight += $this.parent().outerHeight(true) -
            $this.parent().innerHeight();
        hheight += $this.outerHeight(true);
    });
    var max_panel_height = pheight - hheight;
    $panels.each(function () {
        var $this = $(this);
        $this.css("max-height", max_panel_height +
                  $this.children(".panel-heading").first().outerHeight(true));
    });
    var $body = $panels.find(".panel-body");

    $body.css("height", max_panel_height);
});

Editor.prototype._contextMenuHandler = function (e) {
    // If the caret is changing due to a click on a placeholder,
    // then put it inside the placeholder.
    var $ph = $(e.target).closest("._placeholder");
    if ($ph.length > 0)
        this.setCaret($ph.get(0).childNodes[0], 0);

    var caret = this._getRawCaret();
    // This can happen if the user does a left click before having
    // put the caret anywhere.
    if (!caret)
        return true;

    var selection = this.getDOMSelection();
    var range = this.getDOMSelectionRange();

    var originally_collapsed;
    if (range && !range.collapsed) {
        // Range not in our gui.
        if ($(range.startContainer).closest(this.gui_root).length === 0 ||
            $(range.endContainer).closest(this.gui_root).length === 0)
            return true;

        originally_collapsed = false;
        range = range.cloneRange();
        var start_is_focus = ((selection.focusNode === range.startContainer) &&
                              (selection.focusOffset === range.startOffset));
        range.collapse(start_is_focus);
        $node_of_interest = $(range.startContainer);
        offset = range.startOffset;
    }
    else {
        $node_of_interest = $(caret[0]);
        offset = caret[1];
        originally_collapsed = true;
    }

    var $node_of_interest;
    var offset;
    if ($node_of_interest.get(0).nodeType !== Node.ELEMENT_NODE) {
        var parent = $node_of_interest.parent().get(0);
        offset = _indexOf.call(parent.childNodes, $node_of_interest.get(0));
        $node_of_interest = $(parent);
    }

    // Move out of any placeholder
    var ph = $node_of_interest.closest("._placeholder").get(0);
    if (ph) {
        offset = _indexOf.call(ph.parentNode.childNodes, ph);
        $node_of_interest = $(ph.parentNode);
    }

    var menu_items = [];
    var $data_node_of_interest;
    if (!$node_of_interest.hasClass("_phantom") &&
        // Should not be part of a gui element.
        $node_of_interest.parent("._gui").length === 0) {

        // We want the data node, not the gui node.
        $data_node_of_interest = $(
            this.data_updater.pathToNode(
                this.nodeToPath($node_of_interest.get(0))));

        // We want to wrap if we have an actual rage
        var wrap = !originally_collapsed;
        this.validator.possibleAt(
            $data_node_of_interest.get(0),
            offset).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag")
                    return;

                var unresolved = this.resolver.unresolveName(
                    ev.params[1], ev.params[2]);

                var trs = this.mode.getContextualActions(
                    wrap ? "wrap" : "insert", unresolved,
                    $data_node_of_interest.get(0), offset);
                if (trs === undefined)
                    return;

                for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined;
                    ++tr_ix) {
                    var data = {element_name: unresolved };
                    var icon = tr.getIcon();
                    var $a = $("<a tabindex='0' href='#'>" +
                               (icon ? icon + " ": "") +
                               tr.getDescriptionFor(data) + "</a>");
                    $a.click(data,
                             tr.bound_handler);
                    menu_items.push($("<li></li>").append($a).get(0));
                }
            }.bind(this));

        if ($data_node_of_interest.get(0) !== this.data_root.childNodes[0]) {
            var orig = getOriginalName($data_node_of_interest.get(0));
            var trs = this.mode.getContextualActions(
                "delete-parent", orig, $data_node_of_interest.get(0), 0);
            if (trs !== undefined) {
                trs.forEach(function (tr) {
                    var data = {node: $data_node_of_interest.get(0),
                                element_name: orig };
                    var icon = tr.getIcon();
                    var $a = $("<a tabindex='0' href='#'>" +
                                (icon ? icon + " " : "") +
                               tr.getDescriptionFor(data) + "</a>");
                    $a.click(data,
                             tr.bound_handler);
                    menu_items.push($("<li>").append($a).get(0));
                }.bind(this));
            }
        }
    }

    var items = this.mode.getContextualMenuItems();
    items.forEach(function (item) {
        var $a = $("<a tabindex='0' href='#'>"+ item[0] + "</a>");
        $a.click(item[1], item[2]);
        menu_items.push($("<li>").append($a).get(0));
    });

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
             "prepend"], sep_for, $transformation_node.get(0), 0);
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

    var pos;
    if (this._fake_caret)
        pos = this._$fake_caret.offset();
    else
        // We must wait to do this after we are done with the range.
        pos = this._rangeToPixelPosition();

    this.displayContextMenu(pos.left, pos.top, menu_items);
    return false;
};

Editor.prototype._cutHandler = function(e) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    // The strategy here is:
    // - If the cut should be prevented, return false.
    // - If the cut should go ahead:
    //  - Set a timer to update the data tree after the browser cut happens.
    //  - Return true to let the browser cut. This will cut from the gui tree.

    var range = this.getDOMSelectionRange();
    if (domutil.isWellFormedRange(range)) {
        var start_caret = this.toDataCaret(range.startContainer,
                                           range.startOffset);
        var end_caret = this.toDataCaret(range.endContainer, range.endOffset);
        this.my_window.setTimeout(function () {
            this.fireTransformation(this.cut_tr, caret[0], undefined,
                                    {e: e,
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

Editor.prototype._pasteHandler = function(e) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    var cd = e.originalEvent.clipboardData;
    var as_html = (_indexOf.call(cd.types, "text/html") > -1);
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
                                                {$data: $data, e: e});
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
                            {$data: $data, e: e});
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
                         after ? _indexOf.call(caret[0].childNodes, after) :
                         caret[0].childNodes.length];
            break;
        default:
            throw new Error("unexpected node type: " + caret[0].nodeType);
        }
    }
    editor.setDataCaret(new_caret);
    editor.$gui_root.trigger('wed-post-paste', [data.e, caret, $data_clone]);
}

Editor.prototype.caretPositionRight = function () {
    var pos = this._getRawCaret();
    if (pos === undefined || pos === null)
        return undefined; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos[0]).closest("._gui").get(0);
    if (closest_gui !== undefined)
        pos = [closest_gui, closest_gui.childNodes.length];

    // If we are in a placeholder node, immediately move out of it.
    var closest_ph = $(pos[0]).closest("._placeholder").get(0);
    if (closest_ph !== undefined)
        pos = [closest_ph.parentNode,
               _indexOf.call(closest_ph.parentNode.childNodes, closest_ph) + 1];

    while(true)
    {
        pos = domutil.nextCaretPosition(pos, this.gui_root.childNodes[0],
                                        false);
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

        // Can't stop inside a phantom node.
        var closest_phantom = $node.closest("._phantom").get(0);
        if (closest_phantom) {
            // This ensures the next loop will move after the phantom.
            pos = [closest_phantom, closest_phantom.childNodes.length];
            continue;
        }

        // Or beyond the first position in a placeholder node.
        var closest_ph = $node.closest("._placeholder").get(0);
        if (closest_ph && pos[1] > 0) {
            // This ensures the next loop will move after the placeholder.
            pos = [closest_ph, closest_ph.childNodes.length];
            continue;
        }

        // Make sure the position makes sense form an editing
        // standpoint.
        if (pos[0].nodeType === Node.ELEMENT_NODE) {
            var next_node = pos[0].childNodes[pos[1]];
            var prev_node = pos[0].childNodes[pos[1] - 1];
            var $next_node = $(next_node);
            var $prev_node = $(prev_node);
            if (next_node !== undefined &&
                // We do not stop in front of element nodes.
                (next_node.nodeType === Node.ELEMENT_NODE &&
                 !$next_node.is("._gui._end_button") &&
                 !$prev_node.is("._gui._start_button")) ||
                $prev_node.is("._wed-validation-error, ._gui._end_button"))
                continue; // can't stop here
        }

        // If we get here, the position is good!
        break;
    }

    return pos || undefined;
};

Editor.prototype.caretPositionLeft = function () {
    var pos = this._getRawCaret();
    if (pos === undefined || pos === null)
        return undefined; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos[0]).closest("._gui").get(0);
    if (closest_gui !== undefined)
        pos = [closest_gui, 0];

    // If we are in a placeholder node, immediately move out of it.
    var closest_ph = $(pos[0]).closest("._placeholder").get(0);
    if (closest_ph !== undefined)
        pos = [closest_ph.parentNode,
               _indexOf.call(closest_ph.parentNode.childNodes, closest_ph)];

    while(true)
    {
        pos = domutil.prevCaretPosition(pos, this.gui_root.childNodes[0],
                                        false);
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
            pos = [$closest_ph.get(0).childNodes[0], 0];
            break;
        }

        // Can't stop inside a phantom node.
        var closest_phantom = $node.closest("._phantom").get(0);
        if (closest_phantom !== undefined)
        {
            // Setting the position to this will ensure that on the
            // next loop we move to the left of the phantom node.
            pos = [closest_phantom, 0];
            continue;
        }

        // Make sure the position makes sense form an editing
        // standpoint.
        if (pos[0].nodeType === Node.ELEMENT_NODE) {
            var prev_node = pos[0].childNodes[pos[1] - 1];
            var next_node = pos[0].childNodes[pos[1]];
            var $next_node = $(next_node);
            var $prev_node = $(prev_node);
            if (prev_node !== undefined &&
                // We do not stop just before a start tag button.
                (prev_node.nodeType === Node.ELEMENT_NODE &&
                 !$prev_node.is("._gui._start_button") &&
                 !$next_node.is("._gui._end_button")) ||
                // Can't stop right before a validation error.
                $next_node.is("._gui._start_button, .wed-validation-error"))
                continue; // can't stop here
        }

        // If we get here, the position is good!
        break;
    }

    return pos || undefined;
};

Editor.prototype.moveCaretRight = function () {
    var pos = this.caretPositionRight();
    if (pos)
        this.setCaret(pos[0], pos[1]);
};

Editor.prototype.moveCaretLeft = function () {
    var pos = this.caretPositionLeft();
    if (pos)
        this.setCaret(pos[0], pos[1]);
};

Editor.prototype._canSetCaretHere = function (pos) {
    var r = rangy.createRange(this.my_window.document);
    r.setStart(pos[0], pos[1]);
    var sel = this.getDOMSelection();
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


Editor.prototype.setCaret = function (node, offset, force_fake, text_edit) {
    // Accept a single array as argument
    if (node instanceof Array) {
        offset = node[1];
        node = node[0];
        force_fake = arguments[1];
        text_edit = arguments[2];
    }

    // We set a fake caret.
    this.getDOMSelection().removeAllRanges();
    this._setFakeCaretTo(node, offset);
    this._focusInputField();
    this._caretChangeEmitter(undefined, text_edit);
};

Editor.prototype._focusInputField = function () {
    if (this.my_window.document.activeElement !== this._$input_field[0])
        this._$input_field.focus();
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
    var node, offset;
    if (this._fake_caret) {
        node = this._fake_caret[0];
        offset = this._fake_caret[1];

        // Fake caret was in a node that was removed from the tree.
        if ($(node).closest(this.$gui_root).length === 0)
            this._fake_caret = undefined;
    }

    if (!this._fake_caret) {
        this._$fake_caret.detach();
        // Just move it offscreen.
        this._$input_field.css("top", "");
        this._$input_field.css("left", "");
        return;
    }

    if (!this._$fake_caret.parent()[0])
        this._$caret_layer.append(this._$fake_caret);


    // If we are in a _gui element, then the element itself changes to
    // show the caret position.
    if ($(node).closest("._gui").length > 0)
        return;

    var $mark =
            $("<span style='height: 100%; display: inline-block; " +
              "font-size: inherit;'>&nbsp;</span>");
    var mark = $mark.get(0);

    // We need to save the selection because adding the mark will
    // likely mess it up.  Rangy is of no use here because the method
    // it uses to save the region makes our node and offset
    // coordinates unusable.
    //
    // getDOMSelectionRange ensures we don't get a range if the current
    // range is outside the editable area. Doing otherwise would
    // (among other things) mess up the input field.
    //
    var range = this.getDOMSelectionRange();
    var srange;
    if (range) {
        var stContParent = range.startContainer.parentNode;
        var endContParent = range.endContainer.parentNode;
        srange = {
            stContParent: stContParent,
            stContOffset: _indexOf.call(stContParent.childNodes,
                                        range.startContainer),
            startOffset: range.startOffset,

            endContParent: endContParent,
            endContOffset: _indexOf.call(endContParent.childNodes,
                                         range.endContainer),
            endOffset: range.endOffset
        };
    }

    var position, height;
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

        position = $mark.position();
        height = $mark.height();

        if (node.nodeType === Node.TEXT_NODE) {
            // node was deleted form the DOM tree by the insertIntoText
            // operation, wee need to bring it back.

            // We delete everthing after what was prev to the original
            // node, and before what was next to it.
            var delete_this = prev ? prev.nextSibling : parent.firstChild;
            while(delete_this !== next) {
                parent.removeChild(delete_this);
                delete_this = prev ? prev.nextSibling : parent.firstChild;
            }
            parent.insertBefore(node, next);
        }
        else
            $mark.remove();
    }
    finally {
        this._refreshing_caret--;
    }

    // Restore the range we've possibly saved.
    if (srange) {
        var range = rangy.createRange(this.my_window.document);
        range.setStart(
            srange.stContParent.childNodes[srange.stContOffset],
            srange.startOffset);
        range.setEnd(
            srange.endContParent.childNodes[srange.endContOffset],
            srange.endOffset);
        this.getDOMSelection().setSingleRange(range);
    }

    this._$fake_caret.css("top", position.top);
    this._$fake_caret.css("left", position.left);
    this._$fake_caret.css("height", height);
    this._$fake_caret.css("max-height", height);
    this._$fake_caret.css("min-height", height);

    this._$input_field.css("top", position.top);
    this._$input_field.css("left", position.left);
};

Editor.prototype._keydownHandler = log.wrap(function (e) {
    var caret = this.getCaret();
    // Don't call it on undefined caret.
    if (caret)
        this.$gui_root.trigger('wed-input-trigger-keydown', [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return;

    this.$gui_root.trigger('wed-global-keydown', [e]);
});

Editor.prototype._globalKeydownHandler = log.wrap(function (wed_event, e) {
    var range, caret; // damn hoisting

    // These are things like the user hitting Ctrl, Alt, Shift, or
    // CapsLock, etc. Return immediately.
    if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0)
        return true;

    function terminate() {
        e.stopPropagation();
        e.preventDefault();
        return false;
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
            var data_caret = this.getDataCaret();
            console.log("raw caret", this._raw_caret[0], this._raw_caret[1]);
            console.log("data caret", data_caret[0], data_caret[1]);
            console.log("data closest real",
                        $(data_caret[0]).closest("._real"));
            console.log("gui closest real",
                        $(this._raw_caret[0]).closest("._real"));
            return terminate();
        }
        // F3
        if (e.which == 114) {
            this.dumpUndo();
            return terminate();
        }
    }

    // Cursor movement keys: handle them.
    if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
        var pos, sel; // damn hoisting
        if (key_constants.RIGHT_ARROW.matchesEvent(e)) {
            if (e.shiftKey) {
                // Extend the selection
                pos = this.caretPositionRight();
                sel = this.getDOMSelection();
                sel.nativeSelection.extend(pos[0], pos[1]);
            }
            else
                this.moveCaretRight();
            return terminate();
        }
        else if (key_constants.LEFT_ARROW.matchesEvent(e)) {
            if (e.shiftKey) {
                // Extend the selection
                pos = this.caretPositionLeft();
                sel = this.getDOMSelection();
                sel.nativeSelection.extend(pos[0], pos[1]);
            }
            else
                this.moveCaretLeft();
            return terminate();
        }
        return true;
    }
    else if (key_constants.CTRL_S.matchesEvent(e)) {
        this._saver.save();
        return terminate();
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
        caret = this.getCaret();
        if (caret && $(caret[0]).closest("._phantom").length === 0)
            // On Chrome we must handle it here.
            this._handleKeyInsertingText(e);
        return terminate();
    }
    else if (key_constants.CTRL_BACKQUOTE.matchesEvent(e)) {
        this._development_mode = !this._development_mode;
        $.bootstrapGrowl(this._development_mode ? "Development mode on.":
                         "Development mode off.",
                         { type: 'info', align: 'center' });
        if (this._development_mode)
            log.showPopup();
        return terminate();
    }
    else if (key_constants.CTRL_FORWARD_SLASH.matchesEvent(e) &&
             this._contextMenuHandler.call(this, e) === false)
        return terminate();

    range = this.getDOMSelectionRange();

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
                // Otherwise, we are editable
                true;

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

    var text_undo; // damn hoisting
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
                var parent = caret[0].parentNode;
                var offset = _indexOf.call(parent.childNodes, caret[0]);

                text_undo = this._initiateTextUndo();
                this.data_updater.deleteText(caret[0], caret[1], 1);
                // Don't set the caret inside a node that has been
                // deleted.
                if (caret[0].parentNode)
                    this.setDataCaret(caret[0], caret[1], true);
                else
                    this.setDataCaret(parent, offset, true);
                text_undo.recordCaretAfter();
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
                var offset = _indexOf.call(parent.childNodes, caret[0]);

                // At start of text, nothing to delete.
                if (caret[1] === 0)
                    return terminate();

                text_undo = this._initiateTextUndo();
                this.data_updater.deleteText(caret[0], caret[1] - 1, 1);
                // Don't set the caret inside a node that has been
                // deleted.
                if (caret[0].parentNode)
                    this.setDataCaret(caret[0], caret[1] - 1, true);
                else
                    this.setDataCaret(parent, offset, true);
                text_undo.recordCaretAfter();
            }
        }
        return terminate();
    }
    return true;
});

Editor.prototype._initiateTextUndo = function () {
    // Handle undo information
    var current_group = this._undo.getGroup();
    if (current_group === undefined) {
        current_group = new wundo.TextUndoGroup(
            "text", this, this._undo, this._text_undo_max_length);
        this._undo.startGroup(current_group);
    }
    else if (!(current_group instanceof wundo.TextUndoGroup))
        throw new Error("group not undefined and not a TextUndoGroup");

    return current_group;
};

Editor.prototype._terminateTextUndo = function () {
    var current_group = this._undo.getGroup();
    if (current_group instanceof wundo.TextUndoGroup)
        this._undo.endGroup();
};

Editor.prototype._keypressHandler = log.wrap(function (e) {
    // We always return false because we never want the default to
    // execute.
    this.$gui_root.trigger('wed-input-trigger-keypress', [e]);
    if (e.isImmediatePropagationStopped() || e.isPropagationStopped())
        return;

    this.$gui_root.trigger('wed-global-keypress', [e]);
});

/**
 * Simulates typing text in the editor.
 *
 * @param {module:key~Key|Array.<module:key~Key>|String} text The text to type
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
});

Editor.prototype._handleKeyInsertingText = function (e) {
    var text = String.fromCharCode(e.which);

    if (text === "") // Nothing needed
        return false;

    this._insertText(text);
    e.preventDefault();
    e.stopPropagation();
};

Editor.prototype._insertText = function (text) {
    if (text === "")
        return;

    var caret = this._getRawCaret();

    var $container = $(caret[0]);
    var ph = $container.closest('._placeholder').get(0);
    if (ph) {
        // Move our caret to just before the node before removing it.
        this.setCaret(this.getCaret());
        this._gui_updater.removeNode(ph);
    }

    var placeholders = $container.children('._placeholder').toArray();
    var ph_ix;
    for(ph_ix = 0, ph; (ph = placeholders[ph_ix]) !== undefined; ++ph_ix)
        this._gui_updater.removeNode(ph);

    var text_undo = this._initiateTextUndo();
    caret = this.getDataCaret();
    var insert_ret = this.data_updater.insertText(caret[0], caret[1], text);
    var modified_node = insert_ret[0];
    if (modified_node === undefined)
        this.setDataCaret(insert_ret[1], text.length, true);
    else {
        var final_offset;
        // Before the call, either the caret was in the text node that
        // received the new text...
        if (modified_node === caret[0])
            final_offset = caret[1] + text.length;
        // ... or it was immediately adjacent to this text node.
        else if (caret[0].childNodes[caret[1]] === modified_node)
            final_offset = text.length;
        else
            final_offset = modified_node.nodeValue.length;
        this.setDataCaret(modified_node, final_offset, true);
    }
    text_undo.recordCaretAfter();
};

Editor.prototype._compositionHandler = log.wrap(function (ev) {
    if (ev.type === "compositionstart") {
        this._composing = true;
        this._composition_data = {
            data: ev.originalEvent.data,
            start_caret: this._getRawCaret()
        };
        this._$input_field.css("z-index", 10);
    }
    else if (ev.type === "compositionupdate") {
        this._composition_data.data = ev.originalEvent.data;
    }
    else if (ev.type === "compositionend") {
        this._composing = false;
        this._$input_field.css("z-index", "");
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

Editor.prototype._findBoundaryAt = function (x, y) {
    var old_display = this._$caret_layer.css("display");
    this._$caret_layer.css("display", "none");
    var element_at_mouse =
            this.my_window.document.elementFromPoint(x, y);
    this._$caret_layer.css("display", old_display);
    var range = this.my_window.document.createRange();

    var child = element_at_mouse.firstChild;
    var min;
    main_loop:
    while (child) {
        if (child.nodeType === Node.TEXT_NODE) {
            for(var i = 0; i < child.nodeValue.length - 1; ++i) {
                range.setStart(child, i);
                range.setEnd(child, i+1);
                var rect = range.getBoundingClientRect();
                var dist = util.distFromRect(x, y, rect.left, rect.top,
                                             rect.right, rect.bottom);
                if (!min || min.dist > dist) {
                    min = {
                        dist: dist,
                        node: child,
                        start: i
                    };
                    // Can't get any better than this.
                    if (dist === 0)
                        break main_loop;
                }
            }
        }
        child = child.nextSibling;
    }

    if (!min)
        return { node: element_at_mouse, offset: 0};

    return {node: min.node, offset: min.start};
};

Editor.prototype._pointToCharBoundary = function(x, y) {
    // This obviously won't work for top to bottom scripts.
    // Probably does not work with RTL scripts either.
    var boundary = this._findBoundaryAt(x, y);
    if (boundary.node.nodeType === Node.TEXT_NODE) {
        var range = this.my_window.document.createRange();
        range.setStart(boundary.node, boundary.offset);
        range.setEnd(boundary.node, boundary.offset + 1);
        var rect = range.getBoundingClientRect();
        if (Math.abs(rect.left - x) > Math.abs(rect.right - x))
            boundary.offset++;
    }
    return boundary;
};

Editor.prototype._mousemoveHandler = log.wrap(function (e) {
    if (this._new_mousemove) {
        this._new_mousemove = false;
    }
    else
        this._sel_focus = this._pointToCharBoundary(e.clientX, e.clientY);
    //var range = rangy.createRange(this.my_window.document);
    var rr = domutil.rangeFromPoints(this._sel_anchor.node,
                                     this._sel_anchor.offset,
                                     this._sel_focus.node,
                                     this._sel_focus.offset);
    var range = rr.range;
    if (!rr.reversed)
        this.getDOMSelection().setSingleRange(range);
    else {
        this.getDOMSelection().removeAllRanges();
        this.getDOMSelection().addRange(range, true);
    }

});

Editor.prototype._caretLayerMouseHandler = log.wrap(function (e) {
    if (e.type === "mousedown") {
        this._sel_anchor = this._pointToCharBoundary(e.clientX, e.clientY);
        this._sel_focus = this._sel_anchor;
        this._$caret_layer.on("mousemove",
                              this._caretLayerMouseHandler.bind(this));
    }
    var old_display = this._$caret_layer.css("display");
    this._$caret_layer.css("display", "none");
    var element_at_mouse =
            this.my_window.document.elementFromPoint(e.clientX, e.clientY);
    this._$caret_layer.css("display", old_display);
    delete e.offsetX;
    delete e.offsetY;
    $(element_at_mouse).trigger(e);
    if (e.type === "mouseup") {
        this._$caret_layer.off("mousemove");
    }
});

Editor.prototype._mousedownHandler = log.wrap(function(e) {
    if (e.which === 1) {
        this._sel_anchor = this._pointToCharBoundary(e.clientX, e.clientY);
        this._sel_focus = this._sel_anchor;
        this.$gui_root.on('mousemove.wed', this._mousemoveHandler.bind(this));
        this._new_mousemove = true;
    }

    this.$widget.find('.wed-validation-error.selected').removeClass('selected');
    this.$error_list.find('.selected').removeClass('selected');

    var range = this.getDOMSelectionRange();
    if (!range || range.collapsed) {
        this.my_window.setTimeout(this._seekCaret.bind(this, e,
                                                       e.clientX,
                                                       e.clientY), 0);
    }
    else if (e.which === 3) {
        // Only well formed ranges can be processed.
        if (!domutil.isWellFormedRange(range))
            return false;
        return this._contextMenuHandler(e);
    }

    return true;
});

Editor.prototype.insertPlaceholderAt = function (node, offset) {
    var ph = this.mode.makePlaceholderFor(node)[0];
    this._updating_placeholder++;
    this._gui_updater.insertNodeAt(node, offset, ph);
    this._updating_placeholder--;
};

Editor.prototype.insertTransientPlaceholderAt = function (node, offset) {
    var ph = $("<span class='_placeholder _transient' " +
               "contenteditable='false'> </span>")[0];
    this._gui_updater.insertNodeAt(node, offset, ph);
};

Editor.prototype._seekCaret = log.wrap(function (ev, x, y) {
    this._normalizeSelectionRange();
    var range = this.getDOMSelectionRange();

    var $target = $(ev.target);
    var in_gui = $target.closest("._gui").length > 0;
    if (range) {
        // Don't update the caret if outside our gui.
        if (!($(range.startContainer).closest(this.gui_root).length === 0 ||
              $(range.endContainer).closest(this.gui_root).length === 0))
            this.setCaret(range.startContainer, range.startOffset);
    }
    else {
        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if ($target.closest("._placeholder").length > 0) {
            var r = rangy.createRange(this.my_window.document);
            r.setStart(ev.target, 0);
            this.getDOMSelection().setSingleRange(r);
            this._caretChangeEmitter();
        }

        // If the caret is changing due to a click on a
        // gui element, then put it inside that element.
        if (in_gui) {
            var r = rangy.createRange(this.my_window.document);
            r.setStart(ev.target, 0);
            this.getDOMSelection().setSingleRange(r);
            this._caretChangeEmitter();
        }

    }

    if (ev.which === 3) {
        if (in_gui)
            $target.trigger("wed-context-menu", [ev]);
        else
            return this._contextMenuHandler(ev);
    }
    return true;
});

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
        return [parent, _indexOf.call(parent.childNodes, pg)];
    }

    return [node, offset];
};

Editor.prototype._getRawCaret = function () {
    // Make sure the caret is not stale.
    if (!this._raw_caret)
        return undefined;
    return this._raw_caret.slice();
};

Editor.prototype.fromDataCaret = function (node, offset) {
    var ret = this._gui_updater.fromDataCaret(node, offset);

    if(node.nodeType === Node.ELEMENT_NODE) {
        // Normalize to a range within the editable nodes. We could be
        // outside of them in an element which is empty, for instance.
        var pair = this.mode.nodesAroundEditableContents(ret[0]);
        var first_index = _indexOf.call(ret[0].childNodes, pair[0]);
        if (ret[1] <= first_index)
            ret[1] = first_index + 1;
        else {
            var second_index =
                    pair[1] ? _indexOf.call(ret[0].childNodes, pair[1]) :
                    ret[0].childNodes.length;
            if (ret[1] >= second_index)
                ret[1] = second_index;
        }
    }
    return ret;
};

/**
 * Converts a gui caret to a data caret. This method's signature is
 * determined by the type of the first parameter. If a node, then
 * <code>this.toDataCaret(node, offset, closest)</code>. If an array,
 * then <code>this.toDataCaret(caret, closest)</code>. In the second
 * case, the names are changed to reflect the role of the parameters.
 *
 * @param {Node|Array} node Either a node which with the next
 * parameter represents a position or an array of two elements which
 * represents a caret position.
 * @param {Integer} [offset] The offset in the node in the first
 * parameter. Must be present if the first parameter is a node. If the
 * first parameter is an array, then this parameter must be absent.
 * @param {Boolean} [closest=false] Some gui caret positions do not
 * correspond to data caret positions. Like if the caret is in a gui
 * element or phantom text. By default, this method will return
 * undefined in such case. If this parameter is true, then this method
 * will return the closest position.
 * @returns {Array} The data caret that corresponds to the caret
 * passed. This could be undefined if the caret is in a position that
 * does not correspond to a position in the data tree.
 */
Editor.prototype.toDataCaret = function(node, offset, closest) {
    // Accept a single array as argument
    if (node instanceof Array) {
        closest = offset;
        offset = node[1];
        node = node[0];
    }

    var top_phantom = $(node).parents("._phantom, ._gui").last()[0] ||
            ($(node).is("._phantom, ._gui") ? node : undefined);
    if (top_phantom) {
        if (!closest)
            return undefined;

        node = top_phantom.parentNode;
        offset = _indexOf.call(node.childNodes, top_phantom);
    }

    var normalized = this.normalizeCaret(node, offset);
    node = normalized[0];
    offset = normalized[1];

    var data_node;
    if (node.nodeType === Node.TEXT_NODE) {
        data_node = this.data_updater.pathToNode(this.nodeToPath(node));
        return [data_node, offset];
    }

    if (offset >= node.childNodes.length) {
        data_node = this.data_updater.pathToNode(this.nodeToPath(node));
        return [data_node, data_node.childNodes.length];
    }

    var child = node.childNodes[offset];
    if (child.nodeType !== Node.TEXT_NODE && !$(child).is("._real")) {
        var prev = child.previousSibling;
        var found;
        while (prev) {
            if (prev.nodeType === Node.TEXT_NODE || $(prev).is("._real")) {
                found = prev;
                prev = null;
            }
            else
                prev = prev.previousSibling;
        }

        if (!found)
            return [this.data_updater.pathToNode(this.nodeToPath(node)), 0];

        data_node = this.data_updater.pathToNode(this.nodeToPath(found));
        return [data_node.parentNode,
                _indexOf.call(data_node.parentNode.childNodes, data_node) + 1];
    }

    data_node = this.data_updater.pathToNode(this.nodeToPath(child));
    return [data_node.parentNode,
            _indexOf.call(data_node.parentNode.childNodes, data_node)];
};

Editor.prototype.getDataCaret = function (closest) {
    var caret = this.getCaret();
    if (caret === undefined)
        return undefined;
    return this.toDataCaret(caret, closest);
};

Editor.prototype.setDataCaret = function (node, offset, text_edit) {
    text_edit = !!text_edit; // normalize
    // Accept a single array as argument
    if (arguments.length === 1 && node instanceof Array) {
        offset = node[1];
        node = node[0];
    }
    this.setCaret(this.fromDataCaret(node, offset), false, text_edit);
};


Editor.prototype.toDataNode = function (node) {
    return this.data_updater.pathToNode(this.nodeToPath(node));
};


Editor.prototype._caretChangeEmitter = log.wrap(function (ev, text_edit) {
    text_edit = !!text_edit; // normalize
    if (ev === undefined)
        ev = {which: undefined, type: undefined, target: undefined};

    // We need this rigmarole because on Chrome 28 the caret won't be
    // set to its new position on a "mouseup" or "click" event until
    // *after* the event handler has run!!!
    if (ev.type === "mouseup" || ev.type === "click") {
        window.setTimeout(
            this._caretChangeEmitterTimeout.bind(this, ev, text_edit), 0);
    }
    else
        this._caretChangeEmitterTimeout(ev, text_edit);
});

Editor.prototype._caretChangeEmitterTimeout = log.wrap(
    function (ev, text_edit) {
    if (ev.type === "mouseup") {
        if (this._sel_anchor)
            this._setFakeCaretTo(this._sel_anchor.node,
                                 this._sel_anchor.offset);
        else if (this._sel_focus)
            this._setFakeCaretTo(this._sel_focus.node, this._sel_focus.offset);
    }

    if (ev.type === "mouseup" || ev.type === "click") {
        var r; // damn hoisting

        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if ($(ev.target).closest("._placeholder").length > 0)
            this.setCaret(ev.target, 0);

        // If clicked inside a gui element, normalize the caret to the
        // start of that element.
        //
        var closest_gui = $(ev.target).closest("._gui").get(0);
        if (closest_gui)
            this.setCaret(closest_gui, 0);
        else {
            // This is in an else branch to handle a phantom inside a
            // gui as above.

            // If clicked inside a phantom element, normalize the caret to
            // the start of that element.
            var phantom = $(ev.target).parents("._phantom").last().get(0);
            if (phantom)
                this.setCaret(phantom.parentNode,
                              _indexOf.call(phantom.parentNode.childNodes,
                                            phantom));
        }
    }

    var selection = this.getDOMSelection();
    var focus_node;
    var focus_offset;

    if (this._fake_caret) {
        focus_node = this._fake_caret[0];
        focus_offset = this._fake_caret[1];
    }
    else if (selection.rangeCount > 0 &&
             // Don't set it to something outside our window.
             $(selection.focusNode).closest(this.gui_root).length !== 0) {
        focus_node = selection.focusNode;
        focus_offset = selection.focusOffset;
    }

    if (focus_node && focus_node.nodeType === Node.ELEMENT_NODE) {
        // Placeholders attract adjacent carets into them.

        var $ph = $(focus_node).children("._placeholder");
        var ph = $ph.get(0);
        if (ph && !$ph.is("._dying")) {
            this.setCaret(ph, 0);
            return;
        }
    }

    if (this._raw_caret === undefined ||
        this._raw_caret[0] !== focus_node ||
        this._raw_caret[1] !== focus_offset) {
        var old_caret = this._raw_caret;
        this._raw_caret = focus_node ? [focus_node, focus_offset] : undefined;
        this.$gui_root.trigger("caretchange",
                               [this._raw_caret, old_caret, text_edit]);
    }
});

Editor.prototype._caretChangeHandler = log.wrap(
    function (e, caret, old_caret, text_edit) {
    if (!text_edit)
        this._terminateTextUndo();
    $(this.gui_root).find("._owns_caret").removeClass("_owns_caret");

    if (old_caret) {
        var $old_caret = $(old_caret[0]);
        var $old_gui = $old_caret.closest("._gui");
        if ($old_gui.length > 0)
            $old_gui.trigger("unclick");

        var old_tp = $old_caret.closest("._placeholder._transient")[0];
        if (old_tp)
            this._gui_updater.removeNode(old_tp);
    }

    if (!caret)
        return;

    var $node = $((caret[0].nodeType === Node.ELEMENT_NODE)?
                  caret[0]: caret[0].parentNode);

    // Don't do it for gui elements.
    if ($node.closest("._gui").length === 0)
        $node.addClass("_owns_caret");


    if ($node.closest("._gui").length > 0)
        $node.click();
});

Editor.prototype.dismissContextMenu = function () {
    // We may be called when there is no menu active.
    if (this._current_dropdown)
        this._current_dropdown.dismiss();
};

/**
 * @param items Must be a sequence of <li> elements that will form the
 * menu. The actual data type can be anything that jQuery() accepts.
 */
Editor.prototype.displayContextMenu = function (x, y, items) {
    this.dismissContextMenu();

    var position = this.$gui_root.offset();
    var height = this.$gui_root.height();
    // Subtract the gui_root-relative position from the total height
    // of the gui_root.
    var max_height = height - (y - position.top);
    this.pushSelection();
    this._current_dropdown = new context_menu.ContextMenu(
        this.my_window.document,
        x, y, max_height, items,
        function() {
        this._current_dropdown = undefined;
        this.popSelection();
    }.bind(this));
};

Editor.prototype.pushSelection = function () {
    var sel = this.getDOMSelection();
    if (sel.rangeCount > 0)
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
        var sel = this.getDOMSelection();
        if (sel.rangeCount > 0 &&
            $(sel.focusNode).closest(this.$gui_root).length > 0) {
            var range = sel.getRangeAt(0);
            this._sel_anchor = {node: range.startContainer,
                                offset: range.startOffset};
            this._sel_focus = {node: range.endContainer,
                               offset: range.endOffset};
            this.getDOMSelection().setSingleRange(range);
            this.setCaret(sel.focusNode, sel.focusOffset);
        }
    }
    else
        // Null value means there was no selection, ergo...
        this.clearSelection();
};

Editor.prototype.clearSelection = function () {
    this._removeFakeCaret();
    var sel = this.getDOMSelection();
    if (sel.rangeCount > 0 &&
        $(sel.focusNode).closest(this.$gui_root).length > 0)
        sel.removeAllRanges();
    this._sel_anchor = undefined;
    this._sel_focus = undefined;
    this._caretChangeEmitter();
};

Editor.prototype.getDOMSelection = function () {
    return rangy.getSelection(this.my_window);
};

Editor.prototype.getDOMSelectionRange = function () {
    var range = domutil.getSelectionRange(this.my_window);

    if (!range)
        return undefined;

    // Don't return a range outside out editing framework.
    if ($(range.startContainer).closest(this.$gui_root).length === 0 ||
        $(range.endContainer).closest(this.$gui_root).length === 0)
        return undefined;

    return range;
};

Editor.prototype.getSelectionRange = function () {
    if (!this._sel_anchor)
        return undefined;

    var range = domutil.rangeFromPoints(this._sel_anchor.node,
                                        this._sel_anchor.offset,
                                        this._sel_focus.node,
                                        this._sel_focus.offset).range;
    return range;
};

Editor.prototype.setSelectionRange = function (range) {
    this._sel_anchor = {node: range.startContainer,
                        offset: range.startOffset};
    this._sel_focus = {node: range.endContainer,
                       offset: range.endOffset};
    this.setDOMSelectionRange(range);
    this.setCaret(range.startContainer, range.startOffset);
};

Editor.prototype._normalizeSelectionRange = function () {
    var range = this.getDOMSelectionRange();
    if (!range)
        return;

    var start = this._normalizeCaretToEditableRange(
        range.startContainer, range.startOffset);
    var end = this._normalizeCaretToEditableRange(
        range.endContainer, range.endOffset);
    range.setStart(start[0], start[1]);
    range.setEnd(end[0], end[1]);
    this.setDOMSelectionRange(range);
};

Editor.prototype._normalizeCaretToEditableRange = function (container, offset) {
    if (container instanceof Array) {
        offset = container[1];
        container = container[0];
    }

    if(container.nodeType === Node.ELEMENT_NODE) {
        // Normalize to a range within the editable nodes. We could be
        // outside of them in an element which is empty, for instance.
        var pair = this.mode.nodesAroundEditableContents(container);
        var first_index = pair[0] ?
                _indexOf.call(container.childNodes, pair[0]) : -1;
        if (offset <= first_index)
            offset = first_index + 1;
        else {
            var second_index = pair[1] ?
                    _indexOf.call(container.childNodes, pair[1]) :
                    container.childNodes.length;
            if (offset >= second_index)
                offset = second_index;
        }
    }
    return [container, offset];
};

Editor.prototype.setDOMSelectionRange = function (range) {
    this.getDOMSelection().setSingleRange(range);
};

Editor.prototype.getDataSelectionRange = function () {
    var range = this.getDOMSelectionRange();
    var data_range = rangy.createRange(this.data_root.parentNode);
    var start_caret = this.toDataCaret(range.startContainer, range.startOffset);
    data_range.setStart(start_caret[0], start_caret[1]);
    if (!range.collapsed) {
        var end_caret = this.toDataCaret(range.endContainer, range.endOffset);
        data_range.setEnd(end_caret[0], end_caret[1]);
    }
    return data_range;
};

Editor.prototype.setDataSelectionRange = function (range) {
    var gui_range = rangy.createRange(this.my_window.document);
    var start_caret = this.fromDataCaret(range.startContainer, range.startOffset);
    gui_range.setStart(start_caret[0], start_caret[1]);
    if (!range.collapsed) {
        var end_caret = this.fromDataCaret(range.endContainer, range.endOffset);
        gui_range.setEnd(end_caret[0], end_caret[1]);
    }
    this.setSelectionRange(gui_range);
};

Editor.prototype._onSaverSaved = function () {
    $.bootstrapGrowl("Saved", { ele: this.$widget.closest('body'),
                                type: 'success', align: 'center' } );
    this._emit("saved");
};

Editor.prototype._onSaverFailed = function (data) {
    $.bootstrapGrowl("Failed to save!\n" + data.msg,
                     { ele: this.$widget.closest('body'),
                       type: 'danger', align: 'center' } );
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
    this._validation_errors.push(ev);
    this._processValidationError(ev);
};

Editor.prototype._processValidationError = function (ev) {
    var error = ev.error;
    var data_node = ev.node;
    var index = ev.index;
    var gui_caret = this.fromDataCaret(data_node, index);
    gui_caret = this._normalizeCaretToEditableRange(gui_caret);

    var link_id = util.newGenericID();
    var $marker = $("<span class='_phantom wed-validation-error'></span>");
    $marker.click(log.wrap(function (ev) {
        this.$error_list.parents('.panel-collapse').collapse('show');
        var $link = this.$error_list.find("#" + link_id);
        var $scrollable = this.$error_list.parent('.panel-body');
        $scrollable.animate({
            scrollTop: $link.offset().top - $scrollable.offset().top +
                $scrollable.scrollTop()
        });
        this.$widget.find('.wed-validation-error.selected').removeClass('selected');
        $(ev.currentTarget).addClass('selected');
        $link.siblings().removeClass('selected');
        $link.addClass('selected');
    }.bind(this)));
    var marker_id = $marker.get(0).id = util.newGenericID();
    this._gui_updater.insertAt(gui_caret[0], gui_caret[1], $marker.get(0));

    // Turn the expanded names back into qualified names.
    var names = error.getNames();
    for(var ix = 0; ix < names.length; ++ix) {
        names[ix] = this.resolver.unresolveName(
            names[ix].ns, names[ix].name,
            error instanceof validate.AttributeNameError ||
            error instanceof validate.AttributeValueError);
    }

    var $item = $("<li><a href='#" + marker_id + "'>" +
                  error.toStringWithNames(names) + "</li>");
    $item.attr("id", link_id);

    $item.children("a").click(log.wrap(function (ev) {
        this.$widget.find('.wed-validation-error.selected').removeClass('selected');
        $marker.addClass('selected');
        var $parent = $(ev.currentTarget).parent();
        $parent.siblings().removeClass('selected');
        $parent.addClass('selected');
    }.bind(this)));

    this.$error_list.append($item);
};


Editor.prototype._onResetErrors = function (ev) {
    this.$error_list.children("li").slice(ev.at).remove();
    this.$widget.find('.wed-validation-error').remove();
};

Editor.prototype.nodeToPath = function (node) {
    return domutil.nodeToPath(this.gui_root, node);
};

Editor.prototype.pathToNode = function (path) {
    return domutil.pathToNode(this.gui_root, path);
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

Editor.prototype.getModeData = function (key) {
    return this._mode_data[key];
};

Editor.prototype.setModeData = function (key, value) {
    this._mode_data[key] = value;
};

Editor.prototype.destroy = function () {
    if (this._destroyed)
        return;

    var my_index = onerror.editors.indexOf(this);
    if (my_index >= 0)
        onerror.editors.splice(my_index, 1);

    //
    // This is imperfect but the goal here is to do as much work as
    // possible, even if things have not been initialized fully.
    //
    // The last recorded exception will be rethrown at the end.
    //
    try {
        if (this.gui_domlistener !== undefined)
            this.gui_domlistener.stopListening();
    }
    catch(ex) {
        log.unhandled(ex);
    }


    try {
        if (this.validation_domlistener !== undefined)
            this.validation_domlistener.stopListening();
    }
    catch(ex) {
        log.unhandled(ex);
    }

    if (this._current_dropdown)
        this._current_dropdown.dismiss();

    this._$caret_layer.empty();

    // These ought to prevent jQuery leaks.
    try {
        var $gui_root = this.$gui_root;
        $gui_root.off();
        $gui_root.removeData();
        $gui_root.empty();
        this.$frame.find('*').off('.wed');
        // This will also remove the unload handler.
        $(this.my_window).off('.wed');
    }
    catch (ex) {
        log.unhandled(ex);
    }

    try {
        if (this.validator)
            this.validator.stop();
    }
    catch (ex) {
        log.unhandled(ex);
    }

    // Trash our variables: this will likely cause immediate
    // failure if the object is used again.
    Object.keys(this).forEach(function (x) {
        this[x] = undefined;
    }.bind(this));

    // ... but keep these two. Calling destroy over and over is okay.
    this._destroyed = true;
    this.destroy = function () {};
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
    var selection = this.getDOMSelection();
    var range = this.getDOMSelectionRange();
    var container;
    var offset;
    if (range) {
        range = this.getDOMSelectionRange().cloneRange();
        var start_is_focus = ((selection.focusNode === range.startContainer) &&
                              (selection.focusOffset === range.startOffset));
        range.collapse(start_is_focus);
        container = range.startContainer;
        offset = range.startOffset;
    }
    else {
        var caret = this._getRawCaret();
        container = caret[0];
        offset = caret[1];
    }

    var ret;
    var $marker = $("<span/>");
    switch(container.nodeType) {
    case Node.TEXT_NODE:
        // We have to temporarily break the node into two text nodes
        // and put a marker between the two.
        var frag = document.createDocumentFragment();
        var start_node = document.createTextNode(container.nodeValue.slice(0, offset));
        var end_node = document.createTextNode(container.nodeValue.slice(offset));
        var marker = $marker.get(0);
        frag.appendChild(start_node);
        frag.appendChild(marker);
        frag.appendChild(end_node);
        var parent = container.parentNode;

        parent.replaceChild(frag, container);
        ret = $marker.offset();
        parent.removeChild(start_node);
        parent.removeChild(marker);
        parent.replaceChild(container, end_node);
        break;
    case Node.ELEMENT_NODE:
        container.insertBefore($marker.get(0), container.childNodes[offset]);
        ret = $marker.offset();
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
