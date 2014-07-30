/**
 * @module wed
 * @desc The main module for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var browsers = require("./browsers");
var log = require("./log");
var saver = require("./saver");
var rangy = require("rangy");
var validator = require("./validator");
var Validator = validator.Validator;
var util = require("./util");
var name_resolver = require("salve/name_resolver");
var domutil = require("./domutil");
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
var pubsub = require("./lib/pubsub");
var build_info = require("./build-info");
var AbortTransformationException = exceptions.AbortTransformationException;
var dloc = require("./dloc");
var guiroot = require("./guiroot");
var object_check = require("./object_check");
var makeDLoc = dloc.makeDLoc;
var DLoc = dloc.DLoc;
var preferences = require("./preferences");
require("bootstrap");
require("jquery.bootstrap-growl");
require("./onbeforeunload");

var _indexOf = Array.prototype.indexOf;

exports.version = "0.17.0";
var version = exports.version;

var getOriginalName = util.getOriginalName;

/**
 * @classdesc A wed editor. This is the class to instantiate to use wed.
 *
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 * @mixes module:lib/conditioned~Conditioned
 *
 * @constructor
 */
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
    this.max_label_level = undefined;
    this._current_label_level = undefined;

    this.preferences = new preferences.Preferences({
        "tooltips": true
    });

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not
    // alter anything outside our frame.
    this.$frame = this.$widget.closest("html");
    this.my_window = this.$frame[0].ownerDocument.defaultView;
    onerror.register(this.my_window);

    // This enables us to override options.
    options = $.extend(true, {}, module.config(), options);

    this.name = options.name;

    if (options.ajaxlog)
        log.addURL(options.ajaxlog.url, options.ajaxlog.headers);

    this._save = options.save;
    // Records whether the first parse has happened.
    this._first_validation_complete = false;

    this._destroying = false;
    this._destroyed = false;

    this.options = options;

    // This structure will wrap around the document to be edited.
    var $framework = $('\
<div class="row">\
 <div class="wed-frame col-sm-push-2 col-lg-10 col-md-10 col-sm-10">\
  <div class="row">\
   <div class="progress">\
    <span></span>\
    <div id="validation-progress" class="progress-bar" style="width: 0%"/>\
   </div>\
  </div>\
  <div class="row">\
   <div class="wed-cut-buffer" contenteditable="true"></div>\
   <div class="wed-document-constrainer">\
    <input class="wed-comp-field" type="text"></input>\
    <div class="wed-caret-layer">\
    </div>\
    <div class="wed-document"><span class="root-here"/></div>\
   </div>\
   <div class="wed-location-bar"><span>&nbsp;</span></div>\
  </div>\
 </div>\
 <div id="sidebar" class="col-sm-pull-10 col-lg-2 col-md-2 col-sm-2"/>\
</div>');

    //
    // Grab all the references we need while $framework does not yet contain
    // the document to be edited. (Faster!)
    //

    // $gui_root represents the document root in the HTML elements
    // displayed. The top level element of the XML document being
    // edited will be the single child of $gui_root.
    this.$gui_root = $framework.find('.wed-document');
    this.gui_root = this.$gui_root[0];

    this.$sidebar = $framework.find("#sidebar");

    this.$validation_progress = $framework.find("#validation-progress");
    this.$validation_message = this.$validation_progress.prev('span');

    this._$input_field = $framework.find(".wed-comp-field");
    this._$cut_buffer = $framework.find(".wed-cut-buffer");

    this._caret_layer = $framework.find('.wed-caret-layer')[0];
    this._$caret_layer = $(this._caret_layer);

    // Insert the framework and put the document in its proper place.
    var $root_placeholder = $framework.find(".root-here");
    if (widget.firstChild)
        $root_placeholder.replaceWith(widget.firstChild);
    else
        $root_placeholder.remove();
    this.$widget.append($framework);

    this._$wed_location_bar =$framework.find('.wed-location-bar');

    // $data_root is the document we are editing, $gui_root will become
    // decorated with all kinds of HTML elements so we keep the two
    // separate.
    this.$data_root = this.$gui_root.clone();
    this.data_root = this.$data_root[0];
    this.$data_root.css("display", "none");

    this.gui_dloc_root = new guiroot.GUIRoot(this.gui_root);
    this.data_dloc_root = new dloc.DLocRoot(this.data_root);

    // Put the data_root into a document fragment to keep rangy happy.
    var frag = this.widget.ownerDocument.createDocumentFragment();
    frag.appendChild(this.data_root);

    domutil.linkTrees(this.data_root, this.gui_root);
    this.data_updater = new TreeUpdater(this.data_root);
    this._gui_updater = new GUIUpdater(this.gui_root, this.data_updater);
    this._undo_recorder = new UndoRecorder(this, this.data_updater);

    // This is a workaround for a problem in Bootstrap >= 3.0.0 and <
    // 3.2.0. When removing a Node that has an tooltip associated with
    // it and the trigger is delayed, a timeout is started which may
    // timeout *after* the Node and its tooltip are removed from the
    // DOM. This causes a crash.
    this._gui_updater.addEventListener("deleteNode",
                                       function (ev) {
        var $nodes = $(ev.node).findAndSelf("*");
        for(var i = 0, limit = $nodes.length; i < limit; ++i) {
            var data = $nodes.eq(i).data("bs.tooltip");
            if (data)
                data.hide();
        }
    });

    this._$save_and_modification_status = $(
'<div class="wed-save-and-modification-status">\
  <span class="wed-modification-status label label-success" \
        title="Modification status">\
   <i class="icon icon-asterisk"></i>\
  </span>\
  <span class="wed-save-status label label-default">\
   <i class="icon icon-cloud-upload"></i> <span></span>\
  </span>\
</div>');
    this._$modification_status =
        this._$save_and_modification_status.find('.wed-modification-status');
    this._$save_status =
        this._$save_and_modification_status.find('.wed-save-status');
    this.$sidebar.append(this._$save_and_modification_status);

    if (this._save && this._save.url) {
        this._saver = new saver.Saver(this._save.url, this._save.headers,
                                      version, this._save.initial_etag,
                                      this.data_updater,
                                      this.data_root);
        this._saver.addEventListener("saved", this._onSaverSaved.bind(this));
        this._saver.addEventListener("autosaved",
                                     this._onSaverAutosaved.bind(this));
        this._saver.addEventListener("failed", this._onSaverFailed.bind(this));
        this._saver.addEventListener("changed",
                                     this._onSaverChanged.bind(this));
        this._saver.addEventListener("too_old",
                                     this._onSaverTooOld.bind(this));
        if (this._save.autosave !== undefined)
            this._saver.setAutosaveInterval(this._save.autosave * 1000);
        this._refreshSaveStatus();
        this._save_status_interval =
            setInterval(this._refreshSaveStatus.bind(this), 30 * 1000);
    }
    else
        log.error("wed cannot save data due " +
                  "to the absence of a save_url option");

    // We duplicate data-parent on the toggles and on the collapsible
    // elements due to a bug in Bootstrap 3.0.0. See
    // https://github.com/twbs/bootstrap/issues/9933.
    this.$sidebar.append('\
<div id="sidebar-panel" class="panel-group wed-sidebar-panel">\
 <div class="panel panel-info wed-navigation-panel">\
  <div class="panel-heading">\
   <div class="panel-title">\
    <a class="accordion-toggle" data-toggle="collapse" \
       data-parent="#sidebar-panel" \
       href="#sb-nav-collapse">Navigation</a>\
   </div>\
  </div>\
 <div id="sb-nav-collapse" data-parent="#sidebar-panel" \
      class="panel-collapse collapse in">\
   <div id="sb-nav" class="panel-body">\
    <ul id="navlist" class="nav nav-list">\
     <li class="inactive">A list of navigation links will appear here</li>\
    </ul>\
   </div>\
  </div>\
 </div>\
 <div class="panel panel-danger">\
  <div class="panel-heading">\
   <div class="panel-title">\
    <a class="accordion-toggle" data-toggle="collapse"\
       data-parent="#sidebar-panel"\
       href="#sb-errors-collapse">Errors</a>\
   </div>\
  </div>\
  <div id="sb-errors-collapse" data-parent="#sidebar-panel"\
       class="panel-collapse collapse">\
   <div id="sb-errors" class="panel-body">\
    <ul id="sb-errorlist" class="nav nav-list wed-errorlist">\
     <li class="inactive"></li>\
    </ul>\
   </div>\
  </div>\
 </div>\
</div>');

    this._$navigation_panel = this.$sidebar.find(".wed-navigation-panel");
    this._$navigation_panel.css("display", "none");

    this._current_dropdown = undefined;

    this._$fake_caret = $("<span class='_wed_caret' contenteditable='false'>" +
                          " </span>");
    this._$fc_mark =
        $("<span style='height: 100%; " +
          "font-size: inherit; width: 1px; max-width: 1px;'>"+
          "&nbsp;</span>");
    this._fc_mark = this._$fc_mark[0];

    // The limitation modal is a modal that comes up when wed cannot proceed.
    // It is not created with this.makeModal() because we don't care about the
    // selection.
    this._limitation_modal = new modal.Modal();
    this._limitation_modal.setTitle("Cannot proceed");
    this._limitation_modal.addButton("Reload", true);

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
        "<p>The key combinations with Ctrl below are done with Command in \
        OS X.</p>\
         <ul>\
          <li>Clicking the right mouse button on the document contents \
brings up a contextual menu.</li>\
          <li>Clicking the right mouse button on the links in the \
navigation panel brings up a contextual menu.</li>\
          <li>F1: help</li>\
          <li>Ctrl-[: Decrease the label visibility level.</li>\
          <li>Ctrl-]: Increase the label visibility level.</li>\
          <li>Ctrl-S: Save</li>\
          <li>Ctrl-X: Cut</li>\
          <li>Ctrl-V: Paste</li>\
          <li>Ctrl-C: Copy</li>\
          <li>Ctrl-Z: Undo</li>\
          <li>Ctrl-Y: Redo</li>\
          <li>Ctrl-/: Bring up a contextual menu.</li>\
        </ul>\
        <p class='wed-build-info'>Build descriptor: " + build_info.desc +
            "<br/>\
        Build date: " + build_info.date + "</p>\
        ");
    this.help_modal.addButton("Close", true);

    this._disconnect_modal = this.makeModal();
    this._disconnect_modal.setTitle("Disconnected from server!");
    this._disconnect_modal.setBody(
        "It appears your browser is disconnected from the server. \
        Editing is frozen until the connection is reestablished. \
        Dismissing this dialog will retry saving. If the operation is \
        successful, you'll be able to continue editing. If not, this \
        message will reappear.");
    this._disconnect_modal.addButton("Retry", true);

    this._edited_by_other_modal = this.makeModal();
    this._edited_by_other_modal.setTitle("Edited by another!");
    this._edited_by_other_modal.setBody(
        "Your document was edited by someone else since you last loaded or \
        saved it. You must reload it before trying to edit further.");
    this._edited_by_other_modal.addButton("Reload", true);

    this._too_old_modal = this.makeModal();
    this._too_old_modal.setTitle("Newer version!");
    this._too_old_modal.setBody(
        "There is a newer version of the editor. \
        You must reload it before trying to edit further.");
    this._too_old_modal.addButton("Reload", true);

    this._$navigation_list = this.$widget.find("#navlist");

    this._old_sel_focus = undefined;
    this._sel_anchor = undefined;
    this._sel_focus = undefined;

    this._selection_stack = [];

    this.domlistener = new updater_domlistener.Listener(this.gui_root,
                                                            this._gui_updater);

    // Setup the cleanup code.
    $(this.my_window).on('unload.wed', { editor: this }, unloadHandler);
    $(this.my_window).on('popstate.wed', function (ev) {
        if (document.location.hash === "") {
            this.$gui_root.scrollTop(0);
        }
    }.bind(this));

    this._last_done_shown = 0;
    this.$error_list = this.$widget.find("#sb-errorlist");
    this._$excluded_from_blur = $();
    this._validation_errors = [];

    this._undo = new undo.UndoList();


    this.mode_path = options.mode.path;
    this.paste_tr = new transformation.Transformation(this, "Paste", paste);
    this.cut_tr = new transformation.Transformation(this, "Cut", cut);
    this.split_node_tr =
        new transformation.Transformation(
            this, "Split <element_name>",
            function(editor, data) {
            return transformation.splitNode(editor, data.node);
        });
    this.merge_with_previous_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "Merge <element_name> with previous",
            function (editor, data) {
            return transformation.mergeWithPreviousHomogeneousSibling(
                editor, data.node);
        });

    this.merge_with_next_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "Merge <element_name> with next",
            function (editor, data) {
            return transformation.mergeWithNextHomogeneousSibling(
                editor, data.node);
        });

    pubsub.subscribe(pubsub.WED_MODE_READY, function (msg, mode) {
        // Change the mode only if it is *our* mode
        if (mode === this._new_mode)
            this.onModeChange(mode);
    }.bind(this));

    this.setMode(this.mode_path, options.mode.options);
});

