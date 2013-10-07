/**
 * @module input_trigger
 * @desc Module implementing the basic functionality for input triggers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:input_trigger */ function (require, exports, module) {
'use strict';

var util = require("./util");
var jqutil = require("./jqutil");
var $ = require("jquery");
var HashMap = require("salve/hashstructs").HashMap;
var key_constants = require("./key_constants");

function hashHelper(o) {
    return o.hash();
}

/**
 * <p>An InputTrigger listens to keyboard events and to DOM changes that
 * insert text into an element. The object has to listen to both types
 * of events because:</p>
 *
 * <ul>
 *
 *   <li>Listening only to keyboard events would miss modifications to
 *       the DOM tree that happen programmatically.</li>
 *
 *   <li>Listening only to DOM changes would not trap keyboard events
 *       that do not <strong>inherently</strong> modify the DOM tree
 *       like a backspace key hit at the start of an element.</li>
 *
 * </ul>
 *
 * <p>The portion of InputTrigger objects that handle keyboard events
 * attaches itself to the editor to which the InputTrigger belongs in
 * such a way that allows for suppressing the generic handling of such
 * events. See {@link module:input_trigger~InputTrigger#addKeyHandler
 * addKeyHandler} for more information.<p>
 *
 * @class
 * @param {module:wed~Editor} editor The editor to which this
 * InputTrigger will belongs.
 * @param selector This can be anything jQuery accepts to select an
 * object from the DOM tree. The object created by this constructor
 * will listen to events that pertain only to DOM nodes matching this
 * selector.
 */
function InputTrigger(editor, selector) {
    this._editor = editor;
    this._selector = selector;

    // This is a map of all keys to their handlers.
    this._key_to_handler = new HashMap(hashHelper);

    // This is a map of keys that are actually text keys to their
    // handlers. This map is in effect a submap of _key_to_handler. We
    // want this for speed, because otherwise each text change event
    // would require that the InputTrigger filter out all those keys
    // that we don't care about. The keys that are "text input" keys
    // are those that actually modify DOM text. So things like cursor
    // movement keys or ENTER, BACKSPACE, or control keys do not appear
    // *in* text and so are excluded from this map.
    this._text_input_key_to_handler = new HashMap(hashHelper);

    editor.$gui_root.on("wed-post-paste", this._pasteHandler.bind(this));

    // Implementation note: getting keydown events to get fired on
    // random HTML elements is finicky. For one thing, the element
    // needs to be focusable, which is false for most elements unless
    // tabindex is set. Even with tabindex set, browsers don't seem to
    // consistently emit the events on the elements we want. An
    // initial implementation attempted to set the keydown handler
    // with $root.on("keydown", this._selector, ...) but this was not
    // reliable. So we listen to all keydown events on $root and in
    // the handler we filter out what we don't care about. More
    // expensive but works reliably.

    editor.$gui_root.on("wed-input-trigger-keydown",
                        this._keydownHandler.bind(this));
    editor.$gui_root.on("wed-input-trigger-keypress",
                        this._keypressHandler.bind(this));

}

/**
 * <p>Adds a key handler to the object. The handler will be called
 * as:</p>
 *
 * <pre>handler(type, $element, [event])</pre>
 *
 * <p>Where <code>type</code> determines the type of event being
 * processed. It will be <code>"keydown"</code> for keydown events,
 * <code>"keypress"</code> for keypress events, <code>"paste"</code>
 * for paste events. The parameter <code>$element</code> is a jQuery
 * object wrapping the DOM element in the <strong>data tree</strong>
 * that was modified or had the caret when the keydown event
 * happened. The parameter <code>event</code> is the jQuery event in
 * question.</p>
 *
 * <p>Remember that <code>$element</code> always points into the data
 * tree and not the GUI tree.</p>
 *
 * <p>The handler is called once per event. This means for instance
 * that if a paste event introduces the text "a;b;c" and we are
 * listening for ";", the handler will be called once, even though two
 * ";" are added. It is up to the handler to detect that ";" has been
 * added more than once.</p>
 *
 * <p>Handlers who wish to stop further processing or prevent the
 * browser's default processing of an event must call the appropriate
 * method on the <code>event</code> object.</p>
 *
 * <p>Although it is possible to add multiple handlers for the same
 * key to the same <code>InputTrigger</code> object, the
 * <code>InputTrigger</code> class does not define how one handler
 * could prevent another handler from executing. Calling the methods
 * on the <code>event</code> object does not in any way affect how a
 * <code>InputTrigger</code> calls its handlers. However, as stated
 * above, these methods can prevent further propagation of the
 * JavaScript event. Consequently, if more than one handler should
 * handle the same key on the same <code>InputTrigger</code> object,
 * these handlers should either deal with orthogonal concerns
 * (e.g. one modifies the data DOM tree and the other does logging),
 * or provide their own mechanism to determine whether one can prevent
 * the other from executing.</p>
 *
 * @param {module:key~Key} key The key we are interested in.
 * @param {Function} handler The handler that will process events
 * related to that key.
 */
InputTrigger.prototype.addKeyHandler = function (key, handler) {
    var handlers = this._key_to_handler.has(key);
    if (!handlers) {
        handlers = [];
        this._key_to_handler.add(key, handlers);
    }

    handlers.push(handler);

    // We could get here due to keys that are actually not text
    // (e.g. ENTER, BACKSPACE).
    if (key.anyModifier() || !key.keypress)
        return;

    // We share the handlers array between the two maps.
    if (!this._text_input_key_to_handler.has(key))
        this._text_input_key_to_handler.add(key, handlers);

};

InputTrigger.prototype._keydownHandler = function (wed_event, e) {
    var caret = this._editor.getCaret();

    var $node_of_interest = $(caret[0]).closest(this._selector);

    if ($node_of_interest.length > 0) {
        $node_of_interest =
            $(this._editor.toDataNode($node_of_interest.get(0)));
        this._key_to_handler.forEach(function (key, handlers) {
            if (key.matchesEvent(e)) {
                for(var i = 0; i < handlers.length; ++i)
                    handlers[i]("keydown", $node_of_interest, e);
            }
        });
    }
};

InputTrigger.prototype._keypressHandler = function (wed_event, e) {
    var caret = this._editor.getCaret();

    var $node_of_interest = $(caret[0]).closest(this._selector);

    if ($node_of_interest.length > 0) {
        $node_of_interest =
            $(this._editor.toDataNode($node_of_interest.get(0)));
        this._key_to_handler.forEach(function (key, handlers) {
            if (key.matchesEvent(e)) {
                for(var i = 0; i < handlers.length; ++i)
                    handlers[i]("keypress", $node_of_interest, e);
            }
        });
    }
};

InputTrigger.prototype._pasteHandler = function (wed_event, e, caret,
                                                 $data) {
    if (this._editor.undoingOrRedoing())
        return;

    var text = $data.contents().filter(jqutil.textFilter).toArray();
    if (text.length === 0)
        return;

    this._text_input_key_to_handler.forEach(function (key, handlers) {
        if (key.anyModifier())
            return; // We care only about text input

        var ch = String.fromCharCode(key.which);

        var $node_of_interest = (caret[0].nodeType === Node.TEXT_NODE) ?
            $(caret[0].parentNode) : $(caret[0]);
        for (var i = 0, node; (node = text[i]) !== undefined; i++) {
            if (node.parentNode && // Skip those who
                                   // are not in the tree anymore.
                node.nodeValue.indexOf(ch) > -1) {
                for (var j = 0; j < handlers.length; ++j)
                    handlers[j]("paste", $node_of_interest, e);
            }
        }
    });
};

exports.InputTrigger = InputTrigger;

});

//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown
// LocalWords:  setTextNodeValue
