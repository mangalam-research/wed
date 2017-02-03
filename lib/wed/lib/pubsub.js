/**
 * @module lib/pubsub
 * @desc Wed's pubsub wrapper. Hides implementation details.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:lib/pubsub */function f(require, exports) {
  "use strict";

  // This is the implementation we use
  var psjs = require("pubsub-js");

  var topics_by_js_name = Object.create(null);
  var topics_by_string = Object.create(null);

  /**
   * This class models a topic of hierarchy in topic names. For
   * instance, the topic ``"foo.bar"`` would be represented by a
   * ``Topic`` with the name ``foo`` which contains another ``Topic``
   * object named ``bar``.
   *
   * @param {string} name The name of this topic.
   * @param {Topic} [parent] This topic's parent.
   * @private
   */
  function Topic(name, parent) {
    this._name = name;
    this._subs = [];
    this._parent = parent;
    this._str = parent ? (parent.toString() + "." + name) : name;

    // Register it.
    if (this._str in topics_by_string) {
      throw new Error("registering twice: " + this._str);
    }

    var js_name = this._str.toUpperCase().replace(/\./g, "_");
    topics_by_string[this._str] = this;
    topics_by_js_name[js_name] = this;

    if (js_name in exports) {
      throw new Error("name clash between topic name and other things " +
                      "we export in this module");
    }

    exports[js_name] = this;
  }

  /**
   * Creates a new subtopic and adds it to this topic.
   *
   * @param {string} name The new topic's name.
   * @returns {Topic} The new subtopic.
   */
  Topic.prototype.addSub = function addSub(name) {
    var ret = new Topic(name, this);
    this._subs.push(ret);
    this[name] = ret;
    return ret;
  };

  /**
   * @returns {string} The fully qualified name of the topic.
   */
  Topic.prototype.toString = function toString() {
    return this._str;
  };

  /**
   * Makes a topic object.
   *
   * @param {string} full_name The full, hierarchical name of the topic.
   * @returns {module:lib/pubsub~Topic} The new topic.
   */
  function makeTopic(full_name) {
    // Don't remake topics
    if (full_name in topics_by_string) {
      return topics_by_string[full_name];
    }

    var sep = full_name.lastIndexOf(".");
    var head;
    var tail;
    if (sep !== -1) {
      head = full_name.slice(0, sep);
      tail = full_name.slice(sep + 1);
    }
    else {
      tail = full_name;
    }

    if (head) {
      var head_topic = topics_by_string[head];
      if (!head_topic) {
        head_topic = makeTopic(head);
      }
      return head_topic.addSub(tail);
    }

    return new Topic(tail);
  }

  exports.makeTopic = makeTopic;

  /**
   * Topic for all wed events.
   *
   * @event module:lib/pubsub#WED
   */

  /**
   * Topic for all mode events.
   *
   * @event module:lib/pubsub#WED_MODE
   */

  /**
   * This event must be emitted when a mode has completely loaded all of
   * its dependencies and is ready to be used.
   *
   * @event module:lib/pubsub#WED_MODE_READY
   */

  makeTopic("wed.mode.ready");

  /**
   * Publish data about a topic.
   *
   * @param {string} topic The topic on which to publish.
   * @param {Object} data The data to publish.
   * @throws {Error} If the topic is not a Topic object.
   * @function
   */
  function publish(topic, data) {
    if (!(topic instanceof Topic)) {
      throw new Error("topic is not a Topic object: " + topic);
    }
    // jshint validthis:true
    return psjs.publish.call(this, String(topic), data);
  }

  exports.publish = publish;

  /**
   * Subscribe to a topic. The callback passed to this method will be
   * called when a publisher publishes about the topic.
   *
   * @param {string} topic The topic about which to subscribe.
   * @param {Function} callback The function to call back.
   * @returns {string} A token to use for unsubscribing.
   * @throws {Error} If the topic is not a Topic object.
   * @function
   */
  function subscribe(topic, callback) {
    if (!(topic instanceof Topic)) {
      throw new Error("topic is not a Topic object: " + topic);
    }
    // jshint validthis:true
    return psjs.subscribe.call(this, String(topic), callback);
  }

  exports.subscribe = subscribe;

  /**
   * Unsubscribe from a topic.
   *
   * @param {string} token The value that was returned by {@link
   * module:lib/pubsub~subscribe subscribe}.
   * @returns {string} The token passed.
   * @function
   *
   * @also
   *
   * @param {Function} callback A callback that was used in a call to
   * {@link module:lib/pubsub~subscribe subscribe}. The function will be
   * unsubscribed from all topics it was subscribed to.
   * @returns {boolean} True if the function was unsubscribed.
   * @function
   */
  exports.unsubscribe = psjs.unsubscribe;
});

//  LocalWords:  pubsub MPL js jshint validthis