Editor.prototype.setMode = log.wrap(function (mode_path, options) {
    var mode;
    var onload = log.wrap(function (mode_module) {
        this._new_mode = new mode_module.Mode(options);
    }).bind(this);

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

    var wed_options = mode.getWedOptions();

    if (!this._processWedOptions(wed_options))
        return;

    var styles = this.mode.getStylesheets();
    for(var style_ix = 0, style; (style = styles[style_ix]) !== undefined;
        ++style_ix)
        this.$frame.children("head").append(
            '<link rel="stylesheet" href="' + require.toUrl(style) +
                '" type="text/css" />');

    this.$gui_root.css("overflow-y", "auto");
    this._resizeHandler();

    this.gui_root.setAttribute("tabindex", "-1");
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

Editor.prototype._processWedOptions = function(options) {
    var terminate = function () {
        this._limitation_modal.setBody(
            "<p>The mode you are trying to use is passing incorrect " +
                "options to wed. Contact the mode author with the " +
                "following information: </p>" +
                "<ul><li>" + errors.join("</li><li>") + "</li></ul>");
        this._limitation_modal.modal(function () {
            window.location.reload();
        });
        this.destroy();
        return false;
    }.bind(this);

    var template = {
        metadata: {
            name: true,
            authors: true,
            description: true,
            license: true,
            copyright: true
        },
        label_levels: {
            max: true,
            initial: true
        }
    };

    var ret = object_check.check(template, options);

    var errors = [];

    var name;
    if (ret.missing) {
        ret.missing.forEach(function (name) {
            errors.push("missing option: " + name);
        });
    }

    if (ret.extra) {
        ret.extra.forEach(function (name) {
            errors.push("extra option: " + name);
        });
    }

    if (errors.length)
        return terminate();

    this.max_label_level = options.label_levels.max;
    if (this.max_label_level < 1)
        errors.push("label_levels.max must be >= 1");

    this._current_label_level = this.max_label_level;

    var initial = options.label_levels.initial;
    if (initial > this.max_label_level)
        errors.push("label_levels.initial must be < label_levels.max");
    if (initial < 1)
        errors.push("label_levels.initial must be >= 1");

    while(this._current_label_level > initial)
        this.decreaseLabelVisiblityLevel();

    if (errors.length)
        return terminate();

    return true;
};

Editor.prototype._postInitialize = log.wrap(function  () {
    if (this._destroyed)
        return;

    // Make the validator revalidate the structure from the point
    // where a change occurred.
    this.domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap, .wed-document",
        function ($root, $added, $removed, $prev, $next, $target) {
        if ($added.is("._real, ._phantom_wrap") ||
            $added.filter(jqutil.textFilter).length ||
            $removed.is("._real, ._phantom_wrap") ||
            $removed.filter(jqutil.textFilter).length) {
            this._last_done_shown = 0;
            this.validator.restartAt($target[0]);
        }
    }.bind(this));

    this.decorator = this.mode.makeDecorator(this.domlistener,
                                             this, this._gui_updater);

    this.decorator.addHandlers();

    this.domlistener.addHandler(
        "included-element",
        "._label",
        function ($root, $tree, $parent, $prev, $next, $target) {
        var cl = $target[0].classList;
        var found = false;
        for(var i = 0; i < cl.length && !found; ++i) {
            if (cl[i].lastIndexOf("_label_level_", 0) === 0) {
                found = Number(cl[i].slice(13));
            }
        }
        if (!found)
            throw new Error("unable to get level");
        if (found > this._current_label_level)
            $target.hide();
        else
            $target.show();
    }.bind(this));

    // If an element is edited and contains a placeholder, delete
    // the placeholder
    this._updating_placeholder = 0;
    this.domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap",
        function ($root, $added, $removed, $prev, $next, $target) {
        if (this._updating_placeholder)
            return;

        this._updating_placeholder++;

        var $to_consider = $target.contents().filter(function () {
            return jqutil.textFilter.call(this) ||
                $(this).is('._real, ._phantom._text, ._phantom_wrap');
        });
        var ph;
        // Narrow it to the elements we care about.
        if ($to_consider.length === 0 ||
                ($to_consider.length === 1 && $to_consider.is($removed))) {
            if ($target.children("._placeholder").length === 0)
            {
                var target = $target[0];
                var nodes = this.mode.nodesAroundEditableContents(target);
                ph = this.mode.makePlaceholderFor(target)[0];
                this._gui_updater.insertBefore(target, ph, nodes[1]);
            }
        }
        else {
            ph = $target.children("._placeholder").not("._transient")[0];
            if (ph)
                this._gui_updater.removeNode(ph);
        }

        this._updating_placeholder--;
    }.bind(this));

    this.domlistener.addHandler(
        "included-element",
        "._real, ._phantom_wrap",
        function ($root, $tree, $parent, $prev, $next, $target) {
        if (this._updating_placeholder)
            return;

        if ($target.children("._placeholder").length !== 0)
            return;

        this._updating_placeholder++;

        var $to_consider = $target.contents().filter(function () {
            return jqutil.textFilter.call(this) ||
                $(this).is('._real, ._phantom._text, ._phantom_wrap');
        });
        if ($to_consider.length === 0) {
            var target = $target[0];
            var nodes = this.mode.nodesAroundEditableContents(target);
            var ph = this.mode.makePlaceholderFor(target)[0];
            this._gui_updater.insertBefore(target, ph, nodes[1]);
        }

        this._updating_placeholder--;
    }.bind(this));


    this.domlistener.addHandler(
        "excluded-element",
        "*",
        function ($root, $tree, $parent, $prev, $next, $element) {
        // Mark our placeholder as dying.
        if ($element.is("._placeholder"))
            $element.addClass("_dying");

        if (!this._sel_focus)
            return; // no caret to move

        var container = this._sel_focus.node;
        var $container = $(container);
        if ($container.closest($element).length > 0) {
            var parent = $parent[0];
            // We must move the caret to a sane position.
            if ($prev.length > 0 && $prev.closest($root).length > 0 &&
                $parent.closest($root).length > 0)
                this.setGUICaret(parent, _indexOf.call(parent.childNodes,
                                                       $prev[0]) + 1);
            else if ($next.length > 0 && $next.closest($root).length > 0 &&
                     $parent.closest($root).length > 0)
                this.setGUICaret(parent,
                                 _indexOf.call(parent.childNodes, $next[0]));
            else if ($parent.closest($root).length > 0)
                this.setGUICaret(parent, parent.childNodes.length);
            else {
                // There's nowhere sensible to put it
                this._sel_focus = undefined;
                this._sel_anchor = undefined;
                this._refreshFakeCaret();
                this._caretChange();
            }
        }
    }.bind(this));

    this.decorator.startListening(this.$gui_root);

    // Drag and drop not supported.
    this.$gui_root.on("dragenter", "*", false);
    this.$gui_root.on("dragstart", "*", false);
    this.$gui_root.on("dragover", "*", false);
    this.$gui_root.on("drop", "*", false);

    this.$gui_root.on('wed-global-keydown',
                      this._globalKeydownHandler.bind(this));

    this.$gui_root.on('wed-global-keypress',
                      this._globalKeypressHandler.bind(this));

    this.$gui_root.on('keydown', this._keydownHandler.bind(this));
    this.$gui_root.on('keypress', this._keypressHandler.bind(this));

    this.$gui_root.on('scroll', this._refreshFakeCaret.bind(this));

    this._$input_field.on('keydown', this._keydownHandler.bind(this));
    this._$input_field.on('keypress', this._keypressHandler.bind(this));

    this._$input_field.on('compositionstart compositionupdate compositionend',
                      this._compositionHandler.bind(this));
    this._$input_field.on('input', this._inputHandler.bind(this));

    // No click in the next binding because click does not
    // distinguish left, middle, right mouse buttons.
    this.$gui_root.on('mousedown', this._mousedownHandler.bind(this));

    // Give the boot to the default handler.
    this.$gui_root.on('contextmenu', false);

    this.$gui_root.on('paste', log.wrap(this._pasteHandler.bind(this)));
    this._$input_field.on('paste', log.wrap(this._pasteHandler.bind(this)));

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
        return false;
    }.bind(this));

    // This is a guard to make sure that mousemove handlers are
    // removed once the button is up again.
    var $body = $('body', this.my_window.document);
    $body.on('mouseup.wed', function (ev) {
        this.$gui_root.off('mousemove.wed mouseup');
        this._$caret_layer.off('mousemove mouseup');
    }.bind(this));

    $body.on('click.wed', function (ev) {
        // If the click is triggered programmatically ``pageX`` and
        // ``pageY`` won't be defined. If the click is triggered due
        // to an ENTER key converted by the browser, one or both will
        // be negative. Or screenX, screenY will both be zero.
        if (ev.pageX === undefined || ev.pageX < 0 ||
            ev.pageY === undefined || ev.pageY < 0 ||
            ((ev.screenX === ev.screenY) && (ev.screenX === 0)))
            return;

        var el = this.my_window.document.elementFromPoint(ev.clientX,
                                                          ev.clientY);

        if ($(el).closest(this._$excluded_from_blur).length)
            return;

        var offset = this.$gui_root.offset();
        var x = ev.pageX - offset.left;
        var y = ev.pageY - offset.top;

        if (!((x >= 0) && (y >= 0) &&
              (x < this.$gui_root.outerWidth()) &&
              (y < this.$gui_root.outerHeight())))
            this._blur();
        // We don't need to do anything special to focus the editor.
    }.bind(this));

    $(this.my_window).on('blur.wed', this._blur.bind(this));
    $(this.my_window).on('focus.wed', this._focus.bind(this));

    this._$caret_layer.on("mousedown click contextmenu",
                          this._caretLayerMouseHandler.bind(this));

    // Make ourselves visible.
    this.$widget.removeClass("loading");
    this.$widget.css("display", "block");


    // If the document is empty create a child node with the absolute
    // namespace mappings.
    if (this.gui_root.childNodes.length === 0) {
        var attrs = Object.create(null);
        this.validator.getSchemaNamespaces().forEach(function (ns) {
            var k = this.resolver.prefixFromURI(ns);
            if (k === "")
                attrs.xmlns = ns;
            else
                attrs["xmlns:" + k] = ns;
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
    else {
        var namespaces = this.validator.getDocumentNamespaces();
        var fail = false;

        // Yeah, we won't stop as early as possible if there's a failure.
        // So what?
        var resolver = this.resolver;
        Object.keys(namespaces).forEach(function (prefix) {
            var uri = namespaces[prefix];
            if (uri.length > 1)
                fail = true;

            resolver.definePrefix(prefix, uri[0]);
        });

        if (fail) {
            this._limitation_modal.setBody(
                "The document you are trying to edit uses namespaces in a " +
                "way not supported by this version of wed.");
            this._limitation_modal.modal(function () {
                var s = window.location.search;
                if (!s)
                    window.location.reload();
                else {
                    // We want to remove the file= parameter so that
                    // the user does not try to reload the same file.
                    s = s.slice(1); // drop the initial "?"
                    var parts = s.split("&");
                    s = "?";
                    for(var i = 0; i < parts.length; ++i) {
                        var p = parts[i];
                        if (p.lastIndexOf("file=", 0) !== 0) {
                            s += p;
                            if (i < parts.length - 1)
                                s += "&";
                        }
                    }
                    window.location.search = s;
                }


            });
            this.destroy();
            return;
        }
    }

    this.domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo = new undo.UndoList();

    this.$gui_root.focus();

    this.validator.start();

    this._setCondition("initialized", {editor: this});
});

/**
 * @param {module:transformation~Transformation} tr The transformation
 * to fire.
 * @param transformation_data Arbitrary data to be passed to the
 * transformation. This corresponds to the ``transformation_data``
 * field of a transformation {@link
 * module:transformation~Transformation~handler handler}.
 */
Editor.prototype.fireTransformation = function(tr, transformation_data) {
    // This is necessary because our context menu saves/restores the
    // selection using rangy. If we move on without this call, then
    // the transformation could destroy the markers that rangy put in
    // and rangy will complain.
    this.dismissContextMenu();
    var current_group = this._undo.getGroup();
    if (current_group instanceof wundo.TextUndoGroup)
            this._undo.endGroup();

    this._undo.startGroup(
        new wundo.UndoGroup("Undo " + tr.getDescriptionFor(transformation_data),
                            this));
    try {
        try {
            // We've separated the core of the work into a another method so
            // that it can be optimized.
            this._fireTransformation(tr, transformation_data);
        }
        catch(ex) {
            // We want to log it before we attempt to do anything else.
            if (!(ex instanceof AbortTransformationException))
                log.handle(ex);
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

Editor.prototype._fireTransformation = function(tr, transformation_data) {
    var node = transformation_data.node;
    if (node !== undefined) {
        var $node = $(node);
        // Convert the gui node to a data node
        if ($node.closest(this.$gui_root).length > 0) {
            var path = this.nodeToPath(node);
            transformation_data.node = this.data_updater.pathToNode(path);
        }
        else if ($node.closest(this.$data_root).length === 0)
            throw new Error("node is neither in the gui tree nor "+
                            "the data tree");
    }

    var caret = transformation_data.move_caret_to;
    if (caret) {
        switch(caret.root) {
        case this.gui_root:
            this.setGUICaret(caret);
            break;
        case this.data_root:
            this.setDataCaret(caret);
            break;
        default:
            throw new Error("caret outside GUI and data trees");
        }
    }

    if (this._sel_focus === undefined)
        throw new Error("transformation applied with undefined caret.");

    tr.handler(this, transformation_data);
    // Ensure that all operations that derive from this
    // transformation are done *now*.
};


Editor.prototype.recordUndo = function (undo) {
    this._undo.record(undo);
};

Editor.prototype.undo = function () {
    this._undo_recorder.suppressRecording(true);
    this._undo.undo();
    this._undo_recorder.suppressRecording(false);
};

Editor.prototype.redo = function () {
    this._undo_recorder.suppressRecording(true);
    this._undo.redo();
    this._undo_recorder.suppressRecording(false);
};

Editor.prototype.dumpUndo = function () {
    console.log(this._undo.toString());
};

Editor.prototype.dumpCaretInfo = function () {
    var data_caret = this.getDataCaret();

    if (data_caret)
        console.log("data caret", data_caret.node, data_caret.offset);
    else
        console.log("no data caret");

    if (data_caret)
        console.log("data closest real",
                    $(data_caret.node).closest("._real"));

    if (this._sel_anchor)
        console.log("selection anchor",
                    this._sel_anchor.node, this._sel_anchor.offset);
    else
        console.log("no selection anchor");

    if (this._sel_focus)
        console.log("selection focus",
                    this._sel_focus.node, this._sel_focus.offset);
    else
        console.log("no selection focus");

    if (this._sel_focus)
        console.log("selection focus closest real",
                    $(this._sel_focus.node).closest("._real"));

    domutil.dumpRange("DOM range: ", this._getDOMSelectionRange());
    console.log("input field location", this._$input_field.css("top"),
                this._$input_field.css("left"));
    console.log("document.activeElement", document.activeElement);
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
        height_after += this.scrollHeight;
    }

    var $examine = this.$widget;
    while($examine.length > 0) {
        var $next = $examine.nextAll().not("script");
        $next.each(addHeight);
        $examine = $examine.parent();
    }

    this._$wed_location_bar.each(addHeight);

    // The height is the inner height of the window:
    // a. minus what appears before it.
    // b. minus what appears after it.
    var height = this.my_window.innerHeight -
            // This is the space before
            this.$gui_root.offset().top -
            // This is the space after
            height_after;

    height = Math.floor(height);

    this.$gui_root.css("max-height", height);
    this.$gui_root.css("min-height", height);

    var width = this.$gui_root.width();

    var $parent = this.$widget.find(".wed-frame");
    var pheight = this.my_window.innerHeight -
        $parent.offset().top - height_after;
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
    var $a = $(
        "<a tabindex='0' href='#'><i class='icon icon-book'></i> " +
            "Element's documentation.</a>");
    $a.click(function () {
        this.openDocumentationLink(doc_url);
    }.bind(this));
    return $a[0];
};


Editor.prototype._contextMenuHandler = function (e) {
    if (!this._sel_focus)
        return false;

    var range = this.getSelectionRange();

    var originally_collapsed = !(range && !range.collapsed);
    if (!originally_collapsed && !domutil.isWellFormedRange(range))
        return false;

    var node = this._sel_focus.node;
    var offset = this._sel_focus.offset;
    if (node.nodeType !== Node.ELEMENT_NODE) {
        var parent = node.parentNode;
        offset = _indexOf.call(parent.childNodes, node);
        node = parent;
    }

    // Move out of any placeholder
    var ph = $(node).closest("._placeholder")[0];
    if (ph) {
        offset = _indexOf.call(ph.parentNode.childNodes, ph);
        node = ph.parentNode;
    }

    var menu_items = [];

    function pushItem(data, tr) {
        var icon = tr.getIcon();
        var $a = $("<a tabindex='0' href='#'>" + (icon ? icon + " ": "") +
                   tr.getDescriptionFor(data) + "</a>");
        $a.click(data, tr.bound_terminal_handler);
        menu_items.push($("<li></li>").append($a)[0]);
    }

    var tr_ix, tr;
    if (!node.classList.contains("_phantom") &&
        // Should not be part of a gui element.
        !node.parentNode.classList.contains("_gui")) {

        // We want the data node, not the gui node.
        var data_node = this.toDataNode(node);
        var orig = getOriginalName(data_node);

        var doc_url = this.mode.documentationLinkFor(orig);

        if (doc_url) {
            var a = this.makeDocumentationLink(doc_url);
            menu_items.push($("<li></li>").append(a)[0]);
        }

        // We want to wrap if we have an actual range
        var wrap = !originally_collapsed;
        this.validator.possibleAt(
            data_node, offset).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag")
                    return;

                var unresolved = this.resolver.unresolveName(
                    ev.params[1], ev.params[2]);

                var trs = this.mode.getContextualActions(
                    wrap ? "wrap" : "insert", unresolved, data_node, offset);

                for(tr_ix = 0; (tr = trs[tr_ix]) !== undefined; ++tr_ix)
                    pushItem({element_name: unresolved}, tr);
            }.bind(this));

        if (data_node !== this.data_root.firstChild) {
            var trs = this.mode.getContextualActions(
                ["unwrap", "delete-parent"], orig, data_node, 0);
            for(tr_ix = 0; (tr = trs[tr_ix]) !== undefined; ++tr_ix)
                pushItem({node: data_node, element_name: orig }, tr);
        }
    }

    var items = this.mode.getContextualMenuItems();
    items.forEach(function (item) {
        var $a = $("<a tabindex='0' href='#'>"+ item[0] + "</a>");
        $a.click(item[1], item[2]);
        menu_items.push($("<li>").append($a)[0]);
    });

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
             "prepend"], sep_for, transformation_node, 0);
        trs.forEach(function (tr) {
            pushItem({node: transformation_node, element_name: sep_for}, tr);
        }.bind(this));
    }

    // There's no menu to display, so let the event bubble up.
    if (menu_items.length === 0)
        return true;

    var pos = this.computeContextMenuPosition(e);
    this.displayContextMenu(pos.left, pos.top, menu_items);
    return false;
};

