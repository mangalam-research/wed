

/**
 * @module updater_domlistener
 * @desc Facility to listen to changes to a DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:updater_domlistener */
function (require, exports, module) {
'use strict';

var oop = require("./oop");
var domlistener = require("./domlistener");
var $ = require("jquery");
require("./jquery.findandself");

/**
 * @classdesc A DOM listener based on tree_updater.
 * @extends module:domlistener~Listener
 *
 * @constructor
 * @param {Node} root The root of the DOM tree about which the
 * listener should listen to changes.
 * @param {module:tree_updater~TreeUpdater} updater The tree updater
 * through which the <code>root</code> is updated.
 */
function Listener(root, updater) {
    domlistener.Listener.call(this, root);
    this._updater = updater;
    this._stopped = true;
    this._scheduled_process_triggers = 0;

    this._updater.addEventListener(
        "insertNodeAt", this._insertNodeAtHandler.bind(this));
    this._updater.addEventListener(
        "setTextNodeValue", this._setTextNodeValueHandler.bind(this));
    this._updater.addEventListener(
        "deleteNode", this._deleteNodeHandler.bind(this));
}

oop.inherit(Listener, domlistener.Listener);

Listener.prototype.startListening = function() {
    this._stopped = false;
};

Listener.prototype.stopListening = function () {
    this._stopped = true;
};

Listener.prototype.processImmediately = function () {
    // It is a noop for this implementation.
};

/**
 * TBA
 * @private
 *
 * @param {TBA} ev TBA
 */
Listener.prototype._insertNodeAtHandler = function (ev) {
    if (this._stopped)
        return;

    var $parent = $(ev.parent);
    var $node = $(ev.node);
    var cc_calls = this._childrenChangedCalls(
        $parent, $node, $(), $node.prev(), $node.next());

    var ar_calls = [];
    var ie_calls = [];
    if (ev.node.nodeType === Node.ELEMENT_NODE) {
        ar_calls = this._addRemCalls("added-element", $node, $parent);
        ie_calls = this._incExcCalls("included-element", $node, $parent);
    }

    var to_call = cc_calls.concat(ar_calls, ie_calls);
    for(var i = 0, call; (call = to_call[i]) !== undefined; ++i)
        this._callHandler.apply(this, call);

    this._scheduleProcessTriggers();
};

/**
 * TBA
 * @private
 *
 * @param {TBA} ev TBA
 */
Listener.prototype._deleteNodeHandler = function (ev) {
    if (this._stopped)
        return;

    var $node = $(ev.node);
    var $parent = $node.parent();
    var cc_calls = this._childrenChangedCalls(
        $parent, $(), $node, $node.prev(), $node.next());

    var ar_calls = [];
    var ie_calls = [];
    if (ev.node.nodeType === Node.ELEMENT_NODE) {
        ar_calls = this._addRemCalls("removed-element", $node, $parent);
        ie_calls = this._incExcCalls("excluded-element", $node, $parent);
    }

    var to_call = cc_calls.concat(ar_calls, ie_calls);
    for(var i = 0, call; (call = to_call[i]) !== undefined; ++i)
        this._callHandler.apply(this, call);

    this._scheduleProcessTriggers();
};

/**
 * TBA
 * @private
 *
 * @param {TBA} $parent TBA
 * @param {TBA} $added TBA
 * @param {TBA} $removed TBA
 */
Listener.prototype._childrenChangedCalls = function ($parent, $added, $removed,
                                                     $prev, $next) {
    var pairs = this._event_handlers["children-changed"];
    var ret = [];
    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        if ($parent.is(sel))
            ret.push([pair[1], $added, $removed, $prev, $next, $parent]);
    }

    return ret;
};

/**
 * TBA
 * @private
 *
 * @param {TBA} ev TBA
 */
Listener.prototype._setTextNodeValueHandler = function (ev) {
    if (this._stopped)
        return;

    var pairs = this._event_handlers["text-changed"];
    var $target = $(ev.node);

    // Go over all the elements for which we have
    // handlers
    var $parent = $target.parent();
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        if ($parent.is(sel))
            this._callHandler(pair[1], $target, ev.old_value);
    }

    this._scheduleProcessTriggers();
};

/**
 * TBA
 * @private
 */
Listener.prototype._scheduleProcessTriggers = function () {
    if (this._scheduled_process_triggers)
        return;
    this._scheduled_process_triggers = window.setTimeout(function () {
        this._scheduled_process_triggers = undefined;
        this._processTriggers();
    }.bind(this), 0);
};

/**
 * TBA
 * @private
 *
 * @param {TBA} name TBA
 * @param {TBA} $node TBA
 * @param {TBA} $target TBA
 *
 * @returns {TBA} TBA
 */
Listener.prototype._addRemCalls = function (name, $node, $target) {
    var pairs = this._event_handlers[name];
    var $prev = $node.prev();
    var $next = $node.next();
    var ret = [];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        if ($node.is(sel))
            ret.push([pair[1], $target, $prev, $next, $node]);
    }

    return ret;
};

/**
 * TBA
 * @private
 *
 * @param {TBA} name TBA
 * @param {TBA} $node TBA
 * @param {TBA} $target TBA
 *
 * @returns {TBA} TBA
 */
Listener.prototype._incExcCalls = function (name, $node, $target) {
    var pairs = this._event_handlers[name];
    var $prev = $node.prev();
    var $next = $node.next();
    var ret = [];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        var $targets = $node.findAndSelf(sel);
        for(var target_ix = 0, target_ix_limit = $targets.length;
            target_ix < target_ix_limit; ++target_ix)
            ret.push([pair[1], $node, $target, $prev, $next,
                      $($targets.get(target_ix))]);
    }
    return ret;
};

exports.Listener = Listener;

});



//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable boolean

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
// LocalWords:  startOffset endContainer endOffset mousedown keyup
// LocalWords:  setTextNodeValue popup appender unhandled rethrown
// LocalWords:  Django overriden subarrays stylesheets RequireJS noop
// LocalWords:  characterData childList refman prepend concat
