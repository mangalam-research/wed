/**
 * @module domlistener
 * @desc Abstract base class for classes that raise events when a DOM
 * tree is modified.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:domlistener */ function (require, exports, module) {
'use strict';

/**
 * @classdesc This class models a listener designed to listen to
 * changes to a DOM tree and fire events on the basis of the changes
 * that it detects.
 *
 * An ``included-element`` event is fired when an element appears in
 * the observed tree whether it is directly added or added because its
 * parent was added. The opposite events are ``excluding-element`` and
 * ``excluded-element``.
 *
 * An ``added-element`` event is fired when an element is directly
 * added to the observed tree. The opposite events are
 * ``excluding-element`` and ``removed-element``.
 *
 * A ``children-changing`` and ``children-changed`` event are fired
 * when an element's children are being changed.
 *
 * A ``text-changed`` event is fired when a text node has changed.
 *
 * An ``attribute-changed`` is fired when an attribute has changed.
 *
 * A ``trigger`` event with name ``[name]`` is fired when
 * ``trigger([name])`` is called. Trigger events are meant to be
 * triggered by event handlers called by the Listener, not by other
 * code.
 *
 * <h2>Example</h2>
 *
 * Consider the following HTML fragment:
 *
 *     &lt;ul>
 *      &lt;li>foo&lt;/li>
 *     &lt;/ul>
 *
 * If the fragment is added to a ``&lt;div>`` element, an
 * ``included-element`` event will be generated for ``&lt;ul>`` and
 * ``&lt;li>`` but an ``added-element`` event will be generated only
 * for ``&lt;ul>``. A ``changed-children`` event will be generated for
 * the parent of ``&lt;ul>``.
 *
 * If the fragment is removed, an ``excluding-element`` and
 * ``excluded-element`` event will be generated for ``&lt;ul>`` and
 * ``&lt;li>`` but a ``removing-element`` and ``remove-element`` event
 * will be generated only for ``&lt;ul>``. A ``children-changing`` and
 * ``children-changed`` event will be generated for the parent of
 * ``&lt;ul>``.
 *
 * The signatures of the event handlers and details of each event are
 * as follows:
 *
 * - ``added-element``, ``removing-element``, ``removed-element``:
 *
 *   ``handler(root, parent, previous_sibling, next_sibling, element)``
 *
 *   There is no reason to provide ``parent``, ``previous_sibling``,
 *   ``next_sibling`` for an ``added-element`` event but having the
 *   same signature for additions and removals allows to use the same
 *   function for both cases. The ``element`` parameter is a single
 *   element. The ``removing-element`` event is generated **before**
 *   the element is removed. The ``removed-element`` event is
 *   generated **after** the element is removed. Note that the
 *   ``removed-element`` event has ``null`` for ``parent``,
 *   ``previous_sibling`` and ``next_sibling`` because the element is
 *   no longer in the tree.
 *
 * - ``included-element``, ``excluding-element``, `excluded-element``:
 *
 *   ``handler(root, tree, parent, previous_sibling, next_sibling,
 *   element)``
 *
 *   These handlers are called when a **tree fragment** is removed or
 *   added which contains the element matched by the selector that was
 *   passed to {@link module:domlistener~Listener#addHandler
 *   addHandler()} The ``tree`` parameter contains the node which is
 *   at the root of the tree fragment that was added or removed to
 *   trigger the event. The ``excluding-element`` event is generated
 *   **before** the tree is removed. The ``excluded-element`` event is
 *   generated **after** the tree is removed. Moreover, the
 *   ``previous_sibling``, ``next_sibling`` and ``parent`` parameters
 *   record the siblings and parent of ``tree``, **not those of
 *   ``element``**. These are ``null`` for the ``excluded-element``
 *   event because the tree is no longer in the DOM.
 *
 * - ``children-changing``, ``children-changed``:
 *
 *   ``handler(root, added, removed, previous_sibling,
 *   next_sibling, element)``
 *
 *   These events are geneated when an element's children are about to
 *   change (``changing``) or have been changed (``changed``). The
 *   parameters ``previous_sibling`` and ``next_sibling`` refer to the
 *   siblings that are before and after the entire group of ``added``
 *   or ``removed`` nodes. Note that ``added`` and ``removed`` are
 *   never non-empty lists in the same event. Some asymmetry to
 *   consider:
 *
 *   + ``children-changing`` is generated only for removals. So it
 *   will never have an ``added`` parameter that is a non-empty
 *   array.
 *
 *   + When ``children-changed`` is generated **after** the DOM
 *   operation, it will have ``previous_sibling`` and ``next_sibling``
 *   set to ``null``.
 *
 * - ``text-changed:``
 *
 *   ``handler(root, element, old_value)``
 *
 *   Note that the meaning of the ``selector`` parameter for
 *   text-changed events is different than the usual. Whereas for all
 *   other handlers, the ``selector`` matches the ``element``
 *   parameter passed to the handler, in the case of a text-changed
 *   event the ``selector`` matches the **parent** of the ``element``
 *   parameter which itself is always a text node. The ``old_value``
 *   parameter contains the text of the node before the value changed.
 *
 *   Another thing to keep in mind is that a text-changed event is not
 *   generated when Node objects of type TEXT_NODE are added or
 *   removed. They trigger children-changed events.
 *
 * - ``attribute-changed:``
 *
 *   ``handler(root, element, namespace, name, old_value)``
 *
 *   The ``namespace`` argument is the URI of the namespace in which
 *   the attribute is. The ``name`` argument is the name of the
 *   attribute. The ``old_value`` argument is the old value of the
 *   attribute.
 *
 * - ``trigger``:
 *
 *   ``handler(root)``
 *
 *   A ``trigger`` event with name ``[name]`` is fired when
 *   ``trigger([name])`` is called. Trigger events are meant to be
 *   triggered by event handlers called by the Listener, not by other
 *   code.
 *
 * The order in which handlers are added matters. The Listener
 * provides the following guarantee: for any given type of event, the
 * handlers will be called in the order that they were added to the
 * listener.
 *
 * <h2>Warnings:</h2>
 *
 * - Keep in mind that the the ``children-changed``,
 *   ``excluded-element`` and ``removed-element`` events are generated
 *   **after** the DOM operation that triggers them. This has some
 *   consequences. In particular, a selector that will work perfectly
 *   with ``removing-element`` or ``excluding-element`` may not work
 *   with ``removed-element`` and ``excluded-element``. This would
 *   happen if the selector tests for ancestors of the element removed
 *   or excluded. By the time the ``-ed`` events are generated, the
 *   element is gone from the DOM tree and such selectors will fail.
 *
 *   The ``-ed`` version of these events are still useful. For
 *   instance, a wed mode in use for editing scholarly articles
 *   listends for ``excluded-element`` with a selector that is a tag
 *   name so that it can remove references to these elements when they
 *   are removed. Since it does not need anything more complex then
 *   ``excluded-element`` works perfectly.
 *
 * - A Listener does not verify whether the parameters passed to
 *   handlers are part of the DOM tree. For instance, handler A could
 *   operate on element X so that it is removed from the DOM tree. If
 *   there is already another mutation on X in the pipeline by the
 *   time A is called and handler B is called to deal with it, then by
 *   the time B is run X will no longer be part of the tree.
 *
 *   To put it differently, even if when an event is generated element
 *   X was part of the DOM tree, it is possible that by the time the
 *   handlers that must be run for that mutation are run, X is no
 *   longer part of the DOM tree.
 *
 *   Handlers that care about whether they are operating on elements
 *   that are in the DOM tree should perform a test themselves to
 *   check whether what is passed to them is still in the tree.
 *
 *   The handlers fired on removed-elements events work on nodes that
 *   have been removed from the DOM tree. To know what was before and
 *   after these nodes **before** they were removed use events that
 *   have ``previous_sibling`` and ``next_sibling`` parameters,
 *   because it is likely that the nodes themselves will have both
 *   their ``previousSibling`` and ``nextSibling`` set to ``null``.
 *
 * - Handlers that are fired on children-changed events, **and** which
 *   modify the DOM tree can easily result in infinite loops. Care
 *   should be taken early in any such handler to verify that the kind
 *   of elements added or removed **should** result in a change to the
 *   DOM tree, and ignore those changes that are not relevant.
 *
 * @constructor
 *
 * @param {Node} root The root of the DOM tree about which the
 * listener should listen to changes.
 */

function Listener(root) {
    this._root = root;

    this._event_handlers = {
        "included-element": [],
        "added-element": [],
        "excluded-element": [],
        "excluding-element": [],
        "removed-element": [],
        "removing-element": [],
        "children-changed": [],
        "children-changing": [],
        "text-changed": [],
        "attribute-changed": []
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
 * @param {string|Array.<string>} event_types Either a string naming
 * the event this handler will process or an array of strings if
 * multiple types of events are to be handled.
 * @param selector A CSS selector.
 * @param {Function} handler The handler to be called by this listener
 * when the events specified in ``event_types`` occur.
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
 * Clear anything that is pending. Some implementations may have
 * triggers delivered asynchronously.
 * @method
 */
Listener.prototype.clearPending = mustOverride;

/**
 * Tells the listener to fire the named trigger as soon as possible.
 *
 * @param {string} name The name of the trigger to fire.
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
    rest.unshift(this._root);
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

//  LocalWords:  DOM Mangalam MPL Dubeau previousSibling li ul
//  LocalWords:  MutationObserver nextSibling lt
//  LocalWords:  domlistener
