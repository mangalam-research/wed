/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var sinon = require("sinon");
var chai = require("chai");
var requirejs = require("requirejs");
var path = require("path");

requirejs.config({
  baseUrl: path.join(__dirname, "../../../../build/standalone/lib"),
  nodeRequire: require,
});
var pubsub = requirejs("wed/lib/pubsub");
var assert = chai.assert;

describe("pubsub", function pubsubBlock() {
  describe("makeTopic", function makeTopic() {
    it("returns the same object if called with same name", function test() {
      assert.equal(pubsub.makeTopic("foo.bar1"), pubsub.makeTopic("foo.bar1"));
    });

    it("exports the created topic", function test() {
      pubsub.makeTopic("foo.bar2");
      assert.isDefined(pubsub.FOO_BAR2);
    });

    it("creates parent topics", function test() {
      pubsub.makeTopic("foo2.bar2");
      assert.isDefined(pubsub.FOO2);
    });
  });

  describe("subscribe", function subscribe() {
    it("fails if called with a non-topic", function test() {
      assert.throws(
        pubsub.subscribe.bind(undefined, "foo2.bar2", function cb() {}),
        Error, "topic is not a Topic object: foo2.bar2");
    });

    it("succeeds if called with a topic", function test(done) {
      var callback = sinon.spy(function cb() {
        assert.isTrue(callback.calledOnce);
        assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(), "foo"));
        assert.isTrue(pubsub.unsubscribe(callback));
        done();
      });
      pubsub.makeTopic("foo.bar3");
      assert.isDefined(pubsub.subscribe(pubsub.FOO_BAR3, callback));
      pubsub.publish(pubsub.FOO_BAR3, "foo");
    });
  });


  describe("publish", function publish() {
    it("fails if called with a non-topic", function test() {
      assert.throws(pubsub.publish.bind(undefined, "foo2.bar2", true),
                    Error, "topic is not a Topic object: foo2.bar2");
    });

    it("succeeds if called with a topic", function test(done) {
      var callback = sinon.spy(function cb() {
        assert.isTrue(callback.calledOnce);
        assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(), "foo"));
        assert.isTrue(pubsub.unsubscribe(callback));
        done();
      });
      pubsub.makeTopic("foo.bar3");
      assert.isDefined(pubsub.subscribe(pubsub.FOO_BAR3, callback));
      pubsub.publish(pubsub.FOO_BAR3, "foo");
    });

    it("causes upper level topics to be fired", function test(done) {
      var callback = sinon.spy(function cb() {
        assert.isTrue(callback.calledOnce);
        assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(), "foo"));
        assert.isTrue(pubsub.unsubscribe(callback));
        done();
      });
      pubsub.makeTopic("foo.bar3");
      // Yep, we listen on FOO.
      assert.isDefined(pubsub.subscribe(pubsub.FOO, callback));
      pubsub.publish(pubsub.FOO_BAR3, "foo");
    });
  });
});


//  LocalWords:  SimpleEventEmitter requirejs addEventListener chai
