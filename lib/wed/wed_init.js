/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var core = require("./wed_core");
var Editor = core.Editor;
var version = core.version;
var wed_util = require("./wed_util");
var paste = wed_util.paste;
var cut = wed_util.cut;
var build_info = require("./build-info");
var $ = require("jquery");
var log = require("./log");
var preferences = require("./preferences");
var onerror = require("./onerror");
var domutil = require("./domutil");
var guiroot = require("./guiroot");
var dloc = require("./dloc");
var AjaxSaver = require("./savers/ajax").Saver;
var LocalSaver = require("./savers/localforage").Saver;
var TreeUpdater = require("./tree_updater").TreeUpdater;
var GUIUpdater = require("./gui_updater").GUIUpdater;
var UndoRecorder = require("./undo_recorder").UndoRecorder;
var updater_domlistener = require("./updater_domlistener");
var validator = require("./validator");
var Validator = validator.Validator;
var object_check = require("./object_check");
var modal = require("./gui/modal");
var undo = require("./undo");
var transformation = require("./transformation");
var pubsub = require("./lib/pubsub");
var onbeforeunload = require("./onbeforeunload");
var closestByClass = domutil.closestByClass;
var closest = domutil.closest;

var _indexOf = Array.prototype.indexOf;

Editor.prototype.init = log.wrap(function (widget, options, data) {
    this.max_label_level = undefined;
    this._current_label_level = undefined;
    this._stripped_spaces = /\u200B/g;
    this._replaced_spaces = /\s+/g;

    // We may want to make this configurable in the future.
    this._normalize_entered_spaces = true;

    this.preferences = new preferences.Preferences({
        "tooltips": true
    });

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not
    // alter anything outside our frame.
    this.$frame = $(closest(this.widget, "html"));
    var doc = this.$frame[0].ownerDocument;
    this.my_window = doc.defaultView;
    this.doc = doc;
    onerror.register(this.my_window);

    var parser = new this.my_window.DOMParser();
    if (data) {
        this._data_doc = parser.parseFromString(data, "text/xml");
    }
    else {
        this._data_doc = parser.parseFromString("<div></div>", "text/xml");
        this._data_doc.removeChild(this._data_doc.firstChild);
    }

    // ignore_module_config allows us to completely ignore the module
    // config. In some case, it may be difficult to just override
    // individual values.
    if (options.ignore_module_config)
        options = $.extend(true, {}, options);
    else
        // This enables us to override options.
        options = $.extend(true, {}, core.module_config, options);

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
    <div class="wed-scroller">\
     <div class="wed-error-layer"></div>\
     <div class="wed-document"><span class="root-here"/></div>\
    </div>\
   </div>\
   <div class="wed-location-bar"><span>&nbsp;</span></div>\
  </div>\
 </div>\
 <div id="sidebar" class="col-sm-pull-10 col-lg-2 col-md-2 col-sm-2"/>\
</div>', doc);
    var framework = $framework[0];

    //
    // Grab all the references we need while $framework does not yet contain
    // the document to be edited. (Faster!)
    //

    // $gui_root represents the document root in the HTML elements
    // displayed. The top level element of the XML document being
    // edited will be the single child of $gui_root.
    this.gui_root = framework.getElementsByClassName('wed-document')[0];
    this.$gui_root = $(this.gui_root);
    this._scroller = framework.getElementsByClassName('wed-scroller')[0];
    this._$scroller = $(this._scroller);

    this._$input_field = $(
        framework.getElementsByClassName("wed-comp-field")[0]);
    this._cut_buffer = framework.getElementsByClassName("wed-cut-buffer")[0];

    this._caret_layer = framework.getElementsByClassName('wed-caret-layer')[0];
    this._$caret_layer = $(this._caret_layer);
    this._error_layer = framework.getElementsByClassName('wed-error-layer')[0];
    this._$error_layer = $(this._error_layer);

    this._layer_names = ["_caret_layer", "_error_layer"];
    this._layer_state_stack = [];
    this._wed_location_bar =
        framework.getElementsByClassName('wed-location-bar')[0];

    // Insert the framework and put the document in its proper place.
    var root_placeholder = framework.getElementsByClassName("root-here")[0];

    if (widget.firstChild) {
        if (!(widget.firstChild instanceof this.my_window.Element))
            throw new Error("the data is populated with DOM elements constructed " +
                            "from another window");

        root_placeholder.parentNode.insertBefore(widget.firstChild,
                                                 root_placeholder);
    }
    root_placeholder.parentNode.removeChild(root_placeholder);
    this.widget.appendChild(framework);

    // These call to getElementById must be done after we insert the
    // framework into the document.
    var sidebar = doc.getElementById("sidebar");
    this._sidebar = sidebar;

    this.$validation_progress = $(doc.getElementById("validation-progress"));
    this.$validation_message =
        $(this.$validation_progress[0].previousElementSibling);


    this._caret_owners = this.gui_root.getElementsByClassName("_owns_caret");
    this._clicked_labels =
        this.gui_root.getElementsByClassName("_label_clicked");

    // $data_root is the document we are editing, $gui_root will become
    // decorated with all kinds of HTML elements so we keep the two
    // separate.
    var frag = this._data_doc.createDocumentFragment();
    frag.appendChild(this._data_doc.createElement("div"));
    this.data_root = frag.firstChild;
    this.$data_root = $(this.data_root);
    //this.gui_root.appendChild(convert.toHTMLTree(doc,
    //                                             this.data_root.firstChild));
    // domutil.linkTrees(this.data_root, this.gui_root);

    this.gui_dloc_root = new guiroot.GUIRoot(this.gui_root);
    this.data_dloc_root = new dloc.DLocRoot(this.data_root);

    this.data_updater = new TreeUpdater(this.data_root);
    this._gui_updater = new GUIUpdater(this.gui_root, this.data_updater);
    this._undo_recorder = new UndoRecorder(this, this.data_updater);

    // This is a workaround for a problem in Bootstrap >= 3.0.0 <=
    // 3.2.0. When removing a Node that has an tooltip associated with
    // it and the trigger is delayed, a timeout is started which may
    // timeout *after* the Node and its tooltip are removed from the
    // DOM. This causes a crash.
    //
    // All versions >= 3.0.0 also suffer from leaving the tooltip up
    // if the Node associated with it is deleted from the DOM. This
    // does not cause a crash but must be dealt with to avoid leaving
    // orphan tooltips around.
    //
    var has_tooltips = document.getElementsByClassName("wed-has-tooltip");
    this._gui_updater.addEventListener("beforeDeleteNode", function (ev) {
        var node = ev.node;
        if (node.nodeType !== Node.TEXT_NODE) {
            for(var i = 0, limit = has_tooltips.length; i < limit; ++i) {
                var has_tooltip = has_tooltips[i];
                if (!node.contains(has_tooltip))
                    continue;

                var data = $.data(has_tooltip, "bs.tooltip");
                if (data)
                    data.destroy();

                // We don't remove the wed-has-tooltip
                // class. Generally, the elements that have tooltips
                // and are removed from the GUI tree won't be added to
                // the tree again. If they are added again, they'll
                // most likely get a new tooltip so removing the class
                // does not gain us much because it will be added
                // again.
                //
                // If we *were* to remove the class, then the
                // collection would change as we go through it.
            }
        }
    });

    // We duplicate data-parent on the toggles and on the collapsible
    // elements due to a bug in Bootstrap 3.0.0. See
    // https://github.com/twbs/bootstrap/issues/9933.
    sidebar.innerHTML =
'<div class="wed-save-and-modification-status">\
  <span class="wed-modification-status label label-success" \
        title="Modification status">\
   <i class="fa fa-asterisk"></i>\
  </span>\
  <span class="wed-save-status label label-default">\
   <i class="fa fa-cloud-upload"></i> <span></span>\
  </span>\
</div>\
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
</div>';

    this._$modification_status =
        $(sidebar.getElementsByClassName('wed-modification-status')[0]);
    this._$save_status =
        $(sidebar.getElementsByClassName('wed-save-status')[0]);

    this._$navigation_panel =
        $(sidebar.getElementsByClassName("wed-navigation-panel")[0]);
    this._$navigation_panel.css("display", "none");

    this._current_dropdown = undefined;

    var fake_caret = doc.createElement("span");
    fake_caret.className = "_wed_caret";
    fake_caret.setAttribute("contenteditable", false);
    fake_caret.textContent = " ";
    this._fake_caret = fake_caret;
    this._$fake_caret = $(fake_caret);
    this._inhibited_fake_caret = 0;
    this._pending_fake_caret_refresh = false;

    var fc_mark = doc.createElement("span");
    fc_mark.innerHTML = "&nbsp;";
    fc_mark.style.height = "100%";
    fc_mark.style.width = "1px";
    fc_mark.style.maxWidth = "1px";
    this._fc_mark = fc_mark;
    this._$fc_mark = $(fc_mark);

    // The limitation modal is a modal that comes up when wed cannot
    // proceed.  It is not created with this.makeModal() because we
    // don't care about the selection.
    this._limitation_modal = new modal.Modal();
    this._limitation_modal.setTitle("Cannot proceed");

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

    var doc_link = this.doc_link = require.toUrl("../../doc/index.html");
    this.help_modal = this.makeModal();
    this.help_modal.setTitle("Help");
    this.help_modal.setBody(
        "\
<p>Click <a href='" + doc_link + "' target='_blank'>this link</a> to see \
wed's generic help. The link by default will open in a new tab.</p>\
<p>The key combinations with Ctrl below are done with Command in OS X.</p>\
<ul>\
  <li>Clicking the right mouse button on the document contents brings up a \
contextual menu.</li>\
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
<p class='wed-build-info'>Build descriptor: " + build_info.desc + "<br/>\
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

    this._$navigation_list = $(doc.getElementById("navlist"));

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
            this.gui_root.scrollTop = 0;
        }
    }.bind(this));

    this._last_done_shown = 0;
    this.$error_list = $(doc.getElementById("sb-errorlist"));
    this._$excluded_from_blur = $();
    this._validation_errors = [];

    this._undo = new undo.UndoList();


    this.mode_path = options.mode.path;
    this.paste_tr = new transformation.Transformation(this, "add",
                                                      "Paste", paste);
    this.cut_tr = new transformation.Transformation(this, "delete", "Cut", cut);
    this.split_node_tr =
        new transformation.Transformation(
            this, "split", "Split <name>",
            function(editor, data) {
            return transformation.splitNode(editor, data.node);
        });
    this.merge_with_previous_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "merge-with-previous", "Merge <name> with previous",
            function (editor, data) {
            return transformation.mergeWithPreviousHomogeneousSibling(
                editor, data.node);
        });

    this.merge_with_next_homogeneous_sibling_tr =
        new transformation.Transformation(
            this, "merge-with-next", "Merge <name> with next",
            function (editor, data) {
            return transformation.mergeWithNextHomogeneousSibling(
                editor, data.node);
        });

    pubsub.subscribe(pubsub.WED_MODE_READY, function (msg, mode) {
        // Change the mode only if it is *our* mode
        if (mode === this._new_mode)
            this.onModeChange(mode);
    }.bind(this));

    this._global_keydown_handlers = [];

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

    this._resizeHandler();

    var demo = this.options.demo;
    if (demo) {
        // Provide a generic message.
        if (typeof demo !== "string") {
            demo = "Some functions may not be available.";
        }
        var demo_modal = new modal.Modal();
        demo_modal.setTitle("Demo");
        demo_modal.setBody(
            "<p>This is a demo of wed. " + demo + "</p>" +
                "<p>Click <a href='" + this.doc_link +
                "' target='_blank'>this link</a> to see \
wed's generic help. The link by default will open in a new tab.</p>");
        demo_modal.addButton("Ok", true);
        var $top = demo_modal.getTopLevel();
        this.widget.appendChild($top[0]);
        demo_modal.modal(function () {
            this.widget.removeChild($top[0]);
            this.$gui_root.focus();
        }.bind(this));
    }

    this.gui_root.setAttribute("tabindex", "-1");
    this.$gui_root.focus();

    this.resolver = mode.getAbsoluteResolver();
    var mode_validator = mode.getValidator();
    this.validator = new Validator(this.options.schema, this.data_root,
                                   mode_validator);
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
        this._limitation_modal.modal();
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
        },
        attributes: false
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

    if (!options.attributes)
        options.attributes = "hide";

    var attributes = this.attributes = options.attributes;

    var valid_attributes = ["hide", "show", "edit"];
    if (valid_attributes.indexOf(attributes) === -1)
        errors.push("attributes option not a valid value: " +
                    attributes + "; must be one of " +
                    valid_attributes.join(", "));

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
        function (root, added, removed, prev, next, target) {
        var all = added.concat(removed);
        var found = false;
        for(var ix = 0, limit = all.length; !found && ix < limit; ++ix) {
            var child = all[ix];
            found = (child.nodeType === Node.TEXT_NODE) ||
                child.classList.contains("_real") ||
                child.classList.contains("_phantom_wrap");
        }
        if (found) {
            this._last_done_shown = 0;
            this.validator.restartAt(target);
        }
    }.bind(this));

    this.decorator = this.mode.makeDecorator(this.domlistener,
                                             this, this._gui_updater);
    // Revalidate on attribute change.
    this.domlistener.addHandler(
        "attribute-changed",
        "._real",
        function (root, el, namespace, name) {
        if (!namespace && name.indexOf("data-wed", 0) === 0) {
            // Doing the restart immediately messes up the editing. So
            // schedule it for ASAP.
            var me = this;
            setTimeout(function () {
                me.validator.restartAt(el);
            }, 0);
        }
    }.bind(this));


    this.decorator.addHandlers();

    this.domlistener.addHandler(
        "included-element",
        "._label",
        function (root, tree, parent, prev, next, target) {
        var cl = target.classList;
        var found = false;
        for(var i = 0; i < cl.length && !found; ++i) {
            if (cl[i].lastIndexOf("_label_level_", 0) === 0) {
                found = Number(cl[i].slice(13));
            }
        }
        if (!found)
            throw new Error("unable to get level");
        if (found > this._current_label_level)
            cl.add("_invisible");
    }.bind(this));

    // If an element is edited and contains a placeholder, delete
    // the placeholder
    this._updating_placeholder = 0;
    this.domlistener.addHandler(
        "children-changed",
        "._real, ._phantom_wrap",
        function (root, added, removed, prev, next, target) {
        if (this._updating_placeholder)
            return;

        this._updating_placeholder++;

        // We perform this check on the GUI tree because there's no
        // way to know about ._phantom._text elements in the data
        // tree.
        var to_consider = [];
        var ph;
        var child = target.firstChild;
        while(child) {
            if (child.nodeType === Node.TEXT_NODE ||
                child.classList.contains("_real") ||
                child.classList.contains("_phantom_wrap") ||
                // For ._phantom._text but ._text is used only with
                // ._real and ._phantom so we don't check for
                // ._phantom.
                child.classList.contains("_text"))
                to_consider.push(child);
            if (child.classList &&
                child.classList.contains("_placeholder"))
                ph = child;
            child = child.nextSibling;
        }

        if (to_consider.length === 0 ||
            (to_consider.length === 1 &&
             removed.indexOf(to_consider[0]) !== -1)) {
            if (!ph) {
                var nodes = this.mode.nodesAroundEditableContents(target);
                ph = this.mode.makePlaceholderFor(target);
                this._gui_updater.insertBefore(target, ph, nodes[1]);
            }
        }
        else if (ph && !ph.classList.contains("_transient")) {
            var caret = this._sel_focus && this._sel_focus.node;
            // Move the caret out of the placeholder if needed...
            var move = ph.contains(caret);
            var parent, offset;
            if (move) {
                parent = ph.parentNode;
                offset = _indexOf.call(parent.childNodes, ph);
            }
            this._gui_updater.removeNode(ph);
            if (move)
                this._setGUICaret(parent, offset, "text_edit");
        }

        this._updating_placeholder--;
    }.bind(this));

    var attributePlaceholderHandler =
        function (target) {
            if (this._updating_placeholder)
                return;

            this._updating_placeholder++;
            var data_node = this.toDataNode(target);
            var ph = domutil.childByClass(target, "_placeholder");
            if (data_node.value) {
                if (ph)
                    target.removeChild(ph);
            }
            else if (!ph)
                this._gui_updater.insertBefore(target,
                                               domutil.makePlaceholder(),
                                               null);
            this._updating_placeholder--;
        }.bind(this);

    this.domlistener.addHandler(
        "children-changed",
        "._attribute_value",
        function (root, added, removed, prev, next, target) {
        attributePlaceholderHandler(target);
    });

    this.domlistener.addHandler(
        "included-element",
        "._attribute_value",
        function (root, tree, parent, prev, next, target) {
        attributePlaceholderHandler(target);
    });

    this.decorator.startListening(this.$gui_root);
    if (this._data_doc.firstChild)
        this.data_updater.insertAt(this.data_root, 0,
                                   this._data_doc.firstChild);
    if (this._save) {
        switch(this._save.path) {
        case "wed/savers/ajax":
            this._saver = new AjaxSaver(version, this.data_updater,
                                        this.data_root, this._save.options);
            break;
        case "wed/savers/localforage":
            this._saver = new LocalSaver(version, this.data_updater,
                                         this.data_root, this._save.options);
            break;
        default:
            throw new Error("unknown saver: " + this._save.path);
        }

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
        onbeforeunload.install(
            this.my_window,
            "The document has unsaved modifications. "+
                "Do you really want to leave without saving?",
            function () {
            return !!this._saver.getModifiedWhen();
        }.bind(this),
            true);
    }
    else
        log.error("wed cannot save data due " +
                  "to the absence of a save_url option");

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

    this._$scroller.on('scroll', this._refreshFakeCaret.bind(this));

    this._$input_field.on('keydown', this._keydownHandler.bind(this));
    this._$input_field.on('keypress', this._keypressHandler.bind(this));

    this._$input_field.on('compositionstart compositionupdate compositionend',
                      this._compositionHandler.bind(this));
    this._$input_field.on('input', this._inputHandler.bind(this));

    // No click in the next binding because click does not
    // distinguish left, middle, right mouse buttons.
    this.$gui_root.on('mousedown', this._mousedownHandler.bind(this));
    this.$gui_root.on('mouseover', this._mouseoverHandler.bind(this));
    this.$gui_root.on('mouseout', this._mouseoutHandler.bind(this));
    this.$gui_root.on('contextmenu', this._mouseupHandler.bind(this));

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
    var $body = $(this.doc.body);
    $body.on('mouseup.wed', function (ev) {
        this.$gui_root.off('mousemove.wed mouseup');
        this._$caret_layer.off('mousemove mouseup');
    }.bind(this));

    $body.on('contextmenu', function (ev) {
        // It may happen that contextmenu can escape to the body even
        // if the target is an element in gui_root. This notably
        // happens on IE for some reason. So trap such cases here and
        // dispose of them.
        if (this.gui_root.contains(ev.target))
            return false;
        return true;
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

        var el = this.doc.elementFromPoint(ev.clientX, ev.clientY);

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
    this._$error_layer.on("mousedown click contextmenu", function (ev) {
        this._$caret_layer.trigger(ev);
        return false;
    }.bind(this));

    // Make ourselves visible.
    this.$widget.removeClass("loading");
    this.$widget.css("display", "block");

    var namespace_error = this._initializeNamespaces();
    if (namespace_error) {
        this._limitation_modal.setBody(
            namespace_error);
        this._limitation_modal.modal();
        this.destroy();
        return;
    }
    this.domlistener.processImmediately();
    // Flush whatever has happened earlier.
    this._undo = new undo.UndoList();

    this.$gui_root.focus();

    this.validator.start();

    if (this._saver) {
        // The editor is not initialized until the saver is also
        // initialized, which may take a bit.
        var me = this;
        this._saver.whenCondition("initialized", function () {
            me._setCondition("initialized", {editor: me});
        });
    }
    else
        this._setCondition("initialized", { editor: this});
});

