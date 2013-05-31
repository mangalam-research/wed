define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
var rangy = require("rangy");
var parser = require("./parser");
var Parser = parser.Parser;
var util = require("./util");
var domutil = require("./domutil");
var domlistener = require("./domlistener");
var transformation = require("./transformation");
require("bootstrap");

exports.version = "0.1.0";

var getOriginalName = util.getOriginalName;

exports.editor = function (widget, options) {
    return new Editor(widget, options);
};

function Editor(widget, options) {
    if (options === undefined)
        options = module.config();

    this.widget = widget;
    this.$widget = $(this.widget);

    this.options = options;
    
    this.$document = $("<div class='wed-document'/>");

    this.$widget.wrapInner(this.$document);
    // jQuery does not update this.$document to reflect its position in the
    // DOM tree.
    this.$document = $(this.widget.childNodes[0]);
    
    this.root = this.$document.get(0);

    this.$document.wrap('<div class="row-fluid"><div class="span10"/></div>');
    this.$sidebar = $('<div id="sidebar" class="span2"/>');
    this.$widget.find('.row-fluid').first().prepend(this.$sidebar);
    // Needed by Parser
    this.$document.before("<div class='row-fluid'><div class='span12 progress progress-info'><span></span><div id='parsing-progress' class='bar' style='width: 0%'></div></div></div>");
    this.$parsing_progress = this.$widget.find("#parsing-progress");
    this.$parsing_message = this.$parsing_progress.prev('span');

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

    this.selection_stack = [];

    // XXX this should probably go and be replaced by a check to make
    // sure bootstrap.css or a variant has been loaded. (Or
    // configurable to load something else than the minified version?)
    var bootstrap_css = require.toUrl("bootstrap/../../css/bootstrap.min.css");
    $("head").prepend('<link rel="stylesheet" href="' + bootstrap_css + '" type="text/css" />');

    this.domlistener = new domlistener.Listener(this.root);

    // Setup the cleanup code.
    $(window).on('unload.wed', { 'editor': this }, unloadHandler);

    this._last_done_shown = 0;
    this.$error_list = this.$widget.find("#sb-errorlist");

    this.mode_name = options.mode;
    this.setMode(this.mode_name);
}