/**
 * Computes where a context menu should show up, depending on the
 * event that triggered it.
 *
 * @param {Event} e The event that triggered the menu.
 * @returns {{top: number, left: number}} The top and left coordinates
 * where the menu should appear.
 */
Editor.prototype.computeContextMenuPosition = function (e) {
    var pos;
    if (e.type === "mousedown" || e.type === "mouseup" || e.type === "click")
        pos = {left: e.clientX, top: e.clientY};
    // The next conditions happen only if the user is using the keyboard
    else if (this._$fake_caret.parent()[0]) {
        var rel_pos = this._positionFromGUIRoot(this._$fake_caret);
        this.scrollIntoView(rel_pos.left, rel_pos.top,
                            rel_pos.left + this._$fake_caret.outerWidth(),
                            rel_pos.top + this._$fake_caret.outerHeight());
        pos = this._$fake_caret.offset();
        // Adjust for scrolling...
        pos.left -= $(this.my_window.document).scrollLeft();
        pos.top -= $(this.my_window.document).scrollTop();
        // Middle of the caret.
        pos.top += this._$fake_caret.height() / 2;
    }
    else {
        var $gui = $(this._sel_focus.node).closest("._gui");
        if ($gui[0]) {
            pos = $gui.offset();
            // Adjust for scrolling...
            pos.left -= $(this.my_window.document).scrollLeft();
            pos.top -= $(this.my_window.document).scrollTop();
            // Middle of the region.
            pos.top += $gui.height() / 2;
            pos.left += $gui.width() / 2;
        }
        else
            // No position.
            throw new Error("no position for displaying the menu");
    }

    return pos;
};

