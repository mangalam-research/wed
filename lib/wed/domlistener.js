/**
 * @module domlistener
 * @desc Facility to listen to changes to a DOM tree.
 * @author Louis-Dominique Dubeau
 */

define(/** @lends module:domlistener */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
require("./jquery.findandself");

// Location depends on platform. :-/
var MutationObserver = window.MutationObserver ||
        window.WebKitMutationObserver;

/**
 * <p>An "included-element" event is fired when an element appears in
 * the observed tree whether it is directly added or added because its
 * parent was added. The opposite event is "excluded-element".</p>
 *
 * <p>An "added-element" event is fired when an element is directly
 * added to the observed tree. The opposite event is
 * "removed-element".</p>
 *
 * <p>A "tigger" event with name <code>[name]</code> is fired when
 * <code>trigger([name])</code> is called. The event is fired as soon
 * as all mutations being processed by the current invocation of
 * <code>_onMutation</code> have been processed. Trigger events are
 * meant to be tiggered by event handlers called by the Listener, not
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
 * <p>If the fragment is added to a &lt;div> element, an
 * included-element event will be generated for &lt;ul> and &lt;li>
 * but an added-element event will be generated only for &lt;ul>.</p>
 *
 * <p>If the fragment is removed, an excluded-element event will be
 * generated for &lt;ul> and &lt;li> but a remove-element event will be
 * generated only for &lt;ul>.</p>
 *
 * <p>The signature of the handlers varies by type of event:</p>
 *
 * <dl>
 *  <dt>added-element, removed-element:</dt>
 *
 *    <dd>
 *
 *      <p>handler($root, $parent, $previous_sibling, $next_sibling,
 *         $element)</p>
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
 *    <dd><p>handler($root, $element)</p></dd>
 *
 *  <dt>children-changed:</dt>
 *
 *    <dd>
 *
 *      <p>handler($root, $added, $removed, $previous_sibling, $next_sibling,
 *         $element)</p>
 *
 *      <p>The parameters <code>$previous_sibling</code> and
 *      <code>$next_sibling</code> refer to the siblings that are
 *      before and afte the entire group of <code>$added</code> or
 *      <code>$removed</code> nodes.</p>
 *
 * </dd>
 *
 * <dt>text-changed:</dt>
 *
 *    <dd>
 *
 *      <p>handler($root, $element, old_value)</p>
 *
 *      <p>Note that the meaning of the <code>selector</code>
 *      parameter for text-changed events is different than the
 *      usual. Whereas for all othe handlers, the
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
 *    <dd><p>handler($root)</p></dd>
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
 * @class
 * @param {Node} root The root of the DOM tree about which the
 * listener should listen to changes.
 */

function Listener(root) {
    this._$root = $(root);
    this._observer = new MutationObserver(this._onMutation.bind(this));

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
 */
Listener.prototype.startListening = function() {
    this._observer.observe(this._$root.get(0), {
        subtree: true,
        childList: true,
        attributes: false,
        // Reminder: following option can't be true if 'attributes' false.
        attributeOldValue: false,
        characterData: true,
        // Reminder: following option can't be true if 'characterData' false.
        characterDataOldValue: true
    });
};

/**
 * Adds an event handler.
 *
 * @param {String|Array.<String>} event_types Either a string naming
 * the event this handler will process or an array of strings if
 * multiple types of events are to be handled.
 * @param selector Can be anything that jQuery accepts as a selector.
 * @param {Function} handler The handler to be called by this listener
 * when the events specified in <code>event_types</code> occur.
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
 */
Listener.prototype.stopListening = function () {
    this._observer.disconnect();
};

Listener.prototype.processImmediately = function () {
    var records = this._observer.takeRecords();
    while(records.length > 0) {
        this._onMutation(records, this._observer);
        records = this._observer.takeRecords();
    }
};

/**
 * Tells the listener to fire the named trigger as soon as possible.
 *
 * @param {String} name The name of the trigger to fire.
 */
Listener.prototype.trigger = function(name) {
    this._triggers_to_fire[name] = 1;
};

Listener.prototype._onMutation = function (mutations, observer) {
    for(var mut_ix = 0, mut_ix_limit = mutations.length;
        mut_ix < mut_ix_limit; ++mut_ix) {
        var mut = mutations[mut_ix];

        var $target = $(mut.target);

        // Hoisting is the pits
        var pair_ix, pair_ix_limit, pair, sel, pairs;

        var added_other = [];
        var removed_other = [];
        var node_ix, node;
        if (mut.type === "childList") {
            for(node_ix = 0; !!(node = mut.addedNodes[node_ix]); node_ix++)
                if (node.nodeType !== Node.TEXT_NODE)
                    added_other.push(node);

            for(node_ix = 0; !!(node = mut.removedNodes[node_ix]); node_ix++)
                if (node.nodeType !== Node.TEXT_NODE)
                    removed_other.push(node);

            this._fireAddRemHandlers("added-element", mut, added_other,
                                     $target);
            this._fireAddRemHandlers("removed-element", mut, removed_other,
                                     $target);
            this._fireIncExcHandlers("included-element", added_other);
            this._fireIncExcHandlers("excluded-element", removed_other);

            // children-changed
            pairs = this._event_handlers["children-changed"];

            // Go over all the elements for which which we have handlers
            for (pair_ix = 0, pair_ix_limit = pairs.length;
                 pair_ix < pair_ix_limit; ++pair_ix) {
                pair = pairs[pair_ix];
                sel = pair[0];

                if ($target.is(sel))
                    this._callHandler(pair[1], $(mut.addedNodes),
                                      $(mut.removedNodes),
                                      $(mut.previousSibling),
                                      $(mut.nextSibling), $target);
            }
        }
        else if (mut.type === "characterData") {
            //
            // text-changed
            //
            pairs = this._event_handlers["text-changed"];

            // Go over all the elements for which which we have
            // handlers
            var $parent = $target.parents().first();
            for (pair_ix = 0, pair_ix_limit = pairs.length;
                 pair_ix < pair_ix_limit; ++pair_ix) {
                pair = pairs[pair_ix];
                sel = pair[0];

                // Check whether any of the nodes contain an
                // element we care about.
                if ($parent.is(sel))
                        this._callHandler(pair[1], $target, mut.oldValue);
            }
        }
    }

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
                    handler(this._$root);
            }
        }

        // See whether there is more to trigger.
        keys = Object.keys(this._triggers_to_fire);
    }
};

