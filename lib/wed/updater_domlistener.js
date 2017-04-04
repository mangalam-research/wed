/**
 * @module updater_domlistener
 * @desc Facility to listen to changes to a DOM tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:updater_domlistener */function f(require, exports) {
  "use strict";

  var oop = require("./oop");
  var domlistener = require("./domlistener");

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

    this._updater.events.subscribe(function handle(ev) {
      switch (ev.name) {
      case "InsertNodeAt":
        this._insertNodeAtHandler(ev);
        break;
      case "SetTextNodeValue":
        this._setTextNodeValueHandler(ev);
        break;
      case "BeforeDeleteNode":
        this._beforeDeleteNodeHandler(ev);
        break;
      case "DeleteNode":
        this._deleteNodeHandler(ev);
        break;
      case "SetAttributeNS":
        this._setAttributeNSHandler(ev);
        break;
      default:
        // Do nothing...
      }
    }.bind(this));
  }

  oop.inherit(Listener, domlistener.Listener);

  var ListenerP = Listener.prototype;

  ListenerP.startListening = function startListening() {
    this._stopped = false;
  };

  ListenerP.stopListening = function stopListening() {
    this._stopped = true;
  };

  ListenerP.processImmediately = function processImmediately() {
    if (this._scheduled_process_triggers) {
      this.clearPending();
      this._processTriggers();
    }
  };

  ListenerP.clearPending = function clearPending() {
    if (this._scheduled_process_triggers) {
      window.clearTimeout(this._scheduled_process_triggers);
      this._scheduled_process_triggers = undefined;
    }
  };

  /**
   * Handles {@link module:tree_updater~TreeUpdater#event:insertNodeAt
   * insertNodeAt} events.
   *
   * @private
   * @param {module:tree_updater~TreeUpdater#event:insertNodeAt} ev The
   * event.
   */
  ListenerP._insertNodeAtHandler = function _insertNodeAtHandler(ev) {
    if (this._stopped) {
      return;
    }

    var parent = ev.parent;
    var node = ev.node;
    var cc_calls = this._childrenCalls(
      "children-changed",
      ev.parent, [ev.node], [], node.previousSibling, node.nextSibling);

    var ar_calls = [];
    var ie_calls = [];
    if (ev.node.nodeType === Node.ELEMENT_NODE) {
      ar_calls = this._addRemCalls("added-element", node, parent);
      ie_calls = this._incExcCalls("included-element", node, parent);
    }

    var to_call = cc_calls.concat(ar_calls, ie_calls);
    for (var i = 0; i < to_call.length; ++i) {
      this._callHandler.apply(this, to_call[i]);
    }

    this._scheduleProcessTriggers();
  };

  /**
   * Handles {@link module:tree_updater~TreeUpdater#event:beforeDeleteNode
   * beforeDeleteNode} events.
   *
   * @private
   * @param {module:tree_updater~TreeUpdater#event:beforeDeleteNode} ev The
   * event.
   */
  ListenerP._beforeDeleteNodeHandler = function _beforeDeleteNodeHandler(ev) {
    if (this._stopped) {
      return;
    }

    var node = ev.node;
    var parent = node.parentNode;
    var cc_calls = this._childrenCalls(
      "children-changing",
      parent, [], [node], node.previousSibling, node.nextSibling);

    var ar_calls = [];
    var ie_calls = [];
    if (ev.node.nodeType === Node.ELEMENT_NODE) {
      ar_calls = this._addRemCalls("removing-element", node, parent);
      ie_calls = this._incExcCalls("excluding-element", node, parent);
    }

    var to_call = cc_calls.concat(ar_calls, ie_calls);
    for (var i = 0; i < to_call.length; ++i) {
      this._callHandler.apply(this, to_call[i]);
    }

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
  ListenerP._deleteNodeHandler = function _deleteNodeHandler(ev) {
    if (this._stopped) {
      return;
    }

    var node = ev.node;
    var parent = ev.formerParent;
    var cc_calls = this._childrenCalls(
      "children-changed", parent, [], [node], null, null);

    var ar_calls = [];
    var ie_calls = [];
    if (ev.node.nodeType === Node.ELEMENT_NODE) {
      ar_calls = this._addRemCalls("removed-element", node, parent);
      ie_calls = this._incExcCalls("excluded-element", node, parent);
    }

    var to_call = cc_calls.concat(ar_calls, ie_calls);
    for (var i = 0; i < to_call.length; ++i) {
      this._callHandler.apply(this, to_call[i]);
    }

    this._scheduleProcessTriggers();
  };

  /**
   * Produces the calls for ``children-...`` events.
   *
   * @private
   * @param {string} call The type of call to produce. Either
   * ``"children-changing"`` or ``"children-changed"``.
   * @param {Node} parent The parent of the children that have changed.
   * @param {Array.<Node>} added Added children.
   * @param {Array.<Node>} removed Removed children.
   * @param {Node|undefined} prev Node preceding the children.
   * @param {Node|undefined} next Node following the children.
   * @returns {Array.<Array>} A list of call signatures. Each signature
   * is a list which has a function for first element and the parameters
   * to pass to this function.
   */
  ListenerP._childrenCalls = function _childrenCalls(call, parent, added,
                                                     removed, prev, next) {
    if (call !== "children-changing" &&
        call !== "children-changed") {
      throw new Error("incorrect call value: " + call);
    }

    if (added.length && removed.length) {
      throw new Error("we do not support having nodes added " +
                      "and removed in the same event");
    }

    var pairs = this._event_handlers[call];
    var ret = [];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
      var pair = pairs[pair_ix];
      var sel = pair[0];

      if (parent.matches(sel)) {
        ret.push([pair[1], added, removed, prev, next, parent]);
      }
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
  ListenerP._setTextNodeValueHandler = function _setTextNodeValueHandler(ev) {
    if (this._stopped) {
      return;
    }

    var pairs = this._event_handlers["text-changed"];
    var node = ev.node;

    // Go over all the elements for which we have
    // handlers
    var parent = node.parentNode;
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
      var pair = pairs[pair_ix];
      var sel = pair[0];

      if (parent.matches(sel)) {
        this._callHandler(pair[1], node, ev.oldValue);
      }
    }

    this._scheduleProcessTriggers();
  };

  /**
   * Handles {@link module:tree_updater~TreeUpdater#event:setAttributeNS
   * setAttributeNS} events.
   *
   * @private
   * @param {module:tree_updater~TreeUpdater#event:setAttributeNS} ev The
   * event.
   */
  ListenerP._setAttributeNSHandler = function _setAttributeNSHandler(ev) {
    if (this._stopped) {
      return;
    }

    var target = ev.node;

    // Go over all the elements for which we have handlers
    var pairs = this._event_handlers["attribute-changed"];
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
      var pair = pairs[pair_ix];
      var sel = pair[0];

      if (target.matches(sel)) {
        this._callHandler(pair[1], target, ev.ns, ev.attribute,
                          ev.oldValue);
      }
    }

    this._scheduleProcessTriggers();
  };

  /**
   * Sets a timeout to run the triggers that must be run.
   * @private
   */
  ListenerP._scheduleProcessTriggers = function _scheduleProcessTriggers() {
    if (this._scheduled_process_triggers) {
      return;
    }
    this._scheduled_process_triggers = window.setTimeout(function process() {
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
   * @param {string} name The event name.
   * @param {Node} node The node added or removed.
   * @param {Node} target The parent of this node.
   *
   * @returns {Array.<Array>} A list of call signatures. Each signature
   * is a list which has a function for first element and the parameters
   * to pass to this function.
   */
  ListenerP._addRemCalls = function _addRemCalls(name, node, target) {
    var pairs = this._event_handlers[name];
    var ret = [];

    var prev = node.previousSibling;
    var next = node.nextSibling;
    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
      var pair = pairs[pair_ix];
      var sel = pair[0];

      if (node.matches(sel)) {
        ret.push([pair[1], target, prev, next, node]);
      }
    }

    return ret;
  };

  /**
   * Produces the calls for <code>included-element</code> and
   * <code>excluded-element</code> events.
   *
   * @private
   *
   * @param {string} name The event name.
   * @param {Node} node The node which was added or removed and for
   * which we must issue the events.
   * @param {Node} target The parent of this node.
   *
   * @returns {Array.<Array>} A list of call signatures. Each signature
   * is a list which has a function for first element and the parameters
   * to pass to this function.
   */
  ListenerP._incExcCalls = function _incExcCalls(name, node, target) {
    var pairs = this._event_handlers[name];
    var prev = node.previousSibling;
    var next = node.nextSibling;
    var ret = [];

    // Go over all the elements for which we have handlers
    for (var pair_ix = 0, pair_ix_limit = pairs.length;
         pair_ix < pair_ix_limit; ++pair_ix) {
      var pair = pairs[pair_ix];
      var sel = pair[0];

      if (node.matches(sel)) {
        ret.push([pair[1], node, target, prev, next, node]);
      }

      var targets = node.querySelectorAll(sel);
      for (var target_ix = 0, target_ix_limit = targets.length;
          target_ix < target_ix_limit; ++target_ix) {
        ret.push([pair[1], node, target, prev, next, targets[target_ix]]);
      }
    }
    return ret;
  };

  exports.Listener = Listener;
});

//  LocalWords:  concat noop setTextNodeValue DOM oop Mangalam MPL
//  LocalWords:  Dubeau domlistener insertNodeAt prev
//  LocalWords:  deleteNode