(function () {
    this.setMode = function (mode_name) {
        require([mode_name], function (mode_module) {
            this.onModeChange(new mode_module.Mode());
        }.bind(this));
    };
    
    this.onModeChange = function (mode) {
        this.mode = mode;
        mode.init(this);

        this.$document.css("overflow-y", "auto");
        var $next = this.$widget.next();

        // The height is the inner height of the window:
        // a. minus what appears before it.
        // b. minus what appears after it.
        var height = -5 + window.innerHeight - 
            // This is the space before
            this.$document.offset().top -
            // This is the space after
            (($next.offset().top > 0) ? 
             ($(document).height() - $next.offset().top) : 0);
        
        this.$document.css("max-height", height);
        this.$document.css("min-height", height);
       
        this.resolver = mode.getAbsoluteResolver();
        this.parser = new Parser(
            this.options.schema, 
            this.root);
        this.parser.on("state-update", this._onParserStateChange.bind(this));
        this.parser.on("error", this._onParserError.bind(this));
        this.parser.on("reset-errors", this._onResetErrors.bind(this));
 
        var root = this.root;
        var $root = $(root);

        this.parser.initialize(this._postInitialize.bind(this));
    };

    this._postInitialize = function  () {
        var root = this.root;
        var $root = $(root);

        this.decorator = this.mode.makeDecorator(this.domlistener, this);
        this.tr = this.mode.getTransformationRegistry();
        this.decorator.init($root);
        
        // Make the parser reparse the structure from the point where
        // a change occurred.
        this.domlistener.addHandler(
            "children-changed",
            "._real, ._phantom_wrap, .wed-document",
            function ($root, $added, $removed, $target) {
                if ($added.is("._real, ._phantom_wrap") || 
                    $removed.is("._real, ._phantom_wrap")) {
                    this._last_done_shown = 0;
                    this.parser.restartAt($target.get(0));
                }
                
            }.bind(this));

        // If a placeholder is edited, delete it.
        this.domlistener.addHandler(
            "children-changed",
            "._placeholder",
            function ($root, $added, $removed, $target) {
                if ($added.is("._real, ._phantom_wrap") || 
                    $removed.is("._real, ._phantom_wrap"))
                    $target.children().unwrap();
            });

        // If an element is edited and contains a placeholder, delete
        // the placeholder
        this.domlistener.addHandler(
            "children-changed",
            "._real, ._phantom_wrap",
            function ($root, $added, $removed, $target) {
                if ($target.children('._real, ._phantom_wrap, ._placeholder').length === 0 && 
                    $target.children().filter(function () { return this.nodeType === Node.TEXT_NODE; }).length === 0) {
                    var nodes = this.mode.nodesAroundEditableContents($target.get(0));
                    var ph = transformation.makePlaceholder();
                    if (nodes[0] !== null)
                        $(nodes[0]).after(ph);
                    else if (nodes[1] !== null)
                        $(nodes[1]).before(ph);
                    else
                        $target.append(ph);
                }
            }.bind(this));

        if (root.childNodes.length === 0) {
            var namespaces = this.parser.getNamespaces();

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

            var evs = this.parser.possibleAt(root, 0).toArray();
            if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
                transformation.insertElement(
                    this, root, 0, 
                    this.resolver.unresolveName(evs[0].params[1], 
                                                evs[0].params[2]), 
                    attrs); 
            }
                
            ///else
                /// XXX log an error somewhere
        }
        
        $root.on('keydown', util.eventHandler(this._keyHandler.bind(this)));
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

        this.parser.start();
    };

    this._fireTransformation = function (e) {
        this.dismissContextMenu();
        var tr = e.data.tr;
        if (this._raw_caret === undefined)
            throw new Error("transformation applied with undefined caret.");
        tr.handler(this, e.data.node, e.data.element_name);
    };

    this._contextMenuHandler = function (e, jQthis) {
        var selection = rangy.getSelection();
        var original_range = domutil.getSelectionRange();
        var range = original_range.cloneRange();
        var start_is_focus = ((selection.focusNode === range.startContainer) && (selection.focusOffset === range.startOffset));
        range.collapse(start_is_focus);

        var $node_of_interest = $((range.startContainer.nodeType === Node.ELEMENT_NODE) ? range.startContainer : range.startContainer.parentNode);

        var menu_items = [];
        if (!$node_of_interest.hasClass("_phantom") && 
            // Should not be part of a gui element.
            $node_of_interest.parent("._gui").length === 0) {
            // We want to wrap if we have an actual rage
            var wrap = !original_range.collapsed;
            this.parser.possibleAt(
                range.startContainer, 
                range.startOffset).forEach(function (ev) {
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
                        var $a = $("<a tabindex='-1' href='#'>" + 
                                   tr.getDescriptionFor(unresolved) + 
                                   "</a>");
                        $a.click({'tr': tr, 
                                  'element_name': unresolved }, 
                                 this._fireTransformation.bind(this));
                        menu_items.push(
                            $("<li></li>").append($a).get(0));
                    }
                }.bind(this));
            var orig = getOriginalName($node_of_interest.get(0));
            var trs = this.tr.getTagTransformations("delete", orig);
            if (trs !== undefined) {
                trs.forEach(function (tr) {
                    var $a = $("<a tabindex='-1' href='#'>" + tr.getDescriptionFor(orig) + "</a>");
                    $a.click({'tr': tr, 'element_name': orig }, 
                             this._fireTransformation.bind(this));
                    menu_items.push($("<li>").append($a).get(0));
                }.bind(this));
            }

            var items = this.mode.getContextualMenuItems();
            items.forEach(function (item) {
                var $a = $("<a tabindex='-1' href='#'>"+ item[0] + "</a>");
                $a.click(item[1]);
                menu_items.push($("<li>").append($a).get(0));
            });
        }

        var $sep = $node_of_interest.parents().addBack().siblings("[data-wed--separator-for]").first();
        var node_of_interest = $node_of_interest.get(0);
        var $transformation_node = $sep.siblings().filter(function (ix) {
            return (this === node_of_interest) || $(this).has(node_of_interest).length > 0;
        });
        var sep_for = $sep.attr("data-wed--separator-for");
        if (sep_for !== undefined) {
            var trs = this.tr.getTagTransformations(["merge-with-next", "merge-with-previous", "append", "prepend"], sep_for);
            trs.forEach(function (tr) {
                var $a = $("<a tabindex='-1' href='#'>" + tr.getDescriptionFor(sep_for) + "</a>");
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
        var pos = rangeToPixelPosition();

        this.displayContextMenu(pos.left, pos.top, menu_items);
        return false;
    };

    this._keyHandler = function (e, jQthis) {
        // Cursor movement keys: pass them.
        if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */)
            return;
        
        // Ctrl-/
        if (e.ctrlKey && e.which === 191)
            return this._contextMenuHandler.call(this, e, jQthis);

        var range = domutil.getSelectionRange();

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

        var $placeholders = $(range.startContainer).parents('._placeholder');
        if ($placeholders.length > 0) {
            // Swallow these events when they appen in a placeholder.
            if (util.anySpecialKeyHeld(e) ||
                e.which === 8 ||
                // This is DEL. e.which === 46 when a period is 
                // entered, so check the charCode too.
                e.which === 46 && e.charCode === 0)
                return false;

            // Do this only if there are no special keys held and the
            // user is not emptying the element.
            $placeholders.remove();
        }
        
        // Prevent deleting phantom stuff
        if (e.which === 46 && 
            e.charCode === 0 && 
            $(domutil.nodeAtNextCaretPosition(this._raw_caret))
            .is("._phantom, ._phantom_wrap"))
            return false;
        
        if (e.which === 8 && 
            e.charCode === 0  && 
            $(domutil.nodeAtPrevCaretPosition(this._raw_caret))
            .is("._phantom, ._phantom_wrap"))
            return false;

        if ($(range.startContainer).hasClass('_phantom') ||
            $(range.startContainer).hasClass('_phantom_wrap')) {
            return false;
        }
    };

    this._mouseHandler = function (e) {
        if (e.type === "click") {
            this.dismissContextMenu();
            return false;
        }
    };

    this._menuHandler = function (e, jQthis) {
        if (e.type === "menuselect" ||
            (e.type === "keydown" && e.which === 27)) {
            this.dismissContextMenu();
            return false;
        }
    };
        
    this._menuItemHandler = function (e, jQthis) {
        jQthis = $(jQthis);

        switch(e.keyCode) {
        case 27: // ESC
            return true; // Let it be handled outside
        case 13: // Enter
        case 32: // Space
            jQthis.click();
            jQthis.closest('.dropdown').removeClass('open');
            break;
        case 38: // Up
            jQthis.parent('li').prev().find('a').focus();
            break;
        case 40: // Down
            jQthis.parent('li').next().find('a').focus();
            break;
        }
        return false;
    };

    /**
     * 
     * This method returns the current position of the caret. However,
     * in sanitizes its return value to avoid providing positions
     * where inserting new elements or text is not allowed. One prime
     * example of this would be inside of a _placeholder.
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
        var ph = $(this._raw_caret[0]).closest("._placeholder").get(0);
        // We are in a placeholder, make the caret be
        // the parent of the placeholder.
        if (ph !== undefined) {
            var parent = ph.parentNode;
            return [parent,
                    Array.prototype.indexOf.call(parent.childNodes, 
                                                 ph)];
        }

        return this._raw_caret;
    };

    this._caretChangeEmitter = function (ev) {

        // XXX do we want to have this test???
        // // A right mouse button click does not move the caret.
        // if (ev.which === 3) 
        //     return false;

        var selection = rangy.getSelection();
        var focus_node = selection.focusNode;
        if (focus_node === undefined || focus_node === null)
            return;
        if (this._raw_caret === undefined || 
            this._raw_caret[0] !== focus_node ||
            this._raw_caret[1] !== selection.focusOffset) {
            this._raw_caret = [focus_node, selection.focusOffset];
            var ev_node = (focus_node.nodeType === Node.ELEMENT_NODE)? 
                focus_node: focus_node.parentNode;
            
            $(ev_node).trigger("caretchange", [this._raw_caret]);
        }
    };

    this._caretChangeHandler = function (e, caret) {
        $(this.root).find("._owns_caret").removeClass("_owns_caret");
        var node = (caret[0].nodeType === Node.ELEMENT_NODE)? 
            caret[0]: caret[0].parentNode;
        $(node).addClass("_owns_caret");
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
        var $menu = $("<ul class='dropdown-menu' role='menu'>");
        $dropdown.append($menu);
        $menu.css("overflow-y", "auto");
        $dropdown.css("top", y);
        $dropdown.css("left", x);
        $dropdown.css("max-height", window.innerHeight - 
                      (y - $(window).scrollTop()));

        $menu.append($(items));

        $(this.menu_layer).prepend($dropdown);
        $menu.dropdown('toggle');
        $menu.on('keydown', util.eventHandler(this._menuHandler.bind(this)));
        $menu.find('a').on(
            'keydown', 
            util.eventHandler(this._menuItemHandler.bind(this)));
        this.pushSelection();
        $menu.find('a').first().focus();
    };

    this.pushSelection = function () {
        this.selection_stack.push(domutil.getSelectionRange());
    };

    this.popSelection = function () {
        rangy.getSelection().setSingleRange(this.selection_stack.pop());
        // Call it with a minimal object
        this._caretChangeEmitter({'which': undefined});
    };

    var state_to_str = {};
    state_to_str[parser.INCOMPLETE] = "stopped";
    state_to_str[parser.WORKING] = "working";
    state_to_str[parser.INVALID] = "invalid";
    state_to_str[parser.VALID] = "valid";

    var state_to_progress_type = {};
    state_to_progress_type[parser.INCOMPLETE] = "info";
    state_to_progress_type[parser.WORKING] = "info";
    state_to_progress_type[parser.INVALID] = "danger";
    state_to_progress_type[parser.VALID] = "success";
    

    this._onParserStateChange = function () {
        var working_state = this.parser.getWorkingState();
        var message = state_to_str[working_state.state];

        var percent = (working_state.part_done * 100) >> 0;
        if (working_state.state === parser.WORKING) {
            // Do not show changes less than 5%
            if (working_state.part_done - this._last_done_shown < 0.05)
                return;
        }
            
        this._last_done_shown = working_state.part_done;
        this.$parsing_progress.css("width", percent + "%");
        var $parent = this.$parsing_progress.parent();
        $parent.removeClass("progress-info progress-success progress-danger");
        var type = state_to_progress_type[working_state.state];
        $parent.addClass("progress-" + type);
        this.$parsing_message.removeClass("label-info label-success label-danger");

        this.$parsing_message.text(message);
    };

    this._onParserError = function (ev) {
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

}).call(Editor.prototype);

//
// This function changes the DOM tree temporarily. There does not seem
// to be a reliable portable way to get the position of a range
// otherwise.
// 
// THIS MESSES UP THE RANGE! That is, the value of range after is
// going to be different from before.
//

function rangeToPixelPosition() {
    var saved = rangy.saveSelection();

    // We must grab the range after rangy.saveSelection() has been
    // called because rangy.saveSelection() modifies the DOM and thus
    // makes any selection recorded earlier invalid.
    var selection = rangy.getSelection();
    var range = domutil.getSelectionRange().cloneRange();
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
    //
    // This is imperfect but the goal here is to do as much work as
    // possible, even if things have not been initialized fully.
    //
    // The last recorded exception will be rethrown at the end.
    //

    var editor = e.data.editor;
    var recorded;
    try {
        if (editor.domlistener !== undefined) 
            $(editor.domlistener.stopListening()); 
    } catch(ex) { recorded = ex; }

    // These ought to prevent jQuery leaks.
    try { 
        $(editor.root).off();
        $(editor.root).removeData();
        $(editor.root).empty();
        $('*').off('.wed'); 
        $(window).off('.wed'); // This will also remove this handler
    } catch (ex) { recorded = ex; }
    
    if (recorded !== undefined)
        throw recorded;
}

});