Editor.prototype.computeContextMenuHeight = function (y) {
    var gui_position = this.$gui_root.offset();
    var gui_height = this.$gui_root.height();
    // Subtract the gui_root-relative position from the total height
    // of the gui_root.
    var max_height = gui_height - (y - gui_position.top);
    return max_height;
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

function cut(editor, data) {
    var range = editor._getDOMSelectionRange();
    if (!domutil.isWellFormedRange(range))
        throw new Error("malformed range");

    var start_caret = editor.toDataLocation(range.startContainer,
                                            range.startOffset);
    var end_caret = editor.toDataLocation(range.endContainer, range.endOffset);
    var cut_ret = editor.data_updater.cut(start_caret, end_caret);
    editor._$cut_buffer.empty();
    editor._$cut_buffer.append(cut_ret[1]);
    editor.setDataCaret(cut_ret[0]);
    range = editor.my_window.document.createRange();
    var container = editor._$cut_buffer[0];
    range.setStart(container, 0);
    range.setEnd(container,  container.childNodes.length);
    var sel = editor.my_window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // We've set the range to the cut buffer, which is what we want
    // for the cut operation to work. However, the focus is also set
    // to the cut buffer but once the cut is done we want the focus to
    // be back to our caret, so...
    setTimeout(function () {
        editor._focusInputField();
    }, 0);
}

Editor.prototype._pasteHandler = function(e) {
    var caret = this.getDataCaret();
    if (caret === undefined)
        return false; // XXX alert the user?

    // IE puts the clipboardData as a object on the window.
    var cd = e.originalEvent.clipboardData || this.my_window.clipboardData;

    // If cd.types is set, we assume that calling getData("text/html")
    // is safe. If not, then we assume that the browser does not
    // support getting HTML out of the clipboard data. (This is
    // definitely the case for IE.)
    var as_html = cd.types ? cd.getData("text/html") : false;

    var $data = $("<div class='_real'>");
    if (as_html) {
        // Create a DOM fragment from it.
        $data.append(as_html);

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

        // If we end up with no elements, treat it as text.
        if ($data.children().length === 0)
            as_html = false;
        else {
            // Otherwise, check whether it is valid.
            var errors = this.validator.speculativelyValidate(
                caret, $data.contents().toArray());
            if (errors) {
                this._paste_modal.modal(function () {
                    if (this._paste_modal.getClickedAsText() === "Yes") {
                        $data = $("<div class='_real'>");
                        $data.append(document.createTextNode(
                            cd.getData("text/plain")));
                        // At this point $data is a single top level
                        // fake <div> element which contains the
                        // contents we actually want to paste.
                        this.fireTransformation(this.paste_tr,
                                                {node: caret.node,
                                                 $data: $data, e: e});
                    }
                }.bind(this));
                return false;
            }
        }

    }

    if (!as_html) {
        $data = $("<div class='_real'>");
        // Again, browsers that have cd.types behave differetly...
        // *sigh*...
        $data.append(cd.getData(cd.types ? "text/plain" : "text"));
    }

    // At this point $data is a single top level fake <div> element
    // which contains the contents we actually want to paste.
    this.fireTransformation(this.paste_tr,
                            {node: caret.node, $data: $data, e: e});
    return false;
};


function paste(editor, data) {
    var $data = data.$data;
    var $data_clone = $data.clone();
    var caret = editor.getDataCaret();
    var wrapper = $data[0];
    var new_caret, ret;
    if (wrapper.childNodes.length === 1 &&
        wrapper.firstChild.nodeType === Node.TEXT_NODE) {
        ret = editor.data_updater.insertText(caret, wrapper.firstChild.data);
        new_caret = (ret[0] === ret[1]) ?
            caret.make(caret.node,
                       caret.offset + wrapper.firstChild.length) :
            caret.make(ret[1], ret[1].length);
    }
    else {
        var frag = document.createDocumentFragment();
        $data.contents().each(function () {
            frag.appendChild(this);
        });
        switch(caret.node.nodeType) {
        case Node.TEXT_NODE:
            var parent = caret.node.parentNode;
            ret = editor.data_updater.insertIntoText(caret, frag);
            new_caret = ret[1];
            break;
        case Node.ELEMENT_NODE:
            var child = caret.node.childNodes[caret.offset];
            var after =  child ? child.nextSibling : null;
            editor.data_updater.insertBefore(caret.node, frag, child);
            new_caret = caret.make(caret.node,
                                   after ? _indexOf.call(caret.node.childNodes,
                                                         after) :
                                   caret.node.childNodes.length);
            break;
        default:
            throw new Error("unexpected node type: " + caret.node.nodeType);
        }
    }
    editor.setDataCaret(new_caret);
    editor.$gui_root.trigger('wed-post-paste', [data.e, caret, $data_clone]);
}

Editor.prototype.caretPositionRight = function () {
    return this.positionRight(this._sel_focus);
};

Editor.prototype.positionRight = function (pos) {
    if (pos === undefined || pos === null)
        return undefined; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos.node).closest("._gui")[0];
    if (closest_gui !== undefined)
        pos = pos.make(closest_gui, closest_gui.childNodes.length);

    // If we are in a placeholder node, immediately move out of it.
    var closest_ph = $(pos.node).closest("._placeholder")[0];
    if (closest_ph !== undefined)
        pos = pos.make(closest_ph.parentNode,
                       _indexOf.call(closest_ph.parentNode.childNodes,
                                     closest_ph) + 1);

    while(true)
    {
        pos = pos.make(
            domutil.nextCaretPosition(pos.toArray(),
                                      this.gui_root.firstChild,
                                      false));
        if (!pos)
            break;

        var $node = $(pos.node);
        closest_gui = $node.closest("._gui:visible")[0];
        if (closest_gui !== undefined) {
            // Stopping in a gui element is fine, but normalize the
            // position to the start of the gui element.
            pos = pos.make(closest_gui, 0);
            break;
        }

        // Can't stop inside a phantom node.
        var closest_phantom = $node.closest("._phantom")[0];
        if (closest_phantom) {
            // This ensures the next loop will move after the phantom.
            pos = pos.make(closest_phantom, closest_phantom.childNodes.length);
            continue;
        }

        // Or beyond the first position in a placeholder node.
        var closest_ph = $node.closest("._placeholder")[0];
        if (closest_ph && pos.offset > 0) {
            // This ensures the next loop will move after the placeholder.
            pos = pos.make(closest_ph, closest_ph.childNodes.length);
            continue;
        }

        // Make sure the position makes sense from an editing
        // standpoint.
        if (pos.node.nodeType === Node.ELEMENT_NODE) {
            var next_node = pos.node.childNodes[pos.offset];

            // Always move into text
            if (next_node && next_node.nodeType === Node.TEXT_NODE)
                continue;

            var prev_node = pos.node.childNodes[pos.offset - 1];
            // Stop between two decorated elements.
            if (next_node && prev_node &&
                next_node.nodeType === Node.ELEMENT_NODE &&
                prev_node.nodeType === Node.ELEMENT_NODE &&
                $(next_node.firstChild).is("._gui:visible") &&
                $(prev_node.lastChild).is("._gui:visible"))
                break;

            var $prev_node = $(prev_node);
            if (next_node !== undefined &&
                // We do not stop in front of element nodes.
                (next_node.nodeType === Node.ELEMENT_NODE &&
                 !$(next_node).is("._end_wrapper") &&
                 !$prev_node.is("._start_wrapper")) ||
                $prev_node.is("._wed-validation-error, ._gui.__end_label"))
                continue; // can't stop here

            var nodes = this.mode.nodesAroundEditableContents(pos.node);

            // If the element has nodes before editable contents and
            // the caret would be before or among such nodes, then ...
            if (nodes[0] &&
                _indexOf.call(pos.node.childNodes, nodes[0]) >= pos.offset)
                continue; // ... can't stop here.

            // If the element has nodes after editable contents and
            // the caret would be after or among such nodes, then ...
            if (nodes[1] &&
                (_indexOf.call(pos.node.childNodes, nodes[1]) < pos.offset))
                continue; // ... can't stop here.
        }

        // If we get here, the position is good!
        break;
    }

    return pos || undefined;
};

Editor.prototype.caretPositionLeft = function () {
    return this.positionLeft(this._sel_focus);
};

Editor.prototype.positionLeft = function (pos) {
    if (pos === undefined || pos === null)
        return undefined; // nothing to be done

    // If we are in a gui node, immediately move out of it
    var closest_gui = $(pos.node).closest("._gui")[0];
    if (closest_gui !== undefined)
        pos = pos.make(closest_gui, 0);

    // If we are in a placeholder node, immediately move out of it.
    var closest_ph = $(pos.node).closest("._placeholder")[0];
    if (closest_ph !== undefined)
        pos = pos.make(closest_ph.parentNode,
                       _indexOf.call(closest_ph.parentNode.childNodes,
                                     closest_ph));

    while(true)
    {
        pos = pos.make(
            domutil.prevCaretPosition(pos.toArray(),
                                      this.gui_root.firstChild, false));
        if (!pos)
            break;

        var $node = $(pos.node);
        closest_gui = $node.closest("._gui:visible")[0];
        if (closest_gui !== undefined) {
            // Stopping in a gui element is fine, but normalize
            // the position to the start of the gui element.
            pos = pos.make(closest_gui, 0);
            break;
        }

        var $closest_ph = $node.closest("._placeholder");
        if ($closest_ph.length > 0) {
            // Stopping in a placeholder is fine, but normalize
            // the position to the start of the text.
            pos = pos.make($closest_ph[0].firstChild, 0);
            break;
        }

        // Can't stop inside a phantom node.
        var closest_phantom = $node.closest("._phantom")[0];
        if (closest_phantom !== undefined)
        {
            // Setting the position to this will ensure that on the
            // next loop we move to the left of the phantom node.
            pos = pos.make(closest_phantom, 0);
            continue;
        }

        // Make sure the position makes sense from an editing
        // standpoint.
        if (pos.node.nodeType === Node.ELEMENT_NODE) {
            var prev_node = pos.node.childNodes[pos.offset - 1];

            // Always move into text
            if (prev_node && prev_node.nodeType === Node.TEXT_NODE)
                continue;

            var next_node = pos.node.childNodes[pos.offset];
            // Stop between two decorated elements.
            if (next_node && prev_node &&
                next_node.nodeType === Node.ELEMENT_NODE &&
                prev_node.nodeType === Node.ELEMENT_NODE &&
                $(next_node.firstChild).is("._gui:visible") &&
                $(prev_node.lastChild).is("._gui:visible"))
                break;

            var $next_node = $(next_node);
            if (prev_node !== undefined &&
                // We do not stop just before a start tag button.
                (prev_node.nodeType === Node.ELEMENT_NODE &&
                 !$(prev_node).is("._start_wrapper") &&
                 !$next_node.is("._end_wrapper")) ||
                // Can't stop right before a validation error.
                $next_node.is("._gui.__start_label, .wed-validation-error"))
                continue; // can't stop here

            var nodes = this.mode.nodesAroundEditableContents(pos.node);

            // If the element has nodes before editable contents and
            // the caret would be before or among such nodes, then ...
            if (nodes[0] &&
                _indexOf.call(pos.node.childNodes, nodes[0]) >= pos.offset)
                continue; // ... can't stop here.

            // If the element has nodes after editable contents and
            // the caret would be after or among such nodes, then ...
            if (nodes[1] &&
                (_indexOf.call(pos.node.childNodes, nodes[1]) < pos.offset))
                continue; // ... can't stop here.

        }

        // If we get here, the position is good!
        break;
    }

    return pos || undefined;
};

