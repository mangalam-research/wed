/**
 * @module mutation_domlistener
 * @desc Facility to listen to changes to a DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:mutation_domlistener */
    function (require, exports, module) {
'use strict';

var oop = require("./oop");
var domlistener = require("./domlistener");
var $ = require("jquery");
require("./jquery.findandself");

// Location depends on platform. :-/
var MutationObserver = window.MutationObserver ||
        window.WebKitMutationObserver;

/**
 * @classdesc A DOM listener based on MutationObserver.
 *
 * @extends module:domlistener~Listener
 *
 * @constructor
 * @param {Node} root The root of the DOM tree about which the
 * listener should listen to changes.
 */

function Listener(root) {
    domlistener.Listener.call(this, root);
    this._observer = new MutationObserver(this._onMutation.bind(this));
}

oop.inherit(Listener, domlistener.Listener);

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

Listener.prototype.stopListening = function () {
    this._observer.disconnect();
};

Listener.prototype.processImmediately = function () {
    var records = this._observer.takeRecords();
    while(records.length > 0) {
        while(records.length > 0) {
            this._processMutations(records);
            records = this._observer.takeRecords();
        }
        this._processTriggers();
        records = this._observer.takeRecords();
    }
};

/**
 * Mutation handler.
 * @private
 *
 * @param mutations The mutation to process.
 * @param observer The observer object which saw this mutation.
 */
Listener.prototype._onMutation = function (mutations, observer) {
    this._processMutations(mutations);
    this._processTriggers();
};

/**
 * Act on the mutations.
 * @private
 *
 * @param {Array} mutations An array of mutations to process.
 */
Listener.prototype._processMutations = function (mutations) {
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
            this._fireIncExcHandlers("included-element", mut, added_other,
                                    $target);
            this._fireIncExcHandlers("excluded-element", mut, removed_other,
                                    $target);

            // children-changed
            pairs = this._event_handlers["children-changed"];

            // Go over all the elements for which we have handlers
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

            // Go over all the elements for which we have
            // handlers
            var $parent = $target.parent();
            for (pair_ix = 0, pair_ix_limit = pairs.length;
                 pair_ix < pair_ix_limit; ++pair_ix) {
                pair = pairs[pair_ix];
                sel = pair[0];

                // Check whether any of the nodes contains an
                // element we care about.
                if ($parent.is(sel))
                        this._callHandler(pair[1], $target, mut.oldValue);
            }
        }
    }
};

/**
 * Fires the <code>added-element</code> and
 * <code>removed-element</code> handlers.
 *
 * @private
 *
 * @param {string} name The name of the event.
 * @param mutation The mutation object.
 * @param {Array.<Node>} nodes The nodes for which to fire the event.
 * @param {jQuery} $target The parent of the nodes added or removed.
 */
Listener.prototype._fireAddRemHandlers = function (name, mutation, nodes,
                                                   $target) {
    var pairs = this._event_handlers[name];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        // Check whether any of the nodes contains an element we
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


/**
 * Fires the <code>included-element</code> and
 * <code>excluded-element</code> handlers.
 *
 * @private
 *
 * @param {string} name The name of the event.
 * @param mutation The mutation object.
 * @param {Array.<Node>} nodes The nodes for which to fire the event.
 * @param {jQuery} $target The parent of the nodes included or excluded.
 */
Listener.prototype._fireIncExcHandlers = function (name, mutation, nodes,
                                                  $target) {
    var pairs = this._event_handlers[name];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
        var pair = pairs[pair_ix];
        var sel = pair[0];

        // Check whether any of the nodes contains an element we
        // care about.
        for (var node_ix = 0, node_ix_limit = nodes.length;
             node_ix < node_ix_limit; ++node_ix) {
            // These are the elements we are interested in.
            var $node = $(nodes[node_ix]);
            var $targets = $node.findAndSelf(sel);
            // mutation.previousSibling and nextSibling are
            // relative to the entire set of nodes, so adjust
            // for each individual node.
            var $prev = (node_ix === 0) ? $(mutation.previousSibling):
                    $(nodes[node_ix - 1]);
            var $next = (node_ix === node_ix_limit - 1) ?
                    $(mutation.nextSibling): $(nodes[node_ix + 1]);

            for(var target_ix = 0, target_ix_limit = $targets.length;
                target_ix < target_ix_limit; ++target_ix)
                this._callHandler(pair[1], $node, $target, $prev, $next,
                                  $($targets.get(target_ix)));
        }
    }
};

exports.Listener = Listener;

});

//  LocalWords:  childList characterData DOM oop Mangalam MPL Dubeau
//  LocalWords:  previousSibling MutationObserver nextSibling jquery
//  LocalWords:  findandself domlistener jQuery
