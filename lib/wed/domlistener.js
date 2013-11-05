/**
 * @module domlistener
 * @desc Abstract base class for classes that raise events when a DOM
 * tree is modified.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:domlistener */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
require("./jquery.findandself");

/**
 * @classdesc <p>An "included-element" event is fired when an element appears in
 * the observed tree whether it is directly added or added because its
 * parent was added. The opposite event is "excluded-element".</p>
 *
 * <p>An "added-element" event is fired when an element is directly
 * added to the observed tree. The opposite event is
 * "removed-element".</p>
 *
 * <p>A "trigger" event with name <code>[name]</code> is fired when
 * <code>trigger([name])</code> is called. Trigger events are
 * meant to be triggered by event handlers called by the Listener, not
 * by other code.</p>
 *
 * <h2>Example</h2>
 *
 * <p>Consider the following fragment:</p>
 *
 * <pre>
 * &lt;ul>
 *  &lt;li>foo&lt;/li>
 * &lt;/ul>
 * </pre>
 *
 * <p>If the fragment is added to a <code>&lt;div></code> element, an
 * included-element event will be generated for <code>&lt;ul></code>
 * and <code>&lt;li></code> but an added-element event will be
 * generated only for <code>&lt;ul></code>.</p>
 *
 * <p>If the fragment is removed, an excluded-element event will be
 * generated for <code>&lt;ul></code> and <code>&lt;li></code> but a
 * remove-element event will be generated only for
 * <code>&lt;ul></code>.</p>
 *
 * <p>The signature of the handlers varies by type of event:</p>
 *
 * <dl>
 *  <dt>added-element, removed-element:</dt>
 *
 *    <dd>
 *
 *      <p><code>handler($root, $parent, $previous_sibling, $next_sibling,
 *      $element)</code></p>
 *
 *      <p>There is no reason to provide <code>$parent,
 *      $previous_sibling, $next_sibling</code> for an added-element
 *      event but having the same signature for additions and removals
 *      allows to use the same function for both cases. For
 *      removed-element events the parent is the parent that the
 *      element had <strong>before</strong> it was removed. The
 *      $element parameter is a single element.</p>
 * </dd>
 *
 *  <dt>included-element, excluded-element:</dt>
 *
 *    <dd>
 *
 *      <p><code>handler($root, $tree, $parent, $previous_sibling,
 *      $next_sibling, $element)</code></p>
 *
 *      <p>These handlers are called when a <strong>tree
 *      fragment</strong> is removed or added which contains the
 *      element matched by the selector that was passed to {@link
 *      module:mutation_domlistener~Listener#addHandler addHandler()} The
 *      <code>$tree</code> parameter contains the node which is at the
 *      root of the tree fragment that was added or removed to trigger
 *      the event. Moreover, the <code>$previous_sibling,
 *      $next_sibling</code> and <code>$parent</code> parameters
 *      record the siblings and parent of <code>$tree</code>,
 *      <strong>not those of <code>$element</code></strong>.</p></dd>
 *
 *  <dt>children-changed:</dt>
 *
 *    <dd>
 *
 *      <p><code>handler($root, $added, $removed, $previous_sibling,
 *         $next_sibling, $element)</code></p>
 *
 *      <p>The parameters <code>$previous_sibling</code> and
 *      <code>$next_sibling</code> refer to the siblings that are
 *      before and after the entire group of <code>$added</code> or
 *      <code>$removed</code> nodes.</p>
 *
 * </dd>
 *
 * <dt>text-changed:</dt>
 *
 *    <dd>
 *
 *      <p><code>handler($root, $element, old_value)</code></p>
 *
 *      <p>Note that the meaning of the <code>selector</code>
 *      parameter for text-changed events is different than the
 *      usual. Whereas for all other handlers, the
 *      <code>selector</code> matches the <code>$element</code>
 *      parameter passed to the handler, in the case of a text-changed
 *      event the <code>selector</code> matches the
 *      <strong>parent</strong> of the <code>$element</code> parameter
 *      which itself is always a text node. The <code>old_value</code>
 *      parameter contains the text of the node before the value
 *      changed.</p>
 *
 *      <p>Another thing to keep in mind is that a text-changed event
 *      is not generated when Node objects of type TEXT_NODE are added
 *      or removed. They trigger children-changed events.</p>
 *
 *    </dd>
 *
 * <dt>trigger:</dt>
 *    <dd><p><code>handler($root)</code></p></dd>
 * </dl>
 *
 * <p>The order in which handlers are added matters. The Listener
 * provides the following guarantee: for any given type of event, the
 * handlers will be called in the order that they were added to the
 * listener.</p>
 *
 * <h2>Warnings:</h2>
 *
 * <ul>
 *
 * <li>There are two implementations of this class:
 *     mutation_domlistener and updater_domlistener. The first uses
 *     the MutationObserver interface to detect changes and is thus
 *     asynchronous, the second requires that all modifications to the
 *     DOM tree be made through a tree_updater and is
 *     synchronous. This means that although the interface used by
 *     both implementations is the same some details might be
 *     different. For instance, a listener based on
 *     updater_domlistener will learn of node removals
 *     <strong>before</strong> the node is removed while a listener
 *     based on mutation_domlistener will learn of it
 *     <strong>after</strong> it has been removed.</li>
 *
 * <li>
 *
 *   <p>A Listener does not verify whether the parameters passed to
 *      handlers are part of the DOM tree. For instance, handler A
 *      could operate on element X so that it is removed from the DOM
 *      tree. If there is already another mutation on X in the
 *      pipeline by the time A is called and handler B is called to
 *      deal with it, then by the time B is run X will no longer be
 *      part of the tree.<p>
 *
 *    <p>To put it differently, even if when a mutation record is
 *       generated element X was part of the DOM tree, it is possible
 *       that by the time the handlers that must be run for that
 *       mutation are run, X is no longer part of the DOM tree.</p>
 *
 *    <p>Handlers that care about whether they are operating on
 *       elements that are in the DOM tree should perform a test
 *       themselves to check whether what is passed to them is still
 *       in the tree.</p>
 *
 *    <p>The handlers fired on removed-elements events work on nodes
 *       that have been removed from the DOM tree. To know what was
 *       before and after these nodes <strong>before</strong> they
 *       were removed use <code>$previous_sibling</code> and
 *       <code>$next_sibling</code>, because it is likely that the
 *       nodes themselves will have both their
 *       <code>previousSibling</code> and <code>nextSibling</code> set
 *       to <code>null</code>.</p>
 *
 *  </li>
 *
 *  <li>Handlers that are fired on children-changed events,
 *      <strong>and</strong> which modify the DOM tree can easily
 *      result in infinite loops. Care should be taken early in any
 *      such handler to verify that the kind of elements added or
 *      removed <strong>should</strong> result in a change to the DOM
 *      tree, and ignore those changes that are not relevant.</li>
 *
 * </ul>
 *
 *
 * @constructor
 *
 * @param {Node} root The root of the DOM tree about which the
 * listener should listen to changes.
 */

