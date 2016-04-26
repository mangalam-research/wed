/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function (require, exports, module) {
'use strict';

var $ = require("jquery");
var log = require("./log");
var domutil = require("./domutil");
var isAttr = domutil.isAttr;
var oop = require("./oop");
var wundo = require("./wundo");
var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var Conditioned = require("./lib/conditioned").Conditioned;
var exceptions = require("./exceptions");
var onerror = require("./onerror");
var key = require("./key");
var AbortTransformationException = exceptions.AbortTransformationException;
require("bootstrap");
require("jquery.bootstrap-growl");
var closestByClass = domutil.closestByClass;

exports.version = "0.26.2";
var version = exports.version;

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
    this._dismissDropdownMenu();
    var current_group = this._undo.getGroup();
    if (current_group instanceof wundo.TextUndoGroup)
            this._undo.endGroup();

    var new_group =
            new wundo.UndoGroup(
                "Undo " + tr.getDescriptionFor(transformation_data), this);
    this._undo.startGroup(new_group);
    this._inhibitFakeCaret();
    try {
        try {
            // We've separated the core of the work into a another
            // method so that it can be optimized.
            this._fireTransformation(tr, transformation_data);
        }
        catch(ex) {
            // We want to log it before we attempt to do anything else.
            if (!(ex instanceof AbortTransformationException))
                log.handle(ex);
            throw ex;
        }
        finally {
            // It is possible for a transformation to create new
            // subgroups without going through fireTransformation. So
            // we terminate all groups until the last one we
            // terminated is the one we created.
            do {
                current_group = this._undo.getGroup();
                this._undo.endGroup();
            } while (current_group !== new_group);
        }
    }
    catch(ex) {
        this.undo();
        if (!(ex instanceof AbortTransformationException))
            throw ex;
    }
    finally {
        this._uninhibitFakeCaret();
        this._refreshValidationErrors();
    }
};

Editor.prototype._fireTransformation = function(tr, transformation_data) {
    var node = transformation_data.node;
    if (node !== undefined) {
        // Convert the gui node to a data node
        if (this.gui_root.contains(node)) {
            var path = this.nodeToPath(node);
            transformation_data.node = this.data_updater.pathToNode(path);
        }
        else {
            // A data node could be an attribute node but
            // unfortunately, ``contains`` does not work on such nodes
            // so we need to manually handle it.
            var check = isAttr(node) ? node.ownerElement : node;
            if (!this.data_root.contains(check))
                throw new Error("node is neither in the gui tree nor "+
                                "the data tree");
        }
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

Editor.prototype.undoMarker = function (msg) {
    this.recordUndo(new wundo.MarkerUndo(msg));
};

Editor.prototype.undoingOrRedoing = function () {
    return this._undo.undoingOrRedoing();
};

/**
 * Determines whether an attribute is protected. A protected attribute
 * cannot be deleted, added or edited by the user directly.
 *
 * @param {Attr|Element|string} attr The attribute to check. If it is
 * an ``Element``, then it must be an ``_attribute_value`` element
 * from the GUI tree. If it is an ``Attr`` then it must be an
 * attribute node from the data tree. If a string, then it must be the
 * attribute name as it would appear in the data tree.
 * @param {Element} [parent] This argument is optional. If ``attr`` is a
 * string, then ``parent`` must be set to the element for which the attribute
 * would apply.
 * @returns {boolean} ``true`` if the attribute is protected.
 */
Editor.prototype.isAttrProtected = function (attr, parent) {
    var name;
    if (attr instanceof this.my_window.Attr) {
        name = attr.name;
    }
    else if (attr instanceof this.my_window.Element) {
        name = domutil.siblingByClass(attr, "_attribute_name").textContent
    }
    else if (typeof attr === "string") {
        name = attr;
        if (!parent)
            throw new Error("must specify a parent");
    }
    return (name === "xmlns" || name.lastIndexOf("xmlns:", 0) === 0);
};

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
    if (current_group === undefined ||
        !(current_group instanceof wundo.TextUndoGroup)) {
        current_group = new wundo.TextUndoGroup(
            "text", this, this._undo, this._text_undo_max_length);
        this._undo.startGroup(current_group);
    }

    return current_group;
};

Editor.prototype._terminateTextUndo = function () {
    var current_group = this._undo.getGroup();
    if (current_group instanceof wundo.TextUndoGroup)
        this._undo.endGroup();
};

Editor.prototype._normalizeEnteredText = function (text) {
    if (!this._normalize_entered_spaces)
        return text;

    return text.replace(this._stripped_spaces, "")
        .replace(this._replaced_spaces, " ");
};

Editor.prototype._compensateForAdjacentSpaces = function (text, caret) {
    if (!this._normalize_entered_spaces)
        return text;

    var ar_caret = caret.toArray();
    // If there is previous text and the previous text
    // is a space, then we need to prevent a double
    // space.
    if (text[0] === " " &&
        domutil.getCharacterImmediatelyBefore(ar_caret) === " ")
        text = text.slice(1);

    // Same with the text that comes after.
    if (text && text[text.length - 1] === " " &&
        domutil.getCharacterImmediatelyAt(ar_caret) === " ")
        text = text.slice(-1);

    return text;
};

Editor.prototype._insertText = function (text) {
    // We remove zero-width spaces.
    this._closeAllTooltips();

    text = this._normalizeEnteredText(text);

    if (text === "")
        return;

    var caret = this._sel_focus;

    if (caret === undefined)
        return;

    var el = closestByClass(caret.node, "_real", this.gui_root);
    // We do not operate on elements that are readonly.
    if (!el || el.classList.contains("_readonly"))
        return;

    var attr_val = closestByClass(caret.node, "_attribute_value",
                                   this.gui_root);
    if (!attr_val) {
        caret = this.getDataCaret();
        text = this._compensateForAdjacentSpaces(text, caret);
        if (text === "")
            return;

        var text_undo = this._initiateTextUndo();
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
                final_offset = modified_node.nodeValue.length;
            this.setDataCaret(modified_node, final_offset, true);
        }
        text_undo.recordCaretAfter();
    }
    else
        // Modifying an attribute...
        this._spliceAttribute(attr_val, caret.offset, 0, text);
    this._refreshValidationErrors();
};

