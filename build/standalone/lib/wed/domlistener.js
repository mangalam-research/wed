/**
 * Listener for DOM tree changes.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "./domtypeguards"], function (require, exports, domtypeguards_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class models a listener designed to listen to changes to a DOM tree and
     * fire events on the basis of the changes that it detects.
     *
     * An  ``included-element``  event is  fired  when  an  element appears  in  the
     * observed tree  whether it is directly  added or added because  its parent was
     * added.     The    opposite     events    are     ``excluding-element``    and
     * ``excluded-element``.  The event  ``excluding-element`` is  generated *before
     * the tree fragment is removed, and ``excluded-element`` *after*.
     *
     * An ``added-element`` event is fired when an element is directly added to the
     * observed tree. The opposite events are ``excluding-element`` and
     * ``removed-element``.
     *
     * A ``children-changing`` and ``children-changed`` event are fired when an
     * element's children are being changed.
     *
     * A ``text-changed`` event is fired when a text node has changed.
     *
     * An ``attribute-changed`` is fired when an attribute has changed.
     *
     * A ``trigger`` event with name ``[name]`` is fired when ``trigger([name])`` is
     * called. Trigger events are meant to be triggered by event handlers called by
     * the listener, not by other code.
     *
     * <h2>Example</h2>
     *
     * Consider the following HTML fragment:
     *
     *     <ul>
     *      <li>foo</li>
     *     </ul>
     *
     * If the fragment is added to a ``<div>`` element, an ``included-element``
     * event will be generated for ``<ul>`` and ``<li>`` but an ``added-element``
     * event will be generated only for ``<ul>``. A ``changed-children`` event will
     * be generated for the parent of ``<ul>``.
     *
     * If the fragment is removed, an ``excluding-element`` and ``excluded-element``
     * event will be generated for ``<ul>`` and ``<li>`` but a ``removing-element``
     * and ``remove-element`` event will be generated only for ``<ul>``. A
     * ``children-changing`` and ``children-changed`` event will be generated for
     * the parent of ``<ul>``.
     *
     * The order in which handlers are added matters. The listener provides the
     * following guarantee: for any given type of event, the handlers will be called
     * in the order that they were added to the listener.
     *
     * <h2>Warnings:</h2>
     *
     * - Keep in mind that the ``children-changed``, ``excluded-element`` and
     *   ``removed-element`` events are generated **after** the DOM operation that
     *   triggers them. This has some consequences. In particular, a selector that
     *   will work perfectly with ``removing-element`` or ``excluding-element`` may
     *   not work with ``removed-element`` and ``excluded-element``. This would
     *   happen if the selector tests for ancestors of the element removed or
     *   excluded. By the time the ``-ed`` events are generated, the element is gone
     *   from the DOM tree and such selectors will fail.
     *
     *   The ``-ed`` version of these events are still useful. For instance, a wed
     *   mode in use for editing scholarly articles listens for ``excluded-element``
     *   with a selector that is a tag name so that it can remove references to
     *   these elements when they are removed. Since it does not need anything more
     *   complex then ``excluded-element`` works perfectly.
     *
     * - A listener does not verify whether the parameters passed to handlers are
     *   part of the DOM tree. For instance, handler A could operate on element X so
     *   that it is removed from the DOM tree. If there is already another mutation
     *   on X in the pipeline by the time A is called and handler B is called to
     *   deal with it, then by the time B is run X will no longer be part of the
     *   tree.
     *
     *   To put it differently, even if when an event is generated element X was
     *   part of the DOM tree, it is possible that by the time the handlers that
     *   must be run for that mutation are run, X is no longer part of the DOM tree.
     *
     *   Handlers that care about whether they are operating on elements that are in
     *   the DOM tree should perform a test themselves to check whether what is
     *   passed to them is still in the tree.
     *
     *   The handlers fired on removed-elements events work on nodes that have been
     *   removed from the DOM tree. To know what was before and after these nodes
     *   **before** they were removed use events that have ``previous_sibling`` and
     *   ``next_sibling`` parameters, because it is likely that the nodes themselves
     *   will have both their ``previousSibling`` and ``nextSibling`` set to
     *   ``null``.
     *
     * - Handlers that are fired on children-changed events, **and** which modify
     *   the DOM tree can easily result in infinite loops. Care should be taken
     *   early in any such handler to verify that the kind of elements added or
     *   removed **should** result in a change to the DOM tree, and ignore those
     *   changes that are not relevant.
     */
    var DOMListener = /** @class */ (function () {
        /**
         * @param root The root of the DOM tree about which the listener should listen
         * to changes.
         */
        function DOMListener(root, updater) {
            var _this = this;
            this.root = root;
            this.updater = updater;
            this.eventHandlers = {
                "included-element": [],
                "added-element": [],
                "excluded-element": [],
                "excluding-element": [],
                "removed-element": [],
                "removing-element": [],
                "children-changed": [],
                "children-changing": [],
                "text-changed": [],
                "attribute-changed": [],
            };
            this.triggerHandlers = Object.create(null);
            this.triggersToFire = Object.create(null);
            this.stopped = true;
            this.updater.events.subscribe(function (ev) {
                switch (ev.name) {
                    case "InsertNodeAt":
                        _this._insertNodeAtHandler(ev);
                        break;
                    case "SetTextNodeValue":
                        _this._setTextNodeValueHandler(ev);
                        break;
                    case "BeforeDeleteNode":
                        _this._beforeDeleteNodeHandler(ev);
                        break;
                    case "DeleteNode":
                        _this._deleteNodeHandler(ev);
                        break;
                    case "SetAttributeNS":
                        _this._setAttributeNSHandler(ev);
                        break;
                    default:
                    // Do nothing...
                }
            });
        }
        /**
         * Start listening to changes on the root passed when the object was
         * constructed.
         */
        DOMListener.prototype.startListening = function () {
            this.stopped = false;
        };
        /**
         * Stops listening to DOM changes.
         */
        DOMListener.prototype.stopListening = function () {
            this.stopped = true;
        };
        /**
         * Process all changes immediately.
         */
        DOMListener.prototype.processImmediately = function () {
            if (this.scheduledProcessTriggers !== undefined) {
                this.clearPending();
                this._processTriggers();
            }
        };
        /**
         * Clear anything that is pending. Some implementations may have triggers
         * delivered asynchronously.
         */
        DOMListener.prototype.clearPending = function () {
            if (this.scheduledProcessTriggers !== undefined) {
                window.clearTimeout(this.scheduledProcessTriggers);
                this.scheduledProcessTriggers = undefined;
            }
        };
        DOMListener.prototype.addHandler = function (eventType, selector, handler) {
            if (eventType === "trigger") {
                var handlers = this.triggerHandlers[selector];
                if (handlers === undefined) {
                    handlers = this.triggerHandlers[selector] = [];
                }
                handlers.push(handler);
            }
            else {
                // As of TS 2.2.2, we need to the type annotation in the next line.
                var pairs = this.eventHandlers[eventType];
                if (pairs === undefined) {
                    throw new Error("invalid eventType: " + eventType);
                }
                pairs.push([selector, handler]);
            }
        };
        /**
         * Tells the listener to fire the named trigger as soon as possible.
         *
         * @param {string} name The name of the trigger to fire.
         */
        DOMListener.prototype.trigger = function (name) {
            this.triggersToFire[name] = 1;
        };
        /**
         * Processes pending triggers.
         */
        DOMListener.prototype._processTriggers = function () {
            var keys = Object.keys(this.triggersToFire);
            while (keys.length > 0) {
                // We flush the map because the triggers could trigger
                // more triggers. This also explains why we are in a loop.
                this.triggersToFire = Object.create(null);
                var triggerMap = this.triggerHandlers;
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    var handlers = triggerMap[key];
                    if (handlers !== undefined) {
                        for (var _a = 0, handlers_1 = handlers; _a < handlers_1.length; _a++) {
                            var handler = handlers_1[_a];
                            this._callHandler(handler);
                        }
                    }
                }
                // See whether there is more to trigger.
                keys = Object.keys(this.triggersToFire);
            }
        };
        /**
         * Utility function for calling event handlers.
         *
         * @param handler The handler.
         *
         * @param rest The arguments to pass to the handler.
         */
        // tslint:disable-next-line:no-any
        DOMListener.prototype._callHandler = function (handler) {
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments[_i];
            }
            rest.unshift(this.root);
            handler.apply(undefined, rest);
        };
        /**
         * Handles node additions.
         *
         * @param ev The event.
         */
        DOMListener.prototype._insertNodeAtHandler = function (ev) {
            if (this.stopped) {
                return;
            }
            var parent = ev.parent;
            var node = ev.node;
            var ccCalls = this._childrenCalls("children-changed", parent, [node], [], node.previousSibling, node.nextSibling);
            var arCalls = [];
            var ieCalls = [];
            if (domtypeguards_1.isElement(node)) {
                arCalls = this._addRemCalls("added-element", node, parent);
                ieCalls = this._incExcCalls("included-element", node, parent);
            }
            var toCall = ccCalls.concat(arCalls, ieCalls);
            for (var _i = 0, toCall_1 = toCall; _i < toCall_1.length; _i++) {
                var call = toCall_1[_i];
                (_a = this._callHandler).call.apply(_a, [this, call.fn].concat(call.params));
            }
            this._scheduleProcessTriggers();
            var _a;
        };
        /**
         * Handles node deletions.
         *
         * @param ev The event.
         */
        DOMListener.prototype._beforeDeleteNodeHandler = function (ev) {
            if (this.stopped) {
                return;
            }
            var node = ev.node;
            var parent = node.parentNode;
            var ccCalls = this._childrenCalls("children-changing", parent, [], [node], node.previousSibling, node.nextSibling);
            var arCalls = [];
            var ieCalls = [];
            if (domtypeguards_1.isElement(node)) {
                arCalls = this._addRemCalls("removing-element", node, parent);
                ieCalls = this._incExcCalls("excluding-element", node, parent);
            }
            var toCall = ccCalls.concat(arCalls, ieCalls);
            for (var _i = 0, toCall_2 = toCall; _i < toCall_2.length; _i++) {
                var call = toCall_2[_i];
                (_a = this._callHandler).call.apply(_a, [this, call.fn].concat(call.params));
            }
            this._scheduleProcessTriggers();
            var _a;
        };
        /**
         * Handles node deletion events.
         *
         * @param ev The event.
         */
        DOMListener.prototype._deleteNodeHandler = function (ev) {
            if (this.stopped) {
                return;
            }
            var node = ev.node;
            var parent = ev.formerParent;
            var ccCalls = this._childrenCalls("children-changed", parent, [], [node], null, null);
            var arCalls = [];
            var ieCalls = [];
            if (domtypeguards_1.isElement(node)) {
                arCalls = this._addRemCalls("removed-element", node, parent);
                ieCalls = this._incExcCalls("excluded-element", node, parent);
            }
            var toCall = ccCalls.concat(arCalls, ieCalls);
            for (var _i = 0, toCall_3 = toCall; _i < toCall_3.length; _i++) {
                var call = toCall_3[_i];
                (_a = this._callHandler).call.apply(_a, [this, call.fn].concat(call.params));
            }
            this._scheduleProcessTriggers();
            var _a;
        };
        /**
         * Produces the calls for ``children-...`` events.
         *
         * @param call The type of call to produce.
         *
         * @param parent The parent of the children that have changed.
         *
         * @param added The children that were added.
         *
         * @param removed The children that were removed.
         *
         * @param prev Node preceding the children.
         *
         * @param next Node following the children.
         *
         * @returns A list of call specs.
         */
        DOMListener.prototype._childrenCalls = function (call, parent, added, removed, prev, next) {
            if (added.length !== 0 && removed.length !== 0) {
                throw new Error("we do not support having nodes added " +
                    "and removed in the same event");
            }
            var pairs = this.eventHandlers[call];
            var ret = [];
            // Go over all the elements for which we have handlers
            for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
                var _a = pairs_1[_i], sel = _a[0], fn = _a[1];
                if (parent.matches(sel)) {
                    ret.push({ fn: fn, params: [added, removed, prev, next, parent] });
                }
            }
            return ret;
        };
        /**
         * Handles text node changes events.
         *
         * @param ev The event.
         */
        DOMListener.prototype._setTextNodeValueHandler = function (ev) {
            if (this.stopped) {
                return;
            }
            var pairs = this.eventHandlers["text-changed"];
            var node = ev.node;
            // Go over all the elements for which we have
            // handlers
            var parent = node.parentNode;
            for (var _i = 0, pairs_2 = pairs; _i < pairs_2.length; _i++) {
                var _a = pairs_2[_i], sel = _a[0], fn = _a[1];
                if (parent.matches(sel)) {
                    this._callHandler(fn, node, ev.oldValue);
                }
            }
            this._scheduleProcessTriggers();
        };
        /**
         * Handles attribute change events.
         *
         * @param ev The event.
         */
        DOMListener.prototype._setAttributeNSHandler = function (ev) {
            if (this.stopped) {
                return;
            }
            var target = ev.node;
            // Go over all the elements for which we have handlers
            var pairs = this.eventHandlers["attribute-changed"];
            for (var _i = 0, pairs_3 = pairs; _i < pairs_3.length; _i++) {
                var _a = pairs_3[_i], sel = _a[0], fn = _a[1];
                if (target.matches(sel)) {
                    this._callHandler(fn, target, ev.ns, ev.attribute, ev.oldValue);
                }
            }
            this._scheduleProcessTriggers();
        };
        /**
         * Sets a timeout to run the triggers that must be run.
         */
        DOMListener.prototype._scheduleProcessTriggers = function () {
            var _this = this;
            if (this.scheduledProcessTriggers !== undefined) {
                return;
            }
            this.scheduledProcessTriggers = window.setTimeout(function () {
                _this.scheduledProcessTriggers = undefined;
                _this._processTriggers();
            }, 0);
        };
        /**
         * Produces the calls for the added/removed family of events.
         *
         * @param name The event name.
         *
         * @param node The node added or removed.
         *
         * @param target The parent of this node.
         *
         * @returns A list of call specs.
         */
        DOMListener.prototype._addRemCalls = function (name, node, target) {
            var pairs = this.eventHandlers[name];
            var ret = [];
            var prev = node.previousSibling;
            var next = node.nextSibling;
            // Go over all the elements for which we have handlers
            for (var _i = 0, pairs_4 = pairs; _i < pairs_4.length; _i++) {
                var _a = pairs_4[_i], sel = _a[0], fn = _a[1];
                if (node.matches(sel)) {
                    ret.push({ fn: fn, params: [target, prev, next, node] });
                }
            }
            return ret;
        };
        /**
         * Produces the calls for included/excluded family of events.
         *
         * @param name The event name.
         *
         * @param node The node which was included or excluded and for which we must
         * issue the events.
         *
         * @param target The parent of this node.
         *
         * @returns A list of call specs.
         */
        DOMListener.prototype._incExcCalls = function (name, node, target) {
            var pairs = this.eventHandlers[name];
            var prev = node.previousSibling;
            var next = node.nextSibling;
            var ret = [];
            // Go over all the elements for which we have handlers
            for (var _i = 0, pairs_5 = pairs; _i < pairs_5.length; _i++) {
                var _a = pairs_5[_i], sel = _a[0], fn = _a[1];
                if (node.matches(sel)) {
                    ret.push({ fn: fn, params: [node, target, prev, next, node] });
                }
                var targets = node.querySelectorAll(sel);
                for (var _b = 0, _c = Array.prototype.slice.call(targets); _b < _c.length; _b++) {
                    var subtarget = _c[_b];
                    ret.push({ fn: fn, params: [node, target, prev, next, subtarget] });
                }
            }
            return ret;
        };
        return DOMListener;
    }());
    exports.DOMListener = DOMListener;
});
//  LocalWords:  eventType SetAttributeNS DeleteNode BeforeDeleteNode ul li MPL
//  LocalWords:  SetTextNodeValue nextSibling InsertNodeAt previousSibling DOM
//  LocalWords:  Dubeau Mangalam
//# sourceMappingURL=domlistener.js.map