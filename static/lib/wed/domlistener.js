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
 *  handler($root, $parent, $element)
 * 
 * There is no reason to provide $parent for an added-element event
 * but having the same signature for additions and removals allows to
 * use the same function for both cases. For removed-element events
 * the parent is the parent that the element had *before* it was
 * removed. The $element parameter is a single element.
 * 
 * included-element, excluded-element:
 *
 *  handler($root, $elements)
 * 
 * The $elements parameter is a list of elements.
 * 
 * The order in which handlers are added matters. The Listener
 * provides the following guarantee:
 * 
 * - For any given (event, selector) pair, the handlers will be called
 *   in the order that they were added to the listener.
 */

function Listener(root) {
    this._$root = $(root);
    this._observer = new MutationObserver(this._onMutation.bind(this));

    this._event_handlers = {
        "included-element": {},
        "excluded-element": {},
        "added-element": {},
        "removed-element": {},
        "children-changed": {}, // XXX do we want this?
    };
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
            var map = this._event_handlers[event_type];
            if (map === undefined)
                throw new Error("invalid event_type: " + event_type);
            
            if (map[selector] === undefined)
                map[selector] = [];
            
            map[selector].push(handler);
        }
    };

    this.stopListening = function () {
        this._observer.disconnect();
    }

    this._onMutation = function (mutations, observer) {
        for(var mut_ix = 0, mut_ix_limit = mutations.length; 
            mut_ix < mut_ix_limit; ++mut_ix) {
            var mut = mutations[mut_ix];
            
            var $target = $(mut.target);
            if (mut.type === "childList") {

                //
                // added-element
                //
                var sel_map = this._event_handlers["added-element"];
                var selectors = Object.keys(sel_map);

                // Go over all the elements for which which we have handlers
                for (var sel_ix = 0, sel_ix_limit = selectors.length;
                     sel_ix < sel_ix_limit; ++sel_ix) {
                    var sel = selectors[sel_ix];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.addedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        if ($(mut.addedNodes[node_ix]).is(sel))
                            this._callAllHandlers(sel_map[sel], 
                                                  $target,
                                                  $(mut.addedNodes[node_ix]));
                    }
                }

                //
                // removed-element
                //
                sel_map = this._event_handlers["removed-element"];
                selectors = Object.keys(sel_map);

                // Go over all the elements for which which we have handlers
                for (var sel_ix = 0, sel_ix_limit = selectors.length;
                     sel_ix < sel_ix_limit; ++sel_ix) {
                    var sel = selectors[sel_ix];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.removedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        if ($(mut.removedNodes[node_ix]).is(sel))
                            this._callAllHandlers(sel_map[sel], $target, $(mut.removedNodes[node_ix]));
                    }
                }


                //
                // included-element
                //
                sel_map = this._event_handlers["included-element"];
                selectors = Object.keys(sel_map);

                // Go over all the elements for which which we have handlers
                for (var sel_ix = 0, sel_ix_limit = selectors.length;
                     sel_ix < sel_ix_limit; ++sel_ix) {
                    var sel = selectors[sel_ix];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = mut.addedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        var $nodes = $(mut.addedNodes[node_ix]).
                            findAndSelf(sel);

                        if ($nodes.length > 0)
                            this._callAllHandlers(sel_map[sel], $nodes);
                    }
                }

                //
                // excluded-element 
                //
                sel_map = this._event_handlers["excluded-element"];
                selectors = Object.keys(sel_map);

                // Go over all the elements for which which we have handlers
                for (var sel_ix = 0, sel_ix_limit = selectors.length;
                     sel_ix < sel_ix_limit; ++sel_ix) {
                    var sel = selectors[sel_ix];

                    // Check whether any of the nodes contain an element we 
                    // care about.
                    for (var node_ix = 0, node_ix_limit = 
                         mut.removedNodes.length;
                         node_ix < node_ix_limit; ++node_ix) {
                        // These are the elements we are interested in.
                        var $nodes = $(mut.removedNodes[node_ix]).
                            findAndSelf(sel);

                        if ($nodes.length > 0)
                            this._callAllHandlers(sel_map[sel], $nodes);
                    }
                }

                // children-changed
                sel_map = this._event_handlers["children-changed"];
                selectors = Object.keys(sel_map);

                // Go over all the elements for which which we have handlers
                for (var sel_ix = 0, sel_ix_limit = selectors.length;
                     sel_ix < sel_ix_limit; ++sel_ix) {
                    var sel = selectors[sel_ix];

                    if ($target.is(sel))
                        this._callAllHandlers(sel_map[sel], $target);
                }
            }
        }
    };

    this._callAllHandlers = function () {
        var handlers = arguments[0];
        var rest = Array.prototype.slice.call(arguments, 1);
        rest.unshift(this._$root);
        for(var f_ix = 0, f_ix_limit = handlers.length;
            f_ix < f_ix_limit; ++f_ix)
            handlers[f_ix].apply(undefined, rest);
    };

}).call(Listener.prototype);

exports.Listener = Listener;

});