function Listener(root) {
    this._$root = $(root);

    this._event_handlers = {
        "included-element": [],
        "excluded-element": [],
        "added-element": [],
        "removed-element": [],
        "children-changed": [],
        "text-changed": []
    };

    this._trigger_handlers = {};

    this._triggers_to_fire = {};
}

/**
 * Start listening to changes on the root passed when the object was
 * constructed.
 * @method
 */
Listener.prototype.startListening = mustOverride;

function mustOverride() {
    throw new Error("derived classes must override this method");
}

/**
 * Adds an event handler.
 *
 * @param {String|Array.<String>} event_types Either a string naming
 * the event this handler will process or an array of strings if
 * multiple types of events are to be handled.
 * @param selector Can be anything that jQuery accepts as a selector.
 * @param {Function} handler The handler to be called by this listener
 * when the events specified in <code>event_types</code> occur.
 * @throws {Error} If an event is unrecognized.
 */
Listener.prototype.addHandler = function (event_types, selector, handler) {
    if (!(event_types instanceof Array))
        event_types = [event_types];

    for(var ev_ix = 0, event_type; (event_type = event_types[ev_ix]) !==
        undefined; ev_ix++) {
        if (event_type !== "trigger") {
            var pairs = this._event_handlers[event_type];
            if (pairs === undefined)
                throw new Error("invalid event_type: " + event_type);

            pairs.push([selector, handler]);
        }
        else {
            var handlers = this._trigger_handlers[selector];
            if (handlers === undefined)
                handlers = this._trigger_handlers[selector] = [];

            handlers.push(handler);
        }
    }
};

/**
 * Stops listening to DOM changes.
 * @method
 */
Listener.prototype.stopListening = mustOverride;

/**
 * Process all changes immediately.
 * @method
 */
Listener.prototype.processImmediately = mustOverride;

/**
 * Tells the listener to fire the named trigger as soon as possible.
 *
 * @param {String} name The name of the trigger to fire.
 */
Listener.prototype.trigger = function(name) {
    this._triggers_to_fire[name] = 1;
};

/**
 * Processes pending triggers.
 *
 * @private
 */
Listener.prototype._processTriggers = function () {
    var keys = Object.keys(this._triggers_to_fire);
    while(keys.length > 0) {
        // We flush the map because the triggers could trigger
        // more triggers. This also explains why we are in a loop.
        this._triggers_to_fire = {};

        var trigger_map = this._trigger_handlers;
        for (var key_ix = 0, key; (key = keys[key_ix]) !== undefined;
             ++key_ix) {
            var handlers = trigger_map[key];
            if (handlers !== undefined) {
                for(var handler_ix = 0, handler;
                    (handler = handlers[handler_ix]) !== undefined;
                    ++handler_ix)
                    this._callHandler(handler);
            }
        }

        // See whether there is more to trigger.
        keys = Object.keys(this._triggers_to_fire);
    }
};

/**
 * Utility function for calling event handlers.
 * @private
 *
 * @param {Function} handler The handler.
 * @param rest... The arguments to pass to the handler.
 */
Listener.prototype._callHandler = function () {
    var handler = arguments[0];
    var rest = Array.prototype.slice.call(arguments, 1);
    rest.unshift(this._$root);
    handler.apply(undefined, rest);
};

/**
 * Dumps a mutation to the console.
 *
 * @private
 * @param mut A DOM mutation object.
 */
// Useful for debugging
Listener.prototype._dumpMutation = function (mut) {
    console.log(mut.type + ":", mut.target, mut.addedNodes, mut.removedNodes,
                mut.previousSibling, mut.nextSibling, mut.attributeName,
                mut.attributeNamespace, mut.oldValue);
};

exports.Listener = Listener;

});

//  LocalWords:  DOM Mangalam MPL Dubeau jQuery previousSibling li ul
//  LocalWords:  MutationObserver nextSibling lt findandself jquery
//  LocalWords:  domlistener
