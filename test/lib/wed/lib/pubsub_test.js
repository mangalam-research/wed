/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../../build/standalone/lib',
    nodeRequire: require
});
var sinon = require("sinon");
var pubsub = requirejs("wed/lib/pubsub");
var chai = require("chai");
var assert = chai.assert;

describe("pubsub", function () {
    describe("makeTopic", function () {
        it("returns the same object if called with same name", function () {
            assert.equal(pubsub.makeTopic("foo.bar1"),
                         pubsub.makeTopic("foo.bar1"));
        });

        it("exports the created topic", function () {
            pubsub.makeTopic("foo.bar2");
            assert.isDefined(pubsub.FOO_BAR2);
        });

        it("creates parent topics", function () {
            pubsub.makeTopic("foo2.bar2");
            assert.isDefined(pubsub.FOO2);
        });
    });

    describe("subscribe", function () {
        it("fails if called with a non-topic", function () {
            assert.throws(
                pubsub.subscribe.bind(undefined, "foo2.bar2", function () {}),
                Error,
                "topic is not a Topic object: foo2.bar2");
        });

        it("succeeds if called with a topic", function (done) {
            var callback = sinon.spy(function () {
                assert.isTrue(callback.calledOnce);
                assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(),
                                                  "foo"));
                assert.isTrue(pubsub.unsubscribe(callback));
                done();
            });
            pubsub.makeTopic("foo.bar3");
            assert.isDefined(pubsub.subscribe(pubsub.FOO_BAR3, callback));
            pubsub.publish(pubsub.FOO_BAR3, "foo");
        });
    });


    describe("publish", function () {
        it("fails if called with a non-topic", function () {
            assert.throws(
                pubsub.publish.bind(undefined, "foo2.bar2", true),
                Error,
                "topic is not a Topic object: foo2.bar2");
        });

        it("succeeds if called with a topic", function (done) {
            var callback = sinon.spy(function () {
                assert.isTrue(callback.calledOnce);
                assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(),
                                                  "foo"));
                assert.isTrue(pubsub.unsubscribe(callback));
                done();
            });
            pubsub.makeTopic("foo.bar3");
            assert.isDefined(pubsub.subscribe(pubsub.FOO_BAR3, callback));
            pubsub.publish(pubsub.FOO_BAR3, "foo");
        });

        it("causes upper level topics to be fired", function (done) {
            var callback = sinon.spy(function () {
                assert.isTrue(callback.calledOnce);
                assert.isTrue(callback.calledWith(pubsub.FOO_BAR3.toString(),
                                                  "foo"));
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
