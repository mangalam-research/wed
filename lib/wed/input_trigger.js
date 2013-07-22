/**
 * @module input_trigger
 * @desc Module implementing the basic functionality for input triggers.
 * @author Louis-Dominique Dubeau
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
    // movement key or ENTER, BACKSPACE, or control keys do not appear
    // *in* text and so are excluded from this map.
    this._text_input_key_to_handler = new HashMap(hashHelper);

    editor.copy_domlistener.addHandler("children-changed",
                                       selector,
                                       this._childrenChanged.bind(this));

    editor.copy_domlistener.addHandler("text-changed",
                                       selector,
                                       this._textChanged.bind(this));

    // Implementation note: getting keydown events to get fired on
    // random HTML elements is finicky. For one thing, the element
    // needs to be focusable, which is false for most elements unless
    // tabindex is set. Even with tabindex set, browers don't seem to
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

var ignored_keys = key_constants.EDITING_KEYS;

/**
 * <p>Adds a key handler to the object. The handler will be called
 * as:</p>
 *
 * <pre>handler(type, $element, [event])</pre>
 *
 * <p>Where <code>type</code> determines the type of event being
 * processed. It will be <code>"keydown"</code> for keydown events,
 * <code>"children-changed"</code> when a text node has been added to
 * the children of the element, and <code>"text-changed"</code> when a
 * text node is modified in a way that should trigger the handler. The
 * parameter <code>$element</code> is a jQuery object wrapping the DOM
 * element in the <strong>data tree</strong> that was modified or had
 * the caret when the keydown event happened. The parameter
 * <code>event</code> is the event in question. It is present only
 * when the type of event is <code>"keydown"</code>.</p>
 *
 * <p>Remember that <code>$element</code> always points into the data
 * tree and not the gui tree.</p>
 *
 * <p>For "keydown" events, the handler is called once for each time
 * that the key is hit on the keyboard. For "text-changed" and
 * "children-changed" events, the handler is called once per
 * modification of the DOM tree. This means for instance that if a
 * change introduces the text "a;b;c" and we are listening for ";",
 * the handler will be called once, even though two ";" are added.</p>
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
    if (key.anyModifier() || ignored_keys.indexOf(key) > -1)
        return;

    // We share the handlers array between the two maps.
    if (!this._text_input_key_to_handler.has(key))
        this._text_input_key_to_handler.add(key, handlers);

};

InputTrigger.prototype._keydownHandler = function (wed_event, e, jQthis) {
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

InputTrigger.prototype._keypressHandler = function (wed_event, e, jQthis) {
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

InputTrigger.prototype._childrenChanged = function ($root, $added, $removed,
                                                    $prev, $next, $el) {
    if ($added.length === 0)
        return;

    var text = $added.filter(jqutil.textFilter).toArray();
    if (text.length === 0)
        return;

    this._text_input_key_to_handler.forEach(function (key, handlers) {
        if (key.anyModifier())
            return; // We care only about text input

        var ch = String.fromCharCode(key.which);

        for (var i = 0, node; (node = text[i]) !== undefined; i++) {
            if (node.parentNode // Skip those who are not in the tree anymore.
                && node.nodeValue.indexOf(ch) > -1) {
                for (var j = 0; j < handlers.length; ++j)
                    handlers[j]("children-changed", $el);
            }
        };
    });
};

InputTrigger.prototype._textChanged = function ($root, $el, old_value) {
    this._text_input_key_to_handler.forEach(function (key, handlers) {
        var ch = String.fromCharCode(key.which);

        var old_count = old_value.split(ch).length - 1;
        var new_count = $el.get(0).nodeValue.split(ch).length - 1;
        if (new_count > old_count) {
            for(var i = 0; i < handlers.length; ++i)
                handlers[i]("text-changed", $el.parent());
        }
    });
};

exports.InputTrigger = InputTrigger;

});