Editor.prototype.moveCaretRight = function () {
    var pos = this.caretPositionRight();
    if (pos)
        this.setGUICaret(pos);
};

Editor.prototype.moveCaretLeft = function () {
    var pos = this.caretPositionLeft();
    if (pos)
        this.setGUICaret(pos);
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
    var vtop = this.$gui_root.scrollTop();
    var vheight = this.$gui_root.height();
    var vbottom = vtop + vheight;

    if (top < vtop || bottom > vbottom) {
        // Not already in view.
        vtop = top < vtop ? top : bottom - vheight;
        this.$gui_root.scrollTop(vtop);
    }

    var vleft = this.$gui_root.scrollLeft();
    var vwidth = this.$gui_root.width();
    var vright = vleft + vwidth;

    if (left < vleft || right > vright) {
        // Not already in view.
        vleft = left < vleft ? left : right - vwidth;
        this.$gui_root.scrollLeft(vleft);
    }

    // Then adjust the window.
    var $doc = $(this.my_window.document);
    var scroll_top = $doc.scrollTop();
    var scroll_left = $doc.scrollLeft();

    // Client coordinates of gui_root.
    var gui_pos = this.$gui_root.offset();
    gui_pos.top -= scroll_top;
    gui_pos.left -= scroll_left;

    // Compute the coordinates relative to the client.
    left = left - vleft + gui_pos.left;
    right = right - vleft + gui_pos.left;
    top = top - vtop + gui_pos.top;
    bottom = bottom - vtop + gui_pos.top;

    var sheight = this.my_window.document.body.scrollHeight;
    var swidth = this.my_window.document.body.scrollWidth;

    var by_y = 0;
    if (top < 0 || bottom > sheight)
        by_y = top < 0 ? top : bottom;

    var by_x = 0;
    if (left < 0 || right > swidth)
        by_x = left < 0 ? left : right;

    this.my_window.scrollBy(by_x, by_y);
};

Editor.prototype.setGUICaret = function (loc, offset, force_fake, text_edit) {
    // Accept a single array as argument
    var node;
    if (loc instanceof DLoc) {
        offset = loc.offset;
        node = loc.node;
        force_fake = arguments[1];
        text_edit = arguments[2];
    }
    else {
        node = loc;
        loc = makeDLoc(this.gui_root, node, offset);
    }

    // Don't update if noop.
    if (this._sel_focus &&
        this._sel_anchor === this._sel_focus &&
        this._sel_focus.node === node &&
        this._sel_focus.offset === offset)
        return;

    // We set a fake caret.
    this._clearDOMSelection();
    this._sel_anchor = loc;
    this._sel_focus = this._sel_anchor;
    this._refreshFakeCaret();
    this._focusInputField();
    this._caretChange(text_edit);
};

Editor.prototype._focusInputField = function () {
    // The call to blur here is here ***only*** to satisfy Chrome 29!
    this._$input_field.blur();
    this._$input_field.focus();
};

Editor.prototype._blur = log.wrap(function (ev) {
    if (!this._sel_focus)
        return;
    this._sel_anchor_at_blur = this._sel_anchor;
    this._sel_focus_at_blur = this._sel_focus;

    this._$input_field.blur();
    this._sel_anchor = undefined;
    this._sel_focus = undefined;
    this._refreshFakeCaret();
});

/**
 * Registers elements that are outside wed's editing pane but should
 * be considered to be part of the editor. These would typically be
 * menus or toolbars that a larger application that uses wed for
 * editing adds around the editing pane.
 *
 * @param {Node|jQuery|Array.<Node>} elements The elements to
 * register.
 */
Editor.prototype.excludeFromBlur = function(elements) {
    this._$excluded_from_blur.add(elements);
};

Editor.prototype._focus = log.wrap(function (ev) {
    if (this._sel_anchor_at_blur) {
        this._sel_anchor = this._sel_anchor_at_blur;
        this._sel_focus = this._sel_focus_at_blur;
        // If something has scrolled the editor pane between the loss
        // of focus and our regaining it, we should preserve the
        // scrolling. In particular, this happens in Chrome when the
        // user uses the search function to search text on the
        // page. Chrome will scroll the page to the hit. Without
        // keeping the scroll intact, then the user loses their
        // position when they click into the window to (for instance)
        // select the hit.
        var top = this.$gui_root.scrollTop();
        var left = this.$gui_root.scrollLeft();
        this._restoreCaretAndSelection();
        this.$gui_root.scrollTop(top);
        this.$gui_root.scrollLeft(left);
        this._sel_anchor_at_blur = undefined;
        this._sel_focus_at_blur = undefined;
    }
});

Editor.prototype._refreshFakeCaret = function () {
    var node, offset;
    if (this._sel_focus) {
        node = this._sel_focus.node;
        offset = this._sel_focus.offset;
    }

    if (!this._sel_focus ||
        // If we are in a _gui element, then the element itself changes to
        // show the caret position.
        $(node).closest("._gui").length > 0) {
        this._$fake_caret.detach();
        // Just move it offscreen.
        this._$input_field.css("top", "");
        this._$input_field.css("left", "");
        return;
    }

    var position, height;
    switch (node.nodeType)
    {
    case Node.TEXT_NODE:
        var parent = node.parentNode;
        var prev = node.previousSibling;
        var next = node.nextSibling;
        domutil.insertIntoText(node, offset, this._fc_mark);
        break;
    case Node.ELEMENT_NODE:
        node.insertBefore(this._fc_mark, node.childNodes[offset] || null);
        break;
    default:
        throw new Error("unexpected node type: " + node.nodeType);
    }

    // Why use `offset()` rather than `position()`? This allows modes
    // more flexibility with how they position their decorations. For
    // instance, if a mode uses `position: relative`, they create
    // through this CSS a new "offset parent" and `position()` returns
    // values relative to this parent rather than relative to
    // $gui_root.
    position = this._$fc_mark.offset();

    //
    // The position is relative to the *document*. We need to make it
    // relative to the start of $gui_root. Using `position()` above
    // would obviate the need for this adjustment. So why `offset()`?
    // See above for the rationale.
    //
    var gr_position = this.$gui_root.offset();
    position.top -= gr_position.top;
    position.left -= gr_position.left;

    height = this._$fc_mark.height();

    if (node.nodeType === Node.TEXT_NODE) {
        // node was deleted from the DOM tree by the insertIntoText
        // operation, we need to bring it back.

        // We delete everything after what was prev to the original
        // node, and before what was next to it.
        var delete_this = prev ? prev.nextSibling : parent.firstChild;
        while(delete_this !== next) {
            parent.removeChild(delete_this);
            delete_this = prev ? prev.nextSibling : parent.firstChild;
        }
        parent.insertBefore(node, next || null);
    }
    else
        this._$fc_mark.remove();

    // Restore the range.
    var rr = this._sel_anchor.makeRange(this._sel_focus);
    this._setDOMSelectionRange(rr.range, rr.reversed);

    this._$fake_caret.css("top", position.top);
    this._$fake_caret.css("left", position.left);
    this._$fake_caret.css("height", height);
    this._$fake_caret.css("max-height", height);
    this._$fake_caret.css("min-height", height);

    // The fake caret is removed from the DOM when not in use, reinsert it.
    if (!this._$fake_caret.parent()[0])
        this._$caret_layer.append(this._$fake_caret);

    this._$input_field.css("top", position.top);
    this._$input_field.css("left", position.left);
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
        var $tt = $("div.tooltip").first();
        if ($tt[0]) {
            var for_el = $tt.data("wed-tooltip-for");
            var data = $(for_el).data("bs.tooltip");
            if (data) {
                data.leave(data);
                return terminate();
            }
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
    else if (key_constants.SPACE.matchesEvent(e)) {
        caret = this.getGUICaret();
        if (caret && $(caret.node).closest("._phantom").length === 0)
            // On Chrome we must handle it here.
            this._handleKeyInsertingText(e);
        return terminate();
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
        var $sel_focus = $(sel_focus && sel_focus.node);
        if ($sel_focus.is("._label_clicked")) {
            $sel_focus.trigger("wed-context-menu", [e]);
            return terminate();
        }

        if (this._contextMenuHandler(e) === false)
            return terminate();
    }

    if (sel_focus === undefined)
        return true;

    var $placeholders = $(sel_focus.node).closest('._placeholder');
    if ($placeholders.length > 0) {
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
        if (util.anySpecialKeyHeld(e) ||
            key_constants.BACKSPACE.matchesEvent(e) ||
            key_constants.DELETE.matchesEvent(e))
            return terminate();
    }


    var $label = this.$gui_root.find(
        ".__start_label._label_clicked, .__end_label._label_clicked");
    if ($label[0] && key_constants.DELETE.matchesEvent(e)) {
        // The caret is currently in an element label. Delete the element!
        var $el = $label.closest("._real");
        var data_node = this.data_updater.pathToNode(this.nodeToPath($el[0]));
        var orig = getOriginalName(data_node);
        var trs = this.mode.getContextualActions("delete-parent", orig,
                                                 data_node, 0);

        trs[0].execute({
            node: data_node,
            element_name: orig
        });
    }
    else if ($(sel_focus.node).is('._phantom, ._phantom_wrap'))
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
            return true;
        }

        return false;
    }

    var text_undo, parent, offset; // damn hoisting
    if (key_constants.DELETE.matchesEvent(e)) {
        // Prevent deleting phantom stuff
        if (!$(domutil.nextCaretPosition(sel_focus.toArray(), this.gui_root,
                                         true)[0])
            .is("._phantom, ._phantom_wrap")) {

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
        return terminate();
    }

    if (key_constants.BACKSPACE.matchesEvent(e)) {
        // Prevent backspacing over phantom stuff
        if (!$(domutil.prevCaretPosition(sel_focus.toArray(),
                                         this.gui_root, true)[0])
            .is("._phantom, ._phantom_wrap")) {

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
                this.data_updater.deleteText(caret.node, caret.offset - 1, 1);
                // Don't set the caret inside a node that has been
                // deleted.
                if (caret.node.parentNode)
                    this.setDataCaret(caret.node, caret.offset - 1, true);
                else
                    this.setDataCaret(parent, offset, true);
                text_undo.recordCaretAfter();
            }
        }
        return terminate();
    }

    return true;
});