Listener.prototype._fireAddRemHandlers = function (name, mutation, nodes,
                                                   $target) {
    var pairs = this._event_handlers[name];

    // Go over all the elements for which which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        // Check whether any of the nodes contain an element we
        // care about.
        for (var node_ix = 0, node_ix_limit = nodes.length;
             node_ix < node_ix_limit; ++node_ix) {
            // These are the elements we are interested in.
            var $node = $(nodes[node_ix]);
            if ($node.is(sel)) {
                // mutation.previousSibling and nextSibling are
                // relative to the entire set of nodes, so adjust
                // for each individual node.
                var $prev = (node_ix === 0) ? $(mutation.previousSibling):
                        $(nodes[node_ix - 1]);
                var $next = (node_ix === node_ix_limit - 1) ?
                        $(mutation.nextSibling): $(nodes[node_ix + 1]);

                this._callHandler(pair[1], $target, $prev, $next, $node);
            }
        }
    }
};

Listener.prototype._fireIncExcHandlers = function (name, nodes) {
    var pairs = this._event_handlers[name];

    // Go over all the elements for which which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        // Check whether any of the nodes contain an element we
        // care about.
        for (var node_ix = 0, node_ix_limit = nodes.length;
             node_ix < node_ix_limit; ++node_ix) {
            // These are the elements we are interested in.
            var $targets = $(nodes[node_ix]).findAndSelf(sel);

            for(var target_ix = 0, target_ix_limit = $targets.length;
                target_ix < target_ix_limit; ++target_ix)
                this._callHandler(pair[1], $($targets.get(target_ix)));
        }
    }
};

Listener.prototype._callHandler = function () {
    var handler = arguments[0];
    var rest = Array.prototype.slice.call(arguments, 1);
    rest.unshift(this._$root);
    handler.apply(undefined, rest);
};

// Useful for debugging
function _dumpMutation (mut) {
    console.log(mut.type + ":", mut.target, mut.addedNodes, mut.removedNodes,
                mut.previousSibling, mut.nextSibling, mut.attributeName,
                mut.attributeNamespace, mut.oldValue);
}

exports.Listener = Listener;

});
