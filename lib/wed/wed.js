define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var rangy = require("rangy");
var validator = require("./validator");
var Validator = validator.Validator;
var util = require("./util");
var domutil = require("./domutil");
var domlistener = require("./domlistener");
var transformation = require("./transformation");
var validate = require("salve/validate");
var oop = require("./oop");
var undo = require("./undo");
var wundo = require("./wundo");
var jqutil = require("./jqutil");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var Conditioned = require("./lib/conditioned").Conditioned;
require("bootstrap");

exports.version = "0.4.0";

var getOriginalName = util.getOriginalName;

function Editor() {
    // Call the constructor for our mixins
    SimpleEventEmitter.call(this);
    Conditioned.call(this);
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

    this.widget = widget;
    this.$widget = $(this.widget);

    // We could be loaded in a frame in which case we should not
    // alter anything outside our frame.
    this.$frame = this.$widget.closest("html");
    this.my_window = this.$frame.get(0).ownerDocument.defaultView;

    this.options = options;

    // $root and root represent the document root in the HTML elements
    // displayed. The top level element of the XML document being
    // edited will be the single child of $root/root.
    this.$root = $("<div class='wed-document'/>");

    this.$widget.wrapInner(this.$root);
    // jQuery does not update this.$root to reflect its position in the
    // DOM tree.
    this.$root = $(this.widget.childNodes[0]);

    this.root = this.$root.get(0);

    // $tree_root is the document we are editing, $root will become
    // decorated with all kinds of HTML elements so we keep the two
    // separate.
    this.$tree_root = this.$root.clone();
    domutil.linkTrees(this.$tree_root.get(0), this.$root.get(0));

    this.$root.wrap('<div class="row-fluid"><div class="span10"/></div>');
    this.$sidebar = $('<div id="sidebar" class="span2"/>');
    this.$widget.find('.row-fluid').first().prepend(this.$sidebar);
    // Needed by Validator
    this.$root.before("<div class='row-fluid'><div class='span12 progress progress-info'><span></span><div id='validation-progress' class='bar' style='width: 0%'></div></div></div>");
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

    this.$widget.prepend("<div id='menu-layer'>");
    this.menu_layer = this.widget.childNodes[0];

    // tabindex needed to make keyboard stuff work... grumble...
    // https://github.com/twitter/bootstrap/issues/4663
    this.$hyperlink_modal = $(
        '\
<div class="modal hide fade" tabindex="1">\
  <div class="modal-header">\
    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
    <h3>Insert hyperlink</h3>\
  </div>\
  <div class="modal-body">\
    <p>One fine body…</p>\
  </div>\
  <div class="modal-footer">\
    <a href="#" class="btn btn-primary" data-dismiss="modal">Insert</a>\
    <a href="#" class="btn" data-dismiss="modal">Close</a>\
  </div>\
</div>');
    this.$widget.prepend(this.$hyperlink_modal);

    this._raw_caret = undefined;

    this._selection_stack = [];

    // XXX this should probably go and be replaced by a check to make
    // sure bootstrap.css or a variant has been loaded. (Or
    // configurable to load something else than the minified version?)
    var bootstrap_css = require.toUrl("bootstrap/../../css/bootstrap.min.css");
    this.$frame.children("head").prepend('<link rel="stylesheet" href="' + bootstrap_css + '" type="text/css" />');

    // This domlistener is used only for validation.
    this.validation_domlistener = new domlistener.Listener(this.$tree_root);

    // This domlistener is used for everything else
    this.domlistener = new domlistener.Listener(this.root);

    // Setup the cleanup code.
    $(this.my_window).on('unload.wed', { 'editor': this }, unloadHandler);

    this._last_done_shown = 0;
    this.$error_list = this.$widget.find("#sb-errorlist");

    this._undo = new undo.UndoList();

    this.mode_path = options.mode.path;
    this.setMode(this.mode_path, options.mode.options);
};

(function () {
    this.setMode = function (mode_path, options) {
        require([mode_path], function (mode_module) {
            mode_module.Mode.optionResolver(
                options,
                function (resolved_opts) {
                    this.onModeChange(new mode_module.Mode(resolved_opts));
                }.bind(this));
        }.bind(this));
    };

    this.onModeChange = function (mode) {
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

        this.$root.css("overflow-y", "auto");
        var $next = this.$widget.next();

        // The height is the inner height of the window:
        // a. minus what appears before it.
        // b. minus what appears after it.
        var height = -5 + this.my_window.innerHeight -
            // This is the space before
            this.$root.offset().top -
            // This is the space after
            (($next.offset().top > 0) ?
             ($(document).height() - $next.offset().top) : 0);

        this.$root.css("max-height", height);
        this.$root.css("min-height", height);

        this.resolver = mode.getAbsoluteResolver();
        this.validator = new Validator(
            this.options.schema,
            this.$tree_root.get(0));
        this.validator.addEventListener(
            "state-update", this._onValidatorStateChange.bind(this));
        this.validator.addEventListener(
            "error", this._onValidatorError.bind(this));
        this.validator.addEventListener(
            "reset-errors", this._onResetErrors.bind(this));

        this.validator.initialize(this._postInitialize.bind(this));
    };

    this._postInitialize = function  () {
        if (this._destroyed)
            return;

        var root = this.root;
        var $root = this.$root;

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

        this.copy_domlistener = new domlistener.Listener(this.$tree_root);

        this.copy_domlistener.addHandler(
            "text-changed",
            "._real, ._phantom_wrap",
            function ($root, $target) {
                var editor = this;
                var path = domutil.nodeToPath($root.get(0), $target.get(0));
                var gui_node = editor.pathToNode(path);
                gui_node.nodeValue = $target.get(0).nodeValue;
            }.bind(this));

        this.copy_domlistener.addHandler(
            "children-changed",
            "._real, ._phantom_wrap, .wed-document",
            function ($root, $added, $removed, $prev, $next, $target) {
                var $added_narrow = $added.filter(function () {
                    return $(this).is("._real, ._phantom_wrap") ||
                        jqutil.textFilter.call(this);
                });
                var $removed_narrow = $removed.filter(function () {
                    return $(this).is("._real, ._phantom_wrap") ||
                        jqutil.textFilter.call(this);
                });

                // Stupid hoisting
                var i, $node, $node_prev, $node_next, path, $new;
                for(i = 0; i < $added_narrow.length; ++i) {
                    $node = $($added_narrow.get(i));
                    $new = $node.clone();
                    domutil.linkTrees($new.get(0), $node.get(0));
                    $node_prev = $node.prev();
                    $node_next = $node.next();
                    if ($node_prev.length > 0) {
                        path = domutil.nodeToPath($root.get(0),
                                                  $node_prev.get(0));
                        $(this.pathToNode(path)).after($new);
                    }
                    else if ($node_next.length > 0) {
                        path = domutil.nodeToPath($root.get(0),
                                                  $target.get(0));
                        $(this.pathToNode(path)).prepend($new);
                    }
                    else {
                        path = domutil.nodeToPath($root.get(0), $target.get(0));
                        $(this.pathToNode(path)).append($new);
                    }
                }

                // Stupid hoisting
                var $mirror;

                // Do it in reverse
                for(i = $removed_narrow.length - 1; i >= 0; --i) {
                    $node = $($removed_narrow.get(i));
                    var mirror = $node.data("wed_mirror_node");
                    if (mirror !== undefined) {
                        $mirror = $(mirror);
                        $mirror.remove();
                        $mirror.removeData("wed_mirror_node");
                        $node.removeData("wed_mirror_node");
                    } else if ($node.get(0).nodeType === Node.TEXT_NODE) {
                        $mirror = $($target.data("wed_mirror_node"));
                        if ($target.get(0).childNodes.length === 0) {
                            // Everything was removed from the target.
                            $mirror.empty();
                        }
                        else {
                            // We can't do the following because the
                            // node is no longer in its tree.
                            //
                            // path = domutil.nodeToPath($root.get(0),
                            //                           $node.get(0));
                            // $(this.pathToNode(path)).remove();

                            // This is relatively expensive but there
                            // is no easy way currently to locate text
                            // nodes that have been removed from the
                            // tree.
                            $mirror = $($target.data("wed_mirror_node"));
                            $new = $target.clone();
                            $mirror.replaceWith($new);
                            domutil.linkTrees($new.get(0), $target.get(0));
                        }
                    }
                }
            }.bind(this));


        this.copy_domlistener.startListening();

        this.decorator = this.mode.makeDecorator(this.domlistener, this);
        this.tr = this.mode.getTransformationRegistry();
        this.decorator.init($root);

        // If a placeholder is edited, delete it.
        this.domlistener.addHandler(
            "children-changed",
            "._placeholder",
            function ($root, $added, $removed, $prev, $next, $target) {
                if ($added.is("._real, ._phantom_wrap") ||
                    $removed.is("._real, ._phantom_wrap"))
                    $target.children().unwrap();
            });

        // If a placeholder is edited, delete it.
        this.domlistener.addHandler(
            "text-changed",
            "._placeholder",
            function ($root, $target) {
                // Make sure we do no chase after targets that are no
                // longer part of the DOM.
                if ($target.closest(document.documentElement).length >
                    0) {
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
        this.domlistener.addHandler(
            "children-changed",
            "._real, ._phantom_wrap",
            function ($root, $added, $removed, $prev, $next, $target) {
                // Narrow it to the elements we care about.
                var $narrow_added =
                        $added.filter(
                            "._real, ._phantom_wrap, ._phantom._text").
                        add($added.filter(jqutil.textFilter));
                var $narrow_removed =
                        $removed.filter(
                            "._real, ._phantom_wrap, ._phantom._text").
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

        this.domlistener.addHandler(
            "added-element",
            "._real, ._phantom_wrap",
            function ($root, $parent, $prev, $next, $target) {
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
            }.bind(this));


        // Wed caret has been moved, emit a change
        this.domlistener.addHandler(
            "added-element",
            "._wed_caret",
            function () {
                this._caretChangeEmitter();
            }.bind(this));

        this.copy_domlistener.addHandler(
            "children-changed",
            "._real, ._phantom_wrap",
            function ($root, $added, $removed, $prev, $next, $target) {
                if (this._suppress_undo_recording)
                    return;
                // Narrow it to the elements we care about.
                var $narrow_added =
                        $added.filter(
                            "._real, ._phantom_wrap, ._placeholder").
                        add($added.filter(jqutil.textFilter));
                var $narrow_removed =
                        $removed.filter(
                            "._real, ._phantom_wrap, ._placeholder").
                        add($removed.filter(jqutil.textFilter));
                if ($narrow_added.length + $narrow_removed.length === 0)
                    return;

                $prev = ($prev.is("._real, ._phantom_wrap") ? $prev :
                         $prev.prevAll("._real, ._phantom_wrap").first());
                $next = ($next.is("._real, ._phantom_wrap") ? $next:
                         $next.nextAll("._real, ._phantom_wrap").first());
                this._undo.record(new wundo.DOMUndo(
                    this, $target, $narrow_added, $narrow_removed, $prev,
                    $next));
            }.bind(this));

        this.copy_domlistener.addHandler(
            "text-changed",
            "._real, ._phantom_wrap",
            function ($root, $element, old_value) {
                if (this._suppress_undo_recording)
                    return;
                // Narrow it to the elements we care about.
                this._undo.record(new wundo.TextNodeUndo(
                    this, $element, old_value));
            }.bind(this));

        this.domlistener.addHandler(
            "excluded-element",
            "._wed_caret",
            function ($root, $tree, $parent, $prev, $next, $element) {
                // Act only if the caret is being removed because its
                // parent is being removed. Direct action on the caret
                // does not trigger this code.
                if ($element.get(0) !== this._$fake_caret.get(0)) {
                    // We must move the caret to a sane position.
                    if ($prev.length > 0 && $prev.closest($root).length > 0)
                        $prev.after(this._$fake_caret);
                    else if ($next.length > 0 && $next.closest($root).length > 0)
                        $next.before(this._$fake_caret);
                    else if ($parent.closest($root).length > 0)
                        $parent.append(this._$fake_caret);
                    else {
                        // There's nowhere sensible to put it at
                        this._$fake_caret.remove();
                        this._raw_caret = undefined;
                    }
                }
            }.bind(this));

        if (root.childNodes.length === 0) {
            var namespaces = this.validator.getNamespaces();

            // Drop the xml namespace, because we don't need to define
            // it. It will appear at most once in the array.
            var xml = namespaces.indexOf(util.XML1_NAMESPACE);
            if (xml >= 0)
                namespaces.splice(xml, 1);

            var mappings = Object.create(null);
            if (namespaces.length === 1)
                // Just make this namespace the default one
                mappings[""] = namespaces[0];
            else { // Ask the user
                var $hyperlink_modal = this.$hyperlink_modal;
                $hyperlink_modal.find("h3").text("Assign names for namespaces");
                var $body = $hyperlink_modal.find('.modal-body');
                $body.empty();
                namespaces.forEach(function (ns) {
                    // XXX this is incomplete
                    $body.append('<input type="text" name="..."/>');
                    $body.append("<label>" + ns + "</label>");
                });
                $hyperlink_modal.modal();
            }

            var attrs = Object.create(null);
            Object.keys(mappings).forEach(function (k) {
                this.resolver.definePrefix(k, mappings[k]);
                if (k === "")
                    attrs.xmlns = mappings[k];
                else
                    attrs["xmlns:" + k] = mappings[k];
            }.bind(this));

            var evs = this.validator.possibleAt(root, 0).toArray();
            if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
                transformation.insertElement(
                    this, this.$tree_root.get(0), 0,
                    this.resolver.unresolveName(evs[0].params[1],
                                                evs[0].params[2]),
                    attrs);
            }

            ///else
                /// XXX log an error somewhere
        }

        $root.on('keydown', util.eventHandler(this._keyDownHandler.bind(this)));
        $root.on('keypress',
                 util.eventHandler(this._keyPressHandler.bind(this)));
        $root.on('click.wed', this._mouseHandler.bind(this));
        // No click in the next binding because click does not
        // distinguish left, middle, right mouse buttons.
        $root.on('keyup mouseup', this._caretChangeEmitter.bind(this));
        $root.on('caretchange', this._caretChangeHandler.bind(this));
        $root.on('contextmenu', util.eventHandler(this._contextMenuHandler.bind(this)));

        var nav_links = [];
        $root.find(".head").each(function (x, el) {
            nav_links.push("<li><a href='#" + el.id + "'>" + $(el).text() + "</a></li>");
        });
        this.$sidebar.find("#navlist>.inactive").replaceWith(nav_links.join(""));

        this.validator.start();

        this.domlistener.processImmediately();
        // Flush whatever has happened earlier.
        this._undo = new undo.UndoList();
        this._setCondition("initialized", {editor: this});
    };

    /**
     * This method asks the editor to process any pending operation
     * which may impact the display. This method is meant to be used
     * internally by the editor and for testing/debugging purposes
     * only. Consequently, the various modes that customize wed's
     * behavior must not use this method. If calling this method makes
     * a mode that did not work well work normally, then either the
     * code that was not working well is buggy (and calling
     * _syncDisplay is not the solution) or there is a bug in wed that
     * should be fixed.
     */
    this._syncDisplay = function () {
        this.copy_domlistener.processImmediately();
        this.domlistener.processImmediately();
    };

    this.fireTransformation = function(tr, node, element_name,
                                       new_caret_position) {
        this.dismissContextMenu();

        if (new_caret_position)
            this.setTreeCaret(new_caret_position);

        if (this._raw_caret === undefined)
            throw new Error("transformation applied with undefined caret.");
        var current_group = this._undo.getGroup();
        if (current_group !== undefined) {
            if (!(current_group instanceof wundo.TextUndoGroup))
                throw new Error(
                    "unexpected group class in _fireTransformation");
            this._undo.endGroup();
        }

        this._undo.startGroup(
            new wundo.UndoGroup("Undo " +
                                tr.getDescriptionFor(element_name),
                               this));
        if (node !== undefined) {
            // Convert the node to a tree node
            if ($(node).closest(this.$root).length > 0) {
                var path = this.nodeToPath(node);
                node = domutil.pathToNode(this.$tree_root.get(0), path);
            }
            else if ($(node).closest(this.$tree_root).length === 0) {
                throw new Error("node is neither in the gui tree nor "+
                                "the data tree");
            }
        }
        tr.handler(this, node, element_name);
        this.domlistener.processImmediately();
        this._undo.endGroup();
    };

    this._fireTransformation = function (e, new_caret_position) {
        this.fireTransformation(e.data.tr, e.data.node,
                                e.data.element_name, new_caret_position);
    };

    this.recordUndo = function (undo) {
        this._undo.record(undo);
    };

    this.undo = function () {
        this._suppress_undo_recording = true;
        this._undo.undo();
        this.copy_domlistener.processImmediately();
        this.domlistener.processImmediately();
        this._suppress_undo_recording = false;
    };

    this.redo = function () {
        this._suppress_undo_recording = true;
        this._undo.redo();
        this.copy_domlistener.processImmediately();
        this.domlistener.processImmediately();
        this._suppress_undo_recording = false;
    };

    this._contextMenuHandler = function (e, jQthis) {
        // If the caret is changing due to a click on a placeholder,
        // then put it inside the placeholder.
        var $ph = $(e.target).closest("._placeholder");
        if ($ph.length > 0)
            this.setCaret($ph.get(0).childNodes[0], 0);

        var selection = rangy.getSelection(this.my_window);
        var original_range = domutil.getSelectionRange(this.my_window);
        var range = original_range.cloneRange();
        var start_is_focus = (
            (selection.focusNode === range.startContainer) &&
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
            $node_of_interest = $(domutil.pathToNode(this.$tree_root.get(0),
                                                     this.nodeToPath($node_of_interest.get(0))));
            this.validator.possibleAt(
                $node_of_interest.get(0),
                offset).forEach(function (ev) {
                    if (ev.params[0] !== "enterStartTag")
                        return;

                    var unresolved = this.resolver.unresolveName(
                        ev.params[1], ev.params[2]);

                    var trs = this.tr.getTagTransformations(
                        wrap ? "wrap" : "insert", unresolved);
                    if (trs === undefined)
                        return;

                    for(var tr_ix = 0, tr; (tr = trs[tr_ix]) !== undefined;
                        ++tr_ix) {
                        var $a = $("<a tabindex='0' href='#'>" +
                                   tr.getDescriptionFor(unresolved) +
                                   "</a>");
                        $a.click({'tr': tr,
                                  'element_name': unresolved },
                                 this._fireTransformation.bind(this));
                        menu_items.push(
                            $("<li></li>").append($a).get(0));
                    }
                }.bind(this));

            if ($node_of_interest.get(0) !== this.root.childNodes[0]) {
                var orig = getOriginalName($node_of_interest.get(0));
                var trs = this.tr.getTagTransformations("delete-parent", orig);
                if (trs !== undefined) {
                    trs.forEach(function (tr) {
                        var $a = $("<a tabindex='0' href='#'>" +
                                   tr.getDescriptionFor(orig) + "</a>");
                        $a.click({tr: tr, node: $node_of_interest.get(0),
                                  element_name: orig },
                                 this._fireTransformation.bind(this));
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

        var $sep = $node_of_interest.parents().addBack().siblings("[data-wed--separator-for]").first();
        var node_of_interest = $node_of_interest.get(0);
        var $transformation_node = $sep.siblings().filter(function () {
            return (this === node_of_interest) ||
                $(this).has(node_of_interest).length > 0;
        });
        var sep_for = $sep.attr("data-wed--separator-for");
        if (sep_for !== undefined) {
            var trs = this.tr.getTagTransformations(
                ["merge-with-next", "merge-with-previous", "append",
                 "prepend"], sep_for);
            trs.forEach(function (tr) {
                var $a = $("<a tabindex='0' href='#'>" + tr.getDescriptionFor(sep_for) + "</a>");
                $a.click({'tr': tr,
                          'node': $transformation_node.get(0),
                          'element_name': sep_for},
                         this._fireTransformation.bind(this));
                menu_items.push($("<li></li>").append($a).get(0));
            }.bind(this));
        }

        // There's no menu to display, so let the event bubble up.
        if (menu_items.length === 0)
            return true;

        // We must wait to do this after we are done with the range.
        var pos = rangeToPixelPosition(this.my_window);

        this.displayContextMenu(pos.left, pos.top, menu_items);
        return false;
    };

    this.moveCaretRight = function () {
        this._$fake_caret.remove();
        var pos = this._raw_caret;
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
            pos = domutil.nextCaretPosition(pos, this.root, false);
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

            if (// Can't stop inside a phantom node.
                (($node.closest("._phantom").length > 0) ||
                 // Or beyond the first position in a placeholder
                 // node.
                 (pos[1] > 0 &&
                  $node.closest("._placeholder").length > 0)))
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

    this.moveCaretLeft = function () {
        this._$fake_caret.remove();
        var pos = this._raw_caret;
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
            pos = domutil.prevCaretPosition(pos, this.root, false);
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

    this._canSetCaretHere = function (pos) {
        var r = rangy.createRange();
        r.setStart(pos[0], pos[1]);
        var sel = rangy.getSelection(this.my_window);
        // Save the range before doing this so that we can restore
        // it.  Note that rangy won't help here because it will
        // insert a span and mess up our caret position.
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


    this.setCaret = function (node, offset, force_fake) {
        this._$fake_caret.remove();
        // Accept a single array as argument
        if (arguments.length === 1 && node instanceof Array) {
            offset = node[1];
            node = node[0];
        }

        var r = rangy.createRange();
        r.setStart(node, offset);
        var sel = rangy.getSelection(this.my_window);
        sel.setSingleRange(r);

        // Check whether the position "took".
        var r2 = sel.rangeCount > 0 && sel.getRangeAt(0);
        if (force_fake || !r2 || !r2.equals(r)) {
            sel.removeAllRanges(); // Clear the selection
            // We set a fake caret.
            switch (node.nodeType)
            {
            case Node.TEXT_NODE:
                domutil.insertIntoText(node, offset, this._$fake_caret.get(0));
                break;
            case Node.ELEMENT_NODE:
                if (node.childNodes.length > 0)
                    node.insertBefore(this._$fake_caret.get(0),
                                      node.childNodes[offset]);
                else
                    node.appendChild(this._$fake_caret.get(0));
                break;
            default:
                throw new Error("unexpected node type: " + node.nodeType);
            }
        }
        this._caretChangeEmitter();
    };

    this._keyDownHandler = function (e, jQthis) {
        // Cursor movement keys: pass them.
        if (e.which >= 33 /* page up */ &&
            e.which <= 40 /* down arrow */) {
            switch(e.which) {
            case 39:
                this._undo.endAllGroups();
                this.moveCaretRight();
                return false;
            case 37:
                this._undo.endAllGroups();
                this.moveCaretLeft();
                return false;
            }
            return true;
        }
        // Ctrl-Z
        else if (e.ctrlKey && e.which === 90) {
            this.undo();
            return false;
        }
        // Ctrl-Y
        else if (e.ctrlKey && e.which === 89) {
            this.redo();
            return false;
        }

        // Ctrl-/
        if (e.ctrlKey && e.which === 191)
            return this._contextMenuHandler.call(this, e, jQthis);

        var range = domutil.getSelectionRange(this.my_window);

        // When a range is selected, we would replace the range with
        // the text that the user entered. Except that we do not want
        // to do that unless it is a clean edit. What's a clean edit?
        // It is an edit which starts and end in the same element.
        if (range !== undefined) {
            if (range.startContainer === range.endContainer) {
                var ret = (range.startContainer.nodeType === Node.TEXT_NODE) ?
                    // Text node, we are uneditable if our parent is of
                    // the _phantom class.
                    !($(range.startContainer.parentNode).
                      hasClass('_phantom') ||
                      $(range.startContainer.parentNode).hasClass('_phantom_wrap')):
                    // Otherwise, we are uneditable if any child is
                    // ._phantom.
                    !($(range.startContainer).find('._phantom') ||
                      $(range.startContainer).find('._phantom_wrap'));

                if (!ret)
                    return false;
            }

            // If the two containers are elements, the startContainer
            // could be:
            //
            // - parent of the endContainer,
            // - child of the endContainer,
            // - sibling of the endContainer,

            if (!range.collapsed)
                return false;
        }

        if (this._raw_caret !== undefined) {
            var $placeholders = $(this._raw_caret[0]).closest('._placeholder');
            if ($placeholders.length > 0) {
                // Reminder: if the caret is currently inside a
                // placeholder getCaret will return a caret value just in
                // front of the placeholder.
                var caret = this.getTreeCaret();

                // A place holder could be in a place that does not allow
                // text. If so, then do not allow entering regular text in
                // this location.
                if (!util.anySpecialKeyHeld(e) &&
                    !this.validator.possibleAt(caret[0], caret[1]).
                    has(new validate.Event("text")))
                    return false;

                // Swallow these events when they appen in a placeholder.
                if (util.anySpecialKeyHeld(e) ||
                    e.which === 8 ||
                    // This is DEL. e.which === 46 when a period is
                    // entered, so check the charCode too.
                    e.which === 46 && e.charCode === 0)
                    return false;
            }

            if ($(this._raw_caret[0]).hasClass('_phantom') ||
                $(this._raw_caret[0]).hasClass('_phantom_wrap')) {
                return false;
            }
        }

        if (e.which === 46 && e.charCode === 0) {
            // Prevent deleting phantom stuff
            if (!$(domutil.nextCaretPosition(this._raw_caret, this.root,
                                            true)[0])
                .is("._phantom, ._phantom_wrap")) {
                // We need to handle the delete
                caret = this.getTreeCaret();
                // If the container is not a text node, we may still
                // be just AT a text node from which we can
                // delete. Handle this.
                if (caret[0].nodeType !== Node.TEXT_NODE)
                    caret = [caret[0].childNodes[caret[1]], 0];

                if (caret[0].nodeType === Node.TEXT_NODE) {
                    this._initiateTextUndo();
                    domutil.deleteText(caret[0], caret[1], 1);
                    this.copy_domlistener.processImmediately();
                    this.domlistener.processImmediately();
                }
            }
            return false;
        }

        if (e.which === 8 && e.charCode === 0) {
            // Prevent backspacing over phantom stuff
            if (!$(domutil.prevCaretPosition(this._raw_caret, this.root,
                                            true)[0])
                .is("._phantom, ._phantom_wrap")) {
                // We need to handle the backspace
                caret = this.getTreeCaret();

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
                    this._initiateTextUndo();
                    domutil.deleteText(caret[0], caret[1] - 1, 1);
                    this.copy_domlistener.processImmediately();
                    this.domlistener.processImmediately();
                    // Don't set the caret inside a node that has been
                    // deleted.
                    if (caret[0].parentNode)
                        this.setTreeCaret(caret[0], caret[1] - 1);
                    else
                        this.setTreeCaret(parent, offset);
                }
            }
            return false;
        }
        return true;
    };

    this._initiateTextUndo = function () {
        // Handle undo information
        var current_group = this._undo.getGroup();
        if (current_group === undefined)
            this._undo.startGroup(new wundo.TextUndoGroup("text", this,
                                                          this._undo, 10));
        else if (!(current_group instanceof wundo.TextUndoGroup))
            throw new Error("group not undefined and not a TextUndoGroup");
    };

    this._keyPressHandler = function (e) {
        if (this._raw_caret === undefined)
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

        var caret = this._raw_caret.slice();

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
        caret = this.getTreeCaret();
        var insert_ret = domutil.insertText(caret[0], caret[1], text);
        this.copy_domlistener.processImmediately();
        this.domlistener.processImmediately();
        this.moveCaretRight();
        if (insert_ret[1] !== caret[0])
            this.moveCaretRight();

        return false;
    };

    this._mouseHandler = function (e) {
        if (e.type === "click") {
            this._undo.endAllGroups();

            if (this.menu_layer.childNodes.length > 0) {
                this.dismissContextMenu();
                return false; // This click does not do anything else.
            }
        }

        return true;
    };

    this._menuHandler = function (e, jQthis) {
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
     * This method returns the current position of the caret. However,
     * in sanitizes its return value to avoid providing positions
     * where inserting new elements or text is not allowed. One prime
     * example of this would be inside of a _placeholder or a _gui
     * element.
     *
     * @method
     * @name Editor#getCaret
     *
     * @returns {Array.<Integer>} The returned value is an array of
     * size two which has for first element the node where the caret
     * is located and for second element the offset into this
     * node. The pair of node and offset is to be interpreted as the
     * same way it is interpreted for DOM ranges. Callers must not
     * change the value they get.
     *
     */
    this.getCaret = function () {
        // Caret is unset
        if (this._raw_caret === undefined)
            return undefined;

        return this.normalizeCaret(this._raw_caret);
    };

    this.normalizeCaret = function (node, offset) {
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

    this.fromTreeCaret = function (node, offset) {
        // Accept a single array as argument
        if (arguments.length === 1 && node instanceof Array) {
            offset = node[1];
            node = node[0];
        }

        var gui_node;
        if (node.nodeType === Node.TEXT_NODE) {
            gui_node = this.pathToNode(domutil.nodeToPath(
                this.$tree_root.get(0), node));
            return [gui_node, offset];
        }

        if (offset >= node.childNodes.length) {
            gui_node = this.pathToNode(domutil.nodeToPath(
                this.$tree_root.get(0), node));
            return [gui_node, gui_node.childNodes.length];
        }

        var gui_child = this.pathToNode(
            domutil.nodeToPath(this.$tree_root.get(0),
                               node.childNodes[offset]));
        return [gui_child.parentNode,
                Array.prototype.indexOf.call(gui_child.parentNode.childNodes,
                                             gui_child)];
    };

    this.toTreeCaret = function(node, offset) {
        // Accept a single array as argument
        if (arguments.length === 1 && node instanceof Array) {
            offset = node[1];
            node = node[0];
        }

        var normalized = this.normalizeCaret(node, offset);
        node = normalized[0];
        offset = normalized[1];

        var tree_node;
        if (node.nodeType === Node.TEXT_NODE) {
            tree_node = domutil.pathToNode(this.$tree_root.get(0),
                                           this.nodeToPath(node));
            return [tree_node, offset];
        }

        if (offset >= node.childNodes.length) {
            tree_node = domutil.pathToNode(this.$tree_root.get(0),
                                           this.nodeToPath(node));
            return [tree_node, tree_node.childNodes.length];
        }

        var child = node.childNodes[offset];
        if ($(child).is("._placeholder, ._gui, ._wed_caret")) {
            var $prev = $(node.childNodes[offset]).prev(
                ":not(._placeholder, ._gui, ._wed_caret)");
            if ($prev.length === 0) {
                tree_node = domutil.pathToNode(this.$tree_root.get(0),
                                               this.nodeToPath(node));
                return [tree_node, 0];
            }

            tree_node = domutil.pathToNode(
                this.$tree_root.get(0),
                this.nodeToPath($prev.get(0)));
            return [tree_node.parentNode,
                    Array.prototype.indexOf.call(
                        tree_node.parentNode.childNodes, tree_node) + 1];
        }

        tree_node = domutil.pathToNode(this.$tree_root.get(0),
                                       this.nodeToPath(child));
        return [tree_node.parentNode,
                Array.prototype.indexOf.call(tree_node.parentNode.childNodes,
                                             tree_node)];
    };

    this.getTreeCaret = function () {
        this.copy_domlistener.processImmediately();
        var caret = this.getCaret();
        return this.toTreeCaret(caret);
    };

    this.setTreeCaret = function (node, offset) {
        this.copy_domlistener.processImmediately();
        // Accept a single array as argument
        if (arguments.length === 1 && node instanceof Array) {
            offset = node[1];
            node = node[0];
        }
        this.setCaret(this.fromTreeCaret(node, offset));
    };


    this.getCaretAsPath = function () {
        var caret = this.getCaret();
        return [this.nodeToPath(caret[0]), caret[1]];
    };

    this.setCaretAsPath = function (caret) {
        var real_caret = [this.pathToNode(caret[0]), caret[1]];
        this.setCaret(real_caret);
    };

    this.getTreeCaretAsPath = function () {
        var caret = this.getTreeCaret();
        return [domutil.nodeToPath(this.$tree_root.get(0), caret[0]), caret[1]];
    };

    this.setTreeCaretAsPath = function (caret) {
        var real_caret = [domutil.pathToNode(this.$tree_root.get(0), caret[0]),
                          caret[1]];
        this.setTreeCaret(real_caret);
    };


    this._caretChangeEmitter = function (ev) {

        if (ev === undefined)
            ev = {which: undefined,
                  type: undefined,
                  target: undefined};

        if (ev.type === "mouseup") {
            // Clicking always remove a fake caret element.
            this._$fake_caret.remove();

            // If the caret is changing due to a click on a
            // placeholder, then put it inside the placeholder.
            if ($(ev.target).closest("._placeholder").length > 0) {
                var r = rangy.createRange();
                r.setStart(ev.target, 0);
                rangy.getSelection(this.my_window).setSingleRange(r);
            }
        }

        var selection = rangy.getSelection(this.my_window);
        var focus_node;
        var focus_offset;

        // See if we have a fake caret somewhere
        var $parent = this._$fake_caret.parent();
        if ($parent.length > 0) {
            focus_node = $parent.get(0);
            focus_offset = Array.prototype.indexOf.call(
                focus_node.childNodes, this._$fake_caret.get(0));
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

            $(ev_node).trigger("caretchange",
                               [this._raw_caret, old_caret]);
        }
    };

    this._caretChangeHandler = function (e, caret, old_caret) {
        $(this.root).find("._owns_caret").removeClass("_owns_caret");
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

    this.dismissContextMenu = function () {
        // We may be called when there is no menu active.
        if (this.menu_layer.childNodes.length > 0) {
            $(this.menu_layer).empty();
            this.popSelection();
        }
    };

    /**
     * @param items Must be a sequence of <li> elements that will form
     * the menu. The actual data type can be anything that jQuery()
     * accepts.
     */
    this.displayContextMenu = function (x, y, items) {
        this.dismissContextMenu();
        var $dropdown = $("<div class='dropdown'>");
        var $menu = $("<ul tabindex='0' class='dropdown-menu' role='menu'>");
        $dropdown.append($menu);
        $menu.css("overflow-y", "auto");
        $dropdown.css("top", y);
        $dropdown.css("left", x);
        var position = this.$frame.position();
        var height = this.$frame.height();
        // Subtract the frame-relative position from the total height
        // of the frame.
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

    this.pushSelection = function () {
        var range = domutil.getSelectionRange(this.my_window);
        if (range !== undefined)
            this._selection_stack.push(rangy.saveSelection(this.my_window));
        else
            this._selection_stack.push(this._raw_caret);
    };

    this.popSelection = function () {
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

    this.clearSelection = function () {
        this._$fake_caret.remove();
        this._raw_caret = undefined;
        rangy.getSelection(this.my_window).removeAllRanges();
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


    this._onValidatorStateChange = function () {
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
        var $parent = this.$validation_progress.parent();
        $parent.removeClass("progress-info progress-success progress-danger");
        var type = state_to_progress_type[working_state.state];
        $parent.addClass("progress-" + type);
        this.$validation_message.removeClass("label-info label-success label-danger");

        this.$validation_message.text(message);
    };

    this._onValidatorError = function (ev) {
        var error = ev.error;
        var element = ev.element;

        if (element.id === "")
            element.id = util.newGenericID();

        // Turn the expanded names back into qualified names.
        var names = error.getNames();
        for(var ix = 0; ix < names.length; ++ix) {
            names[ix] = this.resolver.unresolveName(names[ix].ns,
                                                    names[ix].name);
        }

        var $item = $("<li><a href='#" + element.id + "'>" +
                      error.toStringWithNames(names) + "</li>");
        this.$error_list.append($item);
    };

    this._onResetErrors = function (ev) {
        this.$error_list.children("li").slice(ev.at).remove();
    };

    this.nodeToPath = function (node) {
        return domutil.nodeToPath(this.root, node);
    };

    this.pathToNode = function (path) {
        return domutil.pathToNode(this.root, path);
    };


    this.destroy = function () {
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
            if (this.domlistener !== undefined)
                this.domlistener.stopListening();
        } catch(ex) { recorded = ex; }


        try {
            if (this.validation_domlistener !== undefined)
                this.validation_domlistener.stopListening();
        } catch(ex) { recorded = ex; }

        // These ought to prevent jQuery leaks.
        try {
            var $root = this.$root;
            $root.off();
            $root.removeData();
            $root.empty();
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

}).call(Editor.prototype);

//
// This function changes the DOM tree temporarily. There does not seem
// to be a reliable portable way to get the position of a range
// otherwise.
//
// THIS MESSES UP THE RANGE! That is, the value of range after is
// going to be different from before.
//

function rangeToPixelPosition(win) {
    var saved = rangy.saveSelection(win);

    // We must grab the range after rangy.saveSelection() has been
    // called because rangy.saveSelection() modifies the DOM and thus
    // makes any selection recorded earlier invalid.
    var selection = rangy.getSelection(win);
    var range = domutil.getSelectionRange(win).cloneRange();
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
        $(container.childNodes[range.startOffset]).before($marker);
        ret = $marker.position();
        $marker.remove();
        break;
    default:
        throw new Error("unexpected node type while handling range; type: " +
                        container.nodeType);
    }
    rangy.restoreSelection(saved);
    return ret;
}

function unloadHandler(e) {
    e.data.editor.destroy();
}

exports.Editor = Editor;

});