/**
 * Saves the document.
 *
 * @param {Function} done A callback to call after the save operation is done.
 */
Editor.prototype.save = function (done) {
    this._saver.save(done);
};

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

Editor.prototype._insertText = function (text) {
    if (text === "")
        return;

    var caret = this._sel_focus;

    if (caret === undefined)
        return;

    var text_undo = this._initiateTextUndo();
    caret = this.getDataCaret();
    var insert_ret = this.data_updater.insertText(caret, text);
    var modified_node = insert_ret[0];
    if (modified_node === undefined)
        this.setDataCaret(insert_ret[1], text.length, true);
    else {
        var final_offset;
        // Before the call, either the caret was in the text node that
        // received the new text...
        if (modified_node === caret.node)
            final_offset = caret.offset + text.length;
        // ... or it was immediately adjacent to this text node.
        else if (caret.node.childNodes[caret.offset] === modified_node)
            final_offset = text.length;
        else
            final_offset = modified_node.length;
        this.setDataCaret(modified_node, final_offset, true);
    }
    text_undo.recordCaretAfter();
};

Editor.prototype._compositionHandler = log.wrap(function (ev) {
    if (ev.type === "compositionstart") {
        this._composing = true;
        this._composition_data = {
            data: ev.originalEvent.data,
            start_caret: this._sel_focus
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
Editor.prototype._findLocationAt = function (x, y) {
    var element_at_mouse = this.elementAtPointUnderLayers(x, y);
    // This could happen if x, y is outside our screen.
    if (!element_at_mouse)
        return undefined;

    // The element_at_mouse is not in the editing pane.
    if (!$(element_at_mouse).closest(this.gui_root).length)
        return undefined;

    return this._findLocationInElementAt(element_at_mouse, x, y);
};


Editor.prototype._findLocationInElementAt = function(node, x, y, text_ok) {
    if (text_ok !== false)
        text_ok = true;

    var range = this.my_window.document.createRange();

    var min;

    // Utility function
    function checkRange(node, start) {
        var rects;
        if (node.nodeType === Node.TEXT_NODE) {
            range.setStart(node, start);
            range.setEnd(node, start + 1);
            rects = [range.getBoundingClientRect()];
        }
        else
            rects = node.childNodes[start].getClientRects();

        for(var rect_ix = 0, rect; (rect = rects[rect_ix]) !== undefined;
            ++rect_ix) {
            // Not a contender...
            if (rect.height === 0 && rect.width === 0)
                continue;

            var dist = util.distsFromRect(x, y, rect.left, rect.top,
                                          rect.right, rect.bottom);
            if (!min || min.dist.y > dist.y ||
                (min.dist.y === dist.y && min.dist.x > dist.x)) {
                min = {
                    dist: dist,
                    node: node,
                    start: start
                };

                // Returning true means the search can end.
                return (dist.y === 0 && dist.x === 0);
            }
        }

        return false;
    }

    var child = node.firstChild;
    var child_ix = 0;
    main_loop:
    while (child) {
        if (text_ok && child.nodeType === Node.TEXT_NODE) {
            for(var i = 0; i < child.length; ++i) {
                if (checkRange(child, i))
                    // Can't get any better than this.
                    break main_loop;
            }
        }
        else {
            if (checkRange(node, child_ix))
                // Can't get any better than this.
                break main_loop;
        }
        child = child.nextSibling;
        child_ix++;
    }

    if (!min)
        return makeDLoc(this.gui_root, node, 0);

    return makeDLoc(this.gui_root, min.node, min.start);
};

Editor.prototype._pointToCharBoundary = function(x, y) {
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

            var range = this.my_window.document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset + 1);
            var rect = range.getBoundingClientRect();
            switch(node_type) {
            case Node.TEXT_NODE:
                // We use positionRight/Left to adjust the position so that
                // the caret ends up in a location that makes sense from an
                // editing standpoint.
                boundary = (Math.abs(rect.left - x) >=
                            Math.abs(rect.right - x)) ?
                    this.positionRight(boundary) :
                    this.positionLeft(boundary.make(node, offset + 1));
                break;
            case Node.ELEMENT_NODE:
                // We don't use positionRight/Left here because we want to
                // skip over the *whole* element.
                var before;
                var pointed_node = node.childNodes[offset];
                if (pointed_node.nodeType ===  Node.ELEMENT_NODE) {
                    var closest = this._findLocationInElementAt(pointed_node,
                                                                x, y);
                    var limit = (closest.node.nodeType === Node.ELEMENT_NODE) ?
                            closest.node.childNodes.length - 1 : -1;
                    switch(closest.offset) {
                    case 0:
                        before = true;
                        break;
                    case limit:
                        before = false;
                        break;
                    }
                }

                if (before === undefined)
                    before = Math.abs(rect.left - x) < Math.abs(rect.right - x);

                if (!before)
                    boundary = boundary.make(node, offset + 1);

                break;
            default:
                throw new Error("unexpected node type: " + node_type);
            }
        }
    }
    return boundary;
};

Editor.prototype._mousemoveHandler = log.wrap(function (e) {
    var element_at_mouse = this.elementAtPointUnderLayers(e.clientX,
                                                          e.clientY);
    var $element_at_mouse = $(element_at_mouse);
    if ($element_at_mouse.closest(this.gui_root).length === 0)
        return; // Not in GUI tree.

    var boundary;
    if($element_at_mouse.is("[contenteditable='true']")) {
        boundary = this._pointToCharBoundary(e.clientX, e.clientY);
        if (!boundary)
            return;
    }
    else {
        var $child;
        while (!$element_at_mouse.is("[contenteditable='true']")) {
            $child = $element_at_mouse;
            $element_at_mouse = $child.parent();
            if ($element_at_mouse.closest(this.gui_root).length === 0)
                return; // The mouse was in a bunch of non-editable elements.
        }
        element_at_mouse = $element_at_mouse[0];
        var offset = _indexOf.call(element_at_mouse.childNodes, $child[0]);
        var range = this.my_window.document.createRange();
        range.setStart(element_at_mouse, offset);
        range.setEnd(element_at_mouse, offset + 1);
        var rect = range.getBoundingClientRect();
        if (Math.abs(rect.left - e.clientX) >= Math.abs(rect.right - e.clientX))
            offset++;
        boundary = {node: element_at_mouse, offset: offset};
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
    var old_display = this._$caret_layer.css("display");
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

    this._$caret_layer.css("display", "none");
    var element = this.my_window.document.elementFromPoint(x, y);
    this._$caret_layer.css("display", old_display);

    // Restore the range. See above why.
    if (range)
        this._setDOMSelectionRange(range);

    return element;
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
    var old_display = this._$caret_layer.css("display");
    this._$caret_layer.css("display", "none");
    $(element_at_mouse).trigger(new_e);
    this._$caret_layer.css("display", old_display);
    if (e.type === "mouseup")
        this._$caret_layer.off("mousemove");
    e.preventDefault();
    e.stopPropagation();
});


Editor.prototype._mousedownHandler = log.wrap(function(ev) {
    // Make sure the mouse is not on a scroll bar.
    if (!domutil.pointInContents(this.gui_root, ev.pageX, ev.pageY))
        return false;

    var boundary = this._pointToCharBoundary(ev.clientX, ev.clientY);
    if (!boundary)
        return true;

    this.$widget.find('.wed-validation-error.selected').removeClass('selected');
    this.$error_list.find('.selected').removeClass('selected');

    var $target = $(ev.target);
    var $placeholder = $target.closest("._placeholder");
    var $gui = $target.closest("._gui");
    switch(ev.which) {
    case 1:
        // Don't track selections on gui elements.
        if ($target.closest("._gui, ._phantom").length === 0)
            this.$gui_root.on('mousemove.wed',
                              this._mousemoveHandler.bind(this));

        // If the caret is changing due to a click on a
        // placeholder, then put it inside the placeholder.
        if ($placeholder.length)
            this.setGUICaret($target[0], 0);
        // If the caret is changing due to a click on a
        // GUI element, then normalize it to the start of the element.
        else if ($gui.length)
            this.setGUICaret($gui[0], 0);
        else
            this.setGUICaret(boundary);

        // _sel_focus and _sel_anchor were set by setGUICaret.
        this._prev_sel_focus = undefined;
        break;
    case 2:
        break;
    case 3:
        // If the caret is changing due to a click on a placeholder,
        // then put it inside the placeholder.
        if ($placeholder.length)
            this.setGUICaret($placeholder[0].firstChild, 0);

        if ($gui.length) {
            // Set the caret to be in the trigger.
            this.setGUICaret($target[0], 0);
            $target.trigger("wed-context-menu", [ev]);
        }
        else {
            // If the editor is just gaining focus with *this* click,
            // then this._sel_focus will not be set. It also means the
            // range is collapsed. Using setSelectionRange sets the
            // necessary state.
            if (!this._sel_focus)
                this.setGUICaret(boundary);

            if ($target.closest("*[data-wed-custom-context-menu]")[0])
                $target.trigger("wed-context-menu", [ev]);
            else
                this._contextMenuHandler(ev);
        }
    }
    return false;
});

/**
 * @param {module:dloc~DLoc} loc Location where to insert.
 * @returns {Node} The placeholder.
 */
Editor.prototype.insertTransientPlaceholderAt = function (loc) {
    var ph = $("<span class='_placeholder _transient' " +
               "contenteditable='false'> </span>")[0];
    this._gui_updater.insertNodeAt(loc, ph);
    return ph;
};

/**
 * This method returns the current position of the GUI caret. However, it
 * sanitizes its return value to avoid providing positions where
 * inserting new elements or text is not allowed. One prime example of
 * this would be inside of a ``_placeholder`` or a ``_gui`` element.
 *
 * @param {boolean} raw If ``true``, the value returned is not normalized.
 * @returns {module:dloc~DLoc} The caret location. Callers must not
 * change the value they get.
 */
Editor.prototype.getGUICaret = function (raw) {
    // Caret is unset
    if (this._sel_focus === undefined)
        return undefined;

    return raw ? this._sel_focus : this._normalizeCaret(this._sel_focus);
};


Editor.prototype._normalizeCaret = function (loc) {
    if (!loc)
        return loc;

    var pg = $(loc.node).closest("._placeholder, ._gui")[0];
    // We are in a placeholder or gui node, make the caret be
    // the parent of the this node.
    if (pg !== undefined) {
        var parent = pg.parentNode;
        return loc.make(parent, _indexOf.call(parent.childNodes, pg));
    }

    return loc;
};


Editor.prototype.fromDataLocation = function (node, offset) {
    var ret = this._gui_updater.fromDataLocation(node, offset);

    var new_offset = ret.offset;
    node = ret.node;
    if(node.nodeType === Node.ELEMENT_NODE) {
        // Normalize to a range within the editable nodes. We could be
        // outside of them in an element which is empty, for instance.
        var pair = this.mode.nodesAroundEditableContents(node);
        var first_index = _indexOf.call(node.childNodes, pair[0]);
        if (new_offset <= first_index)
            new_offset = first_index + 1;
        else {
            var second_index =
                    pair[1] ? _indexOf.call(node.childNodes, pair[1]) :
                    node.childNodes.length;
            if (new_offset >= second_index)
                new_offset = second_index;
        }
    }
    return ret.make(node, new_offset);
};

/**
 * Converts a gui location to a data location.
 *
 * @param {module:dloc~DLoc} loc A location in the GUI tree.
 * @param {Boolean} [closest=false] Some GUI locations do not
 * correspond to data locations. Like if the location is in a gui
 * element or phantom text. By default, this method will return
 * undefined in such case. If this parameter is true, then this method
 * will return the closest location.
 * @returns {module:dloc~DLoc} The data location that corresponds to
 * the location passed. This could be undefined if the location does
 * not correspond to a location in the data tree.
 *
 * @also
 *
 * @param {Node} node A node which, with the next parameter,
 * represents a position.
 * @param {Integer} offset The offset in the node in the first
 * parameter.
 * @param {Boolean} [closest=false] Some GUI locations do not
 * correspond to data locations. Like if the location is in a gui
 * element or phantom text. By default, this method will return
 * undefined in such case. If this parameter is true, then this method
 * will return the closest position.
 * @returns {module:dloc~DLoc} The data location that corresponds to
 * the location passed. This could be undefined if the location does
 * not correspond to a location in the data tree.
 */
Editor.prototype.toDataLocation = function(loc, offset, closest) {
    var node;
    if (loc instanceof DLoc) {
        closest = offset;
        offset = loc.offset;
        node = loc.node;
    }
    else
        node = loc;

    var top_phantom = $(node).parents("._phantom, ._gui").get(-1) ||
            ($(node).is("._phantom, ._gui") ? node : undefined);
    if (top_phantom) {
        if (!closest)
            return undefined;

        node = top_phantom.parentNode;
        offset = _indexOf.call(node.childNodes, top_phantom);
    }

    var normalized = this._normalizeCaret(
        makeDLoc(this.gui_root, node, offset));
    node = normalized.node;
    offset = normalized.offset;

    var data_node;
    if (node.nodeType === Node.TEXT_NODE) {
        data_node = this.data_updater.pathToNode(this.nodeToPath(node));
        return makeDLoc(this.data_root, data_node, offset);
    }

    if (offset >= node.childNodes.length) {
        data_node = this.data_updater.pathToNode(this.nodeToPath(node));
        return makeDLoc(this.data_root, data_node, data_node.childNodes.length);
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
            return makeDLoc(this.data_root,
                            this.data_updater.pathToNode(this.nodeToPath(node)),
                            0);

        data_node = this.data_updater.pathToNode(this.nodeToPath(found));
        return makeDLoc(this.data_root, data_node.parentNode,
                        _indexOf.call(data_node.parentNode.childNodes,
                                      data_node) + 1);
    }

    data_node = this.data_updater.pathToNode(this.nodeToPath(child));
    return makeDLoc(this.data_root, data_node.parentNode,
                    _indexOf.call(data_node.parentNode.childNodes, data_node));
};

Editor.prototype.getDataCaret = function (closest) {
    var caret = this.getGUICaret();
    if (caret === undefined)
        return undefined;
    return this.toDataLocation(caret, closest);
};

/**
 * @param {module:dloc~DLoc} loc The location of the data caret.
 * @param {Boolean} [text_edit=false] Whether the caret is being moved
 * for a text editing operation.
 *
 * @also
 *
 * @param {Node} node The location of the data caret.
 * @param {Integer} offset The location of the data caret.
 * @param {Boolean} [text_edit=false] Whether the caret is being moved
 * for a text editing operation.
 */
Editor.prototype.setDataCaret = function (loc, offset, text_edit) {
    if (loc instanceof DLoc)
        text_edit = offset;
    else
        loc = makeDLoc(this.data_root, loc, offset);

    text_edit = !!text_edit; // normalize

    var caret = this.fromDataLocation(loc);
    this.setGUICaret(caret, false, text_edit);
};


Editor.prototype.toDataNode = function (node) {
    return this.data_updater.pathToNode(this.nodeToPath(node));
};

/**
 * @private
 * @param {boolean} text_edit Whether or not this caret change event
 * is due to editing text.
 */
Editor.prototype._caretChange = log.wrap(function (text_edit) {
    text_edit = !!text_edit; // normalize

    var focus_node;
    var focus_offset;

    if (this._sel_focus) {
        focus_node = this._sel_focus.node;
        focus_offset = this._sel_focus.offset;

        if (focus_node.nodeType === Node.ELEMENT_NODE) {
            // Placeholders attract adjacent carets into them.
            var $ph = $(focus_node).children("._placeholder");
            var ph = $ph[0];
            if (ph && !$ph.is("._dying")) {
                this.setGUICaret(ph, 0);
                return;
            }
        }
    }

    // End here if there is no change to the caret.
    if (!(this._old_sel_focus === undefined ||
          this._old_sel_focus.node !== focus_node ||
          this._old_sel_focus.offset !== focus_offset))
        return;

    var old_caret = this._old_sel_focus;
    this._old_sel_focus = focus_node ?
        makeDLoc(this.gui_root, focus_node, focus_offset) : undefined;

    var caret = this._old_sel_focus;

    // Caret movement terminates a text undo, unless the caret is
    // moved by a text edit.
    if (!text_edit)
        this._terminateTextUndo();

    // The class owns_caret can be on more than one element. The
    // classic case is if the caret is at an element label.
    this.$gui_root.find("._owns_caret").removeClass("_owns_caret");

    if (old_caret) {
        var $old_caret = $(old_caret.node);
        var $old_gui = $old_caret.closest("._gui");
        if ($old_gui[0])
            $old_gui.trigger("wed-unclick");

        var old_tp = $old_caret.closest("._placeholder._transient")[0];
        if (old_tp)
            this._gui_updater.removeNode(old_tp);
    }

    if (!caret)
        return;

    var $node = $((caret.node.nodeType === Node.ELEMENT_NODE)?
                  caret.node: caret.node.parentNode);

    // This caret is no longer in the gui tree. It is probably an
    // intermediary state so don't do anything with it.
    if ($node.closest(this.gui_root).length === 0)
        return;

    var $gui = $node.closest("._gui");
    var gui = $gui[0];
    // Make sure that the caret is in view.
    var $what;

    $node.closest("._real").addClass("_owns_caret");
    if (gui) {
        if (!this._sel_anchor ||
            $(this._sel_anchor.node).closest("._gui")[0] === gui)
            $node.trigger("wed-click");
        $what = $gui;
    }
    else {
        $node.addClass("_owns_caret");
        if (this._sel_focus)
            $what = this._$fake_caret;
        // else there is a real caret which the browser should already
        // have brought into view.
    }

    if ($what) {
        var pos = this._positionFromGUIRoot($what);
        this.scrollIntoView(pos.left, pos.top, pos.left + $what.outerWidth(),
                            pos.top + $what.outerHeight());
    }

    var steps = [];
    while(!$node.is(this.gui_root)) {
        if ($node[0].nodeType !== Node.ELEMENT_NODE)
            throw new Error("unexpected node type: " + $node[0].nodeType);

        if (!$node.is("._placeholder") &&
            !$node.closest("._phantom")[0]) {
            steps.unshift("<span class='_gui _label'><span>&nbsp;" +
                          util.getOriginalName($node[0]) +
                          "&nbsp;</span></span>");
        }
        $node = $node.parent();
    }
    this._$wed_location_bar.empty();
    this._$wed_location_bar.append(steps.length ? steps.join("/") :
                                   "<span>&nbsp;</span>");
});

/**
 * @param {jQuery} $element The element for which we want a position.
 * @returns {{left: number, top: number}} The coordinates of the
 * element relative to the GUI root.
 */
Editor.prototype._positionFromGUIRoot = function ($element) {
    // _$fake_caret is a special case because this function may be
    // called when the caret layer is invisible. So we can't rely on
    // offset. Fortunately, the CSS values are what we want, so...
    var pos;
    if ($element[0] === this._$fake_caret[0]) {
        pos = {
            left: +$element.css("left").replace("px", ""),
            top: +$element.css("top").replace("px", "")
        };

        if (isNaN(pos.left) || isNaN(pos.top))
            throw new Error("NAN for left or top");

        // We don't need to subtract the offset of gui_root from these
        // coordinates since they are relative to the gui_root object
        // to start with.
        pos.left = pos.left + this.$gui_root.scrollLeft();
        pos.top = pos.top + this.$gui_root.scrollTop();

        return pos;
    }

    // There is no guarantee regarding who is the element's
    // offsetParent, so $.position() can't be used. So get the
    // relative screen position, and adjust by scroll.
    pos = $element.offset();

    var gui_pos = this.$gui_root.offset();
    pos.left = pos.left - gui_pos.left + this.$gui_root.scrollLeft();
    pos.top = pos.top - gui_pos.top + this.$gui_root.scrollTop();
    return pos;
};

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
    this.pushSelection();
    this._current_dropdown = new context_menu.ContextMenu(
        this.my_window.document, x, y, items,
        function() {
        this._current_dropdown = undefined;
        this.popSelection();
    }.bind(this));
};

Editor.prototype.pushSelection = function () {
    this._selection_stack.push([this._sel_anchor, this._sel_focus]);
    // _clearDOMSelection is to work around a problem in Rangy
    // 1.3alpha.804. See ``tech_notes.rst``.
    if (browsers.MSIE)
        this._clearDOMSelection();
};

Editor.prototype.popSelection = function () {
    var it = this._selection_stack.pop();
    this._sel_anchor = it[0];
    this._sel_focus = it[1];
    this._restoreCaretAndSelection();
};

/**
 * Restores the caret and selection from the ``this._sel_anchor`` and
 * ``this._sel_focus`` fields. This is used to deal with situations in
 * which the caret and range may have been "damaged" due to browser
 * operations, changes of state, etc.
 *
 * @private
 */
Editor.prototype._restoreCaretAndSelection = function () {
    if (this._sel_anchor &&
        // It is not impossible that the anchor has been removed
        // after focus was lost so check for it.
        $(this._sel_anchor.node).closest(this.gui_root).length) {
        var rr = this._sel_anchor.makeRange(this._sel_focus);
        this.setSelectionRange(rr.range, rr.reversed);
        this._refreshFakeCaret();
        // We're not selecting anything...
        if (rr.range.collapsed)
            this._focusInputField();
        this._caretChange();
    }
    else
        this.clearSelection();
};

Editor.prototype.clearSelection = function () {
    this._sel_anchor = undefined;
    this._sel_focus = undefined;
    this._refreshFakeCaret();
    var sel = this._getDOMSelection();
    if (sel.rangeCount > 0 &&
        $(sel.focusNode).closest(this.$gui_root).length > 0)
        sel.removeAllRanges();
    this._caretChange();
};

Editor.prototype._getDOMSelection = function () {
    return rangy.getSelection(this.my_window);
};

/**
 * @param {boolean} [dont_focus=false] Whether or not we are keeping
 * the focus after clearing the selection. Necessary because in some
 * cases, we are clearing the selection when *losing* focus.
 */
Editor.prototype._clearDOMSelection = function (dont_focus) {
    this._getDOMSelection().removeAllRanges();
    // Make sure the focus goes back there.
    if (!dont_focus)
        this._focusInputField();
};

Editor.prototype._getDOMSelectionRange = function () {
    var range = domutil.getSelectionRange(this.my_window);

    if (!range)
        return undefined;

    // Don't return a range outside our editing framework.
    if ($(range.startContainer).closest(this.$gui_root).length === 0 ||
        $(range.endContainer).closest(this.$gui_root).length === 0)
        return undefined;

    return range;
};

Editor.prototype.getSelectionRange = function () {
    return this._sel_anchor ? this._sel_anchor.makeRange(this._sel_focus).range
        : undefined;
};

Editor.prototype.setSelectionRange = function (range, reverse) {
    var start = makeDLoc(this.gui_root,
                         range.startContainer, range.startOffset);
    var end = makeDLoc(this.gui_root, range.endContainer, range.endOffset);

    if (reverse) {
        this._sel_anchor = end;
        this._sel_focus = start;
    }
    else {
        this._sel_anchor = start;
        this._sel_focus = end;
    }

    this._setDOMSelectionRange(range, reverse);
    this._refreshFakeCaret();
    this._caretChange();
};

Editor.prototype._normalizeSelectionRange = function () {
    var range = this.getSelectionRange();x
    if (!range)
        return undefined;

    var start = this._normalizeCaretToEditableRange(
        range.startContainer, range.startOffset);
    var end = this._normalizeCaretToEditableRange(
        range.endContainer, range.endOffset);
    return start.makeRange(end).range;
};

Editor.prototype._normalizeCaretToEditableRange = function (container, offset) {
    if (container instanceof DLoc) {
        if (container.root != this.gui_root)
            throw new Error("DLoc object must be for the GUI tree");
        offset = container.offset;
        container = container.node;
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
    return makeDLoc(this.gui_root, container, offset);
};

/**
 * This function is meant to be used internally to manipulate the DOM
 * selection directly. Generally, you want to use {@link
 * module:wed~Editor#setSelectionRange setSelectionRange} instead.
 *
 * @private
 */
Editor.prototype._setDOMSelectionRange = function (range, reverse) {
    if (range.collapsed) {
        this._clearDOMSelection();
        return;
    }

    // The domutil.focusNode call is required to work around bug:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
    if (browsers.FIREFOX)
        domutil.focusNode(range.endContainer);

    // _clearDOMSelection is to work around a problem in Rangy
    // 1.3alpha.804. See ``tech_notes.rst``.
    if (browsers.MSIE)
        this._clearDOMSelection();
    var sel = this._getDOMSelection();
    sel.setSingleRange(range, reverse);
};

Editor.prototype.getDataSelectionRange = function () {
    var range = this.getSelectionRange();

    if (range === undefined)
        return undefined;

    var start_caret = this.toDataLocation(range.startContainer,
                                          range.startOffset);
    var end_caret;
    if (!range.collapsed)
        end_caret = this.toDataLocation(range.endContainer, range.endOffset);
    // This will create a collapsed range if end_caret is undefined .
    return start_caret.makeRange(end_caret).range;
};

Editor.prototype.setDataSelectionRange = function (range) {
    var start = this.fromDataLocation(range.startContainer, range.startOffset);
    var end;
    if (!range.collapsed)
        end = this.fromDataLocation(range.endContainer, range.endOffset);
    this.setSelectionRange(start.makeRange(end).range);
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

Editor.prototype._onSaverSaved = function () {
    $.bootstrapGrowl("Saved", { ele: "body",
                                type: 'success', align: 'center' } );
    this._refreshSaveStatus();
    this._emit("saved");
};

Editor.prototype._onSaverAutosaved = function () {
    $.bootstrapGrowl("Autosaved", { ele: "body",
                                    type: 'success', align: 'center' } );
    this._refreshSaveStatus();
    this._emit("autosaved");
};

Editor.prototype._onSaverChanged = function () {
    this._refreshSaveStatus();
};

Editor.prototype._onSaverFailed = function (data) {
    this._refreshSaveStatus();
    var me = this;
    if (data.type === "save_disconnected") {
        this._disconnect_modal.modal(function () {
            me.save();
        });
    }
    else if (data.type === "save_edited") {
        this._edited_by_other_modal.modal(function () {
            me.my_window.location.reload();
        });
    }
    else
        $.bootstrapGrowl("Failed to save!\n" + data.msg,
                         { ele: "body",
                           type: 'danger', align: 'center' } );
};

Editor.prototype._onSaverTooOld = function () {
    // Reload when the modal is dismissed.
    this._too_old_modal.modal(
        this.my_window.location.reload.bind(this.my_window.location));
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
    var gui_caret = this.fromDataLocation(data_node, index);
    gui_caret = this._normalizeCaretToEditableRange(gui_caret);

    var link_id = util.newGenericID();
    var $marker =
            $("<span class='_phantom wed-validation-error'>&nbsp;</span>");

    // If we are not using the navigation panel, then we should always show
    // the error list.
    if (this._$navigation_panel.css("display") === "none")
        this.$error_list.parents('.panel-collapse').collapse('show');

    $marker.click(log.wrap(function (ev) {
        this.$error_list.parents('.panel-collapse').collapse('show');
        var $link = this.$error_list.find("#" + link_id);
        var $scrollable = this.$error_list.parent('.panel-body');
        $scrollable.animate({
            scrollTop: $link.offset().top - $scrollable.offset().top +
                $scrollable.scrollTop()
        });
        this.$widget.find('.wed-validation-error.selected').removeClass(
                                                               'selected');
        $(ev.currentTarget).addClass('selected');
        $link.siblings().removeClass('selected');
        $link.addClass('selected');
    }.bind(this)));
    var marker_id = $marker[0].id = util.newGenericID();
    this._gui_updater.insertAt(gui_caret, $marker[0]);

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
    $item[0].id = link_id;

    $item.children("a").click(log.wrap(function (ev) {
        this.$widget.find('.wed-validation-error.selected').removeClass(
                                                               'selected');
        $marker.addClass('selected');
        var $parent = $(ev.currentTarget).parent();
        $parent.siblings().removeClass('selected');
        $parent.addClass('selected');
    }.bind(this)));

    this.$error_list.append($item);
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

Editor.prototype.nodeToPath = function (node) {
    return this.gui_dloc_root.nodeToPath(node);
};

Editor.prototype.pathToNode = function (path) {
    return this.gui_dloc_root.pathToNode(path);
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

/**
 * @returns {{left: number, top: number}} The coordinates of the
 * current caret position relative to the screen root.
 */
Editor.prototype._caretPositionOnScreen = function () {
    if (!this._sel_focus)
        return undefined;

    if (this._$fake_caret.parent().length > 0)
        return this._$fake_caret[0].getBoundingClientRect();

    var $node = $(this._sel_focus.node);
    if ($node.is("._gui"))
        return $node[0].getBoundingClientRect();

    var range = this.getSelectionRange();
    if (range)
        return range.nativeRange.getBoundingClientRect();

    throw new Error("can't find position of caret");
};

Editor.prototype.increaseLabelVisibilityLevel = function () {
    if (this._current_label_level < this.max_label_level) {
        var pos = this._caretPositionOnScreen();
        this._current_label_level++;
        var $labels = this.$gui_root.find("._label_level_" +
                                          this._current_label_level);
        var count = $labels.length;
        $labels.show(0, log.wrap(function () {
            count--;
            if (count)
                return;  // We're not done with all elements yet.

            this._refreshFakeCaret();
            // Pos could be undefined if this function is called when wed
            // starts.
            if (!pos)
                return;

            var pos_after = this._caretPositionOnScreen();
            this.$gui_root.scrollTop(this.$gui_root.scrollTop() -
                                     pos.top + pos_after.top);
            this.$gui_root.scrollLeft(this.$gui_root.scrollLeft() -
                                      pos.left + pos_after.left);
        }.bind(this)));
    }
};

Editor.prototype.decreaseLabelVisiblityLevel = function () {
    if (this._current_label_level) {
        var pos = this._caretPositionOnScreen();
        var prev = this._current_label_level;
        this._current_label_level--;
        var $labels = this.$gui_root.find("._label_level_" + prev);
        var count = $labels.length;
        $labels.hide(0, log.wrap(function () {
            count--;
            if (count)
                return; // We're not done with all elements yet.

            this._refreshFakeCaret();

            // Pos could be undefined if this function is called when wed
            // starts.
            if (!pos)
                return;

            var pos_after = this._caretPositionOnScreen();
            this.$gui_root.scrollTop(this.$gui_root.scrollTop() -
                                     pos.top + pos_after.top);
            this.$gui_root.scrollLeft(this.$gui_root.scrollLeft() -
                                      pos.left + pos_after.left);
        }.bind(this)));
    }
};

Editor.prototype.destroy = function () {
    this._destroying = true;
    if (this._destroyed)
        return;

    var my_index = onerror.editors.indexOf(this);
    if (my_index >= 0)
        onerror.editors.splice(my_index, 1);


    //
    // This is imperfect, but the goal here is to do as much work as
    // possible, even if things have not been initialized fully.
    //
    // The last recorded exception will be rethrown at the end.
    //

    // Turn off autosaving.
    if (this._saver)
        this._saver.setAutosaveInterval(0);

    if (this._save_status_interval)
        clearInterval(this._save_status_interval);

    try {
        if (this.validator)
            this.validator.stop();
    }
    catch (ex) {
        log.unhandled(ex);
    }

    try {
        if (this.domlistener !== undefined) {
            this.domlistener.stopListening();
            this.domlistener.clearPending();
        }
    }
    catch(ex) {
        log.unhandled(ex);
    }

    if (this._current_dropdown)
        this._current_dropdown.dismiss();

    // These ought to prevent jQuery leaks.
    try {
        this.$widget.empty();
        this.$frame.find('*').off('.wed');
        // This will also remove handlers on the window.
        $(this.my_window).off('.wed');
    }
    catch (ex) {
        log.unhandled(ex);
    }

    // Trash our variables: this will likely cause immediate
    // failure if the object is used again.
    var keys = Object.keys(this);
    for(var i = 0, key; (key = keys[i]) !== undefined; ++i)
        delete this[key];

    // ... but keep these two. Calling destroy over and over is okay.
    this._destroyed = true;
    this.destroy = function () {};
};

function unloadHandler(e) {
    e.data.editor.destroy();
}

exports.Editor = Editor;

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
//  LocalWords:  jqutil wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
