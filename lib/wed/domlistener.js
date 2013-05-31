define(function (require, exports, module) {
'use strict';

var $ = require("jquery");
require("./jquery.findandself");

// Location depends on platform. :-/
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    
/**
 * An "included-element" event is fired when an element appears in the
 * observed tree whether it is directly added or added because its
 * parent was added. The opposite event is "excluded-element".
 *
 * An "added-element" event is fired when an element is directly added
 * to the observed tree. The opposite event is "removed-element".
 *
 * A "tigger" event with name [name] is fired when trigger([name]) is
 * called. The event is fired as soon as all mutations being processed
 * by the current invocation of _onMutation have been
 * processed. Trigger events are meant to be tiggered by event
 * handlers called by the Listener, not by other code.
 *
 *
 * Example
 * 
 * Consider the following fragment:
 *
 * <ul>
 *  <li>foo</li>
 * </ul>
 *
 * If the fragment is added to a <div> element, an included-element
 * event will be generated for <ul> and <li> but an added-element
 * event will be generated only for <ul>.
 *
 * If the fragment is removed, an excluded-element event will be
 * generated for <ul> and <li> but a remove-element event will be
 * generated only for <ul>.
 *
 * The signature of the handlers varies by type of event:
 * 
 * added-element, removed-element:
 *
 *  handler($root, $parent, $previous_sibling, $next_sibling, $element)
 * 
 * There is no reason to provide $parent, $previous_sibling,
 * $next_sibling for an added-element event but having the same
 * signature for additions and removals allows to use the same
 * function for both cases. For removed-element events the parent is
 * the parent that the element had *before* it was removed. The
 * $element parameter is a single element.
 * 
 * included-element, excluded-element:
 *
 *  handler($root, $element)
 * 
 * children-changed
 *
 *  handler ($root, $added, $removed, $element)
 *
 * The order in which handlers are added matters. The Listener
 * provides the following guarantee: for any given type of event, the
 * handlers will be called in the order that they were added to the
 * listener.
 */

function Listener(root) {
    this._$root = $(root);
    this._observer = new MutationObserver(this._onMutation.bind(this));

    this._event_handlers = {
        "included-element": [],
        "excluded-element": [],
        "added-element": [],
        "removed-element": [],
        "children-changed": [], // XXX do we want this?
    };

    this._trigger_handlers = {};

    this._triggers_to_fire = {};
}

(function() {

    this.startListening = function () {
        this._observer.observe(this._$root.get(0), {
            subtree: true,
            childList: true,
            attributes: false,
            attributeOldValue: false, // Can't be true if 'attributes' false.
            characterData: false,
            characterDataOldValue: false // Can't be true if 'characterData' false.
        });
    }

    this.addHandler = function (event_types, selector, handler) {
        if (!(event_types instanceof Array)) 
            event_types = [event_types];

        for(var ev_ix = 0, event_type; event_type = event_types[ev_ix]; 
            ev_ix++) {
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

    this.stopListening = function () {
        this._observer.disconnect();
    };

    this.trigger = function(name) {
        this._triggers_to_fire[name] = 1;
    };

    this._onMutation = function (mutations, observer) {
        for(var mut_ix = 0, mut_ix_limit = mutations.length; 
            mut_ix < mut_ix_limit; ++mut_ix) {
            var mut = mutations[mut_ix];
            
            var $target = $(mut.target);
            if (mut.type === "childList") {

                //
                // added-element
                //
                var pairs = this._event_handlers["added-element"];

                // Go over all the elements for which which we have handlers
                for (var pair_ix = 0, pair_ix_limit = pairs.length;
                     pair_ix < pair_ix_limit; ++pair_ix) {
                    var pair = pairs[pair_ix];
                    var sel = pair[0];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.addedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        if ($(mut.addedNodes[node_ix]).is(sel))
                            this._callAllHandlers(pair[1], 
                                                  $target,
                                                  $(mut.previousSibling),
                                                  $(mut.nextSibling),
                                                  $(mut.addedNodes[node_ix]));
                    }
                }

                //
                // removed-element
                //
                pairs = this._event_handlers["removed-element"];

                // Go over all the elements for which which we have handlers
                for (var pair_ix = 0, pair_ix_limit = pairs.length;
                     pair_ix < pair_ix_limit; ++pair_ix) {
                    var pair = pairs[pair_ix];
                    var sel = pair[0];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.removedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        if ($(mut.removedNodes[node_ix]).is(sel))
                            this._callAllHandlers(pair[1], 
                                                  $target, 
                                                  $(mut.previousSibling),
                                                  $(mut.nextSibling),
                                                  $(mut.removedNodes[node_ix]));
                    }
                }


                //
                // included-element
                //
                pairs = this._event_handlers["included-element"];

                // Go over all the elements for which which we have handlers
                for (var pair_ix = 0, pair_ix_limit = pairs.length;
                     pair_ix < pair_ix_limit; ++pair_ix) {
                    var pair = pairs[pair_ix];
                    var sel = pair[0];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.addedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        var $targets = $(mut.addedNodes[node_ix]).
                            findAndSelf(sel);

                        for(var target_ix = 0, target_ix_limit = $targets.length; 
                            target_ix < target_ix_limit; ++target_ix)
                            this._callAllHandlers(pair[1], $($targets.get(target_ix)));
                    }
                }

                //
                // excluded-element 
                //
                pairs = this._event_handlers["excluded-element"];

                // Go over all the elements for which which we have handlers
                for (var pair_ix = 0, pair_ix_limit = pairs.length;
                     pair_ix < pair_ix_limit; ++pair_ix) {
                    var pair = pairs[pair_ix];
                    var sel = pair[0];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = 
                         mut.removedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        var $targets = $(mut.removedNodes[node_ix]).
                            findAndSelf(sel);

                        for(var target_ix = 0, target_ix_limit = $targets.length; 
                            target_ix < target_ix_limit; ++target_ix)
                            this._callAllHandlers(pair[1], $($targets.get(target_ix)));
                    }
                }

                // children-changed
                pairs = this._event_handlers["children-changed"];

                // Go over all the elements for which which we have handlers
                for (var pair_ix = 0, pair_ix_limit = pairs.length;
                     pair_ix < pair_ix_limit; ++pair_ix) {
                    var pair = pairs[pair_ix];
                    var sel = pair[0];

                    if ($target.is(sel))
                        this._callAllHandlers(pair[1], $(mut.addedNodes), $(mut.removedNodes), $target);
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

    this._callAllHandlers = function () {
        var handler = arguments[0];
        var rest = Array.prototype.slice.call(arguments, 1);
        rest.unshift(this._$root);
        handler.apply(undefined, rest);
    };

}).call(Listener.prototype);

// Useful for debugging
function _dumpMutation (mut) {
    console.log(mut.type + ":", mut.target, mut.addedNodes, mut.removedNodes, mut.previousSibling, mut.nextSibling, mut.attributeName, mut.attributeNamespace, mut.oldValue);
}

exports.Listener = Listener;

});