Editor.prototype._initializeNamespaces = function () {
    var failure = false;
    if (!this.data_root.firstChild) {
        // The document is empty: create a child node with the absolute
        // namespace mappings.
        var attrs = Object.create(null);
        this.validator.getSchemaNamespaces().forEach(function (ns) {
            var k = this.resolver.prefixFromURI(ns);
            // Don't create a mapping for the `xml`, seeing as it is
            // defined by default.
            if (k === "xml")
                return;

            if (k === "")
                attrs.xmlns = ns;
            else {
                if (k === undefined)
                    failure = "The mode does not allow determining " +
                    "the namespace prefix for " + ns + "." +
                    "The most likely issue is that the mode is buggy " +
                    "or wed was started with incorrect options.";
                attrs["xmlns:" + k] = ns;
            }
        }.bind(this));

        if (failure)
            return failure;

        var evs = this.validator.possibleAt(this.data_root, 0).toArray();
        if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
            transformation.insertElement(
                this.data_updater, this.data_root, 0,
                evs[0].params[1],
                this.resolver.unresolveName(evs[0].params[1],
                                            evs[0].params[2]), attrs);
        }
    }
    else {
        var namespaces = this.validator.getDocumentNamespaces();
        // Yeah, we won't stop as early as possible if there's a failure.
        // So what?
        var resolver = this.resolver;
        Object.keys(namespaces).forEach(function (prefix) {
            var uri = namespaces[prefix];
            if (uri.length > 1)
                failure =
                "The document you are trying to edit uses namespaces "+
                "in a way not supported by this version of wed.";

            resolver.definePrefix(prefix, uri[0]);
        });
    }
    return failure;
};

function unloadHandler(e) {
    e.data.editor.destroy();
}

});