Editor.prototype._spliceAttribute = function (attr_val, offset, count, add) {
    if (offset < 0)
        return;

    // We ignore changes to protected attributes.
    if (this.isAttrProtected(attr_val))
        return;

    var val = this.toDataNode(attr_val).value;
    if (offset > val.length)
        return;

    if (offset === val.length && count > 0)
        return;

    if (this._normalize_entered_spaces) {
        if (add[0] === " " && val[offset - 1] === " ")
            add = add.slice(1);

        if (add[add.length - 1] === " " && val[offset + count] === " ")
            add = add.slice(-1);
    }

    var text_undo = this._initiateTextUndo();
    val = val.slice(0, offset) + add + val.slice(offset + count);
    offset += add.length;
    var data_real = $.data(closestByClass(attr_val, "_real"),
                           "wed_mirror_node");
    var gui_path = this.nodeToPath(attr_val);
    var name = domutil.siblingByClass(attr_val, "_attribute_name").textContent;
    var resolved = this.resolver.resolveName(name, true);
    this.data_updater.setAttributeNS(data_real, resolved.ns, resolved.name,
                                     val);
    // Redecoration of the attribute's element may have destroyed our
    // old attr_val node. Refetch. And after redecoration, the
    // attribute value element may not have a child.
    var move_to = this.pathToNode(gui_path);
    if (move_to.firstChild)
        move_to = move_to.firstChild;
    this._setGUICaret(move_to, offset, "text_edit");
    text_undo.recordCaretAfter();
};

/**
 * @param {module:dloc~DLoc} loc Location where to insert.
 * @returns {Node} The placeholder.
 */
Editor.prototype.insertTransientPlaceholderAt = function (loc) {
    var ph = $("<span class='_placeholder _transient' " +
               "contenteditable='false'> </span>", loc.node.ownerDocument)[0];
    this._gui_updater.insertNodeAt(loc, ph);
    return ph;
};

Editor.prototype.toDataNode = function (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        var ret = $.data(node, "wed_mirror_node");
        // We can bypass the whole pathToNode, nodeToPath thing.
        if (ret)
            return ret;
    }

    return this.data_updater.pathToNode(this.nodeToPath(node));
};

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

Editor.prototype.nodeToPath = function (node) {
    return this.gui_dloc_root.nodeToPath(node);
};

Editor.prototype.pathToNode = function (path) {
    return this.gui_dloc_root.pathToNode(path);
};

Editor.prototype.getModeData = function (key) {
    return this._mode_data[key];
};

Editor.prototype.setModeData = function (key, value) {
    this._mode_data[key] = value;
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

    if (this._process_validation_errors_timeout)
        clearTimeout(this._process_validation_errors_timeout);

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
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
