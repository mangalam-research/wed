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
 * Handles {@link module:tree_updater~TreeUpdater#event:insertNodeAt
 * insertNodeAt} events.
 *
 * @private
 * @param {module:tree_updater~TreeUpdater#event:insertNodeAt} ev The
 * event.
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
 * Handles {@link module:tree_updater~TreeUpdater#event:deleteNode
 * deleteNode} events.
 *
 * @private
 * @param {module:tree_updater~TreeUpdater#event:deleteNode} ev The
 * event.
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
 * Produces the calls for <code>children-changed</code> events.
 *
 * @private
 * @param {jQuery} $parent The parent of the children that have changed.
 * @param {jQuery} $added Added children.
 * @param {jQuery} $removed Removed children.
 * @param {jQuery} $prev Node preceding the chilren.
 * @param {jQuery} $next Node following the children.
 * @returns {Array.<Array>} An list of call signatures. Each signature
 * is a list which has a function for first element and the parameters
 * to pass to this function.
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
 * Handles {@link module:tree_updater~TreeUpdater#event:setTextNodeValue
 * setTextNodeValue} events.
 *
 * @private
 * @param {module:tree_updater~TreeUpdater#event:setTextNodeValue} ev The
 * event.
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
 * Sets a timeout to run the triggers that must be run.
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
 * Produces the calls for <code>added-element</code> and
 * <code>removed-element</code> events.
 *
 * @private
 *
 * @param {String} name The event name.
 * @param {jQuery} $node The node added or removed.
 * @param {jQuery} $target The parent of this node.
 *
 * @returns {Array.<Array>} An list of call signatures. Each signature
 * is a list which has a function for first element and the parameters
 * to pass to this function.
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
 * Produces the calls for <code>included-element</code> and
 * <code>excluded-element</code> events.
 *
 * @private
 *
 * @param {String} name The event name.
 * @param {jQuery} $node The node which was added or removed and for
 * which we must issue the events.
 * @param {jQuery} $target The parent of this node.
 *
 * @returns {Array.<Array>} An list of call signatures. Each signature
 * is a list which has a function for first element and the parameters
 * to pass to this function.
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

//  LocalWords:  concat noop setTextNodeValue DOM oop Mangalam MPL
//  LocalWords:  Dubeau findandself domlistener insertNodeAt prev
//  LocalWords:  deleteNode jquery jQuery
