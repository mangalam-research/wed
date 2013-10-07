/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../../build/standalone/lib',
    nodeRequire: require
});
var simple_event_emitter = requirejs("wed/lib/simple_event_emitter");
var SimpleEventEmitter = simple_event_emitter.SimpleEventEmitter;
var oop = requirejs("wed/oop");
var chai = require("chai");
var assert = chai.assert;

function Example() {
    SimpleEventEmitter.call(this);
}

oop.implement(Example, SimpleEventEmitter);

describe("SimpleEventEmitter", function () {
    var emitter;

    beforeEach(function () {
        emitter = new Example();
    });

    describe("addEventListener", function () {
        it("adds an event listener", function () {
            var called = false;
            emitter.addEventListener("event", function (ev) {
                called = true;
            });
            emitter._emit("event", null);
            assert.isTrue(called);
        });

        it("adds event listener in order", function () {
            var calls = [];
            emitter.addEventListener("event", function (ev) {
                calls.push("first");
            });
            emitter.addEventListener("event", function (ev) {
                calls.push("second");
            });

            emitter._emit("event", null);
            assert.deepEqual(calls, ["first", "second"]);
        });
    });

    describe("_emit", function () {
        it("works fine if emitting an event for which there is no handler",
           function () {
               assert.doesNotThrow(emitter._emit.bind(emitter, "event", null));
           });

        it("does not continue processing if a listener returns "+
           "false", function () {
               var calls = [];
               emitter.addEventListener("event", function (ev) {
                   calls.push("first");
                   return false;
               });
               emitter.addEventListener("event", function (ev) {
                   calls.push("second");
               });

               emitter._emit("event", null);
               assert.deepEqual(calls, ["first"]);
           });

        it("passes event data", function () {
            var data;
            emitter.addEventListener("event", function (ev) {
                data = ev;
            });
            var ev = {foo: 'foo'};
            emitter._emit("event", ev);
            assert.equal(data, ev);
        });

        it("calls only relevant listeners", function () {
            var calls = [];
            emitter.addEventListener("event 1", function (ev) {
                calls.push("event 1");
            });
            emitter.addEventListener("event 2", function (ev) {
                calls.push("event 2");
            });

            emitter._emit("event 1", null);
            // event 2 not present so the 2nd handler was not called.
            assert.deepEqual(calls, ["event 1"]);
        });

        it("calls one-time listeners as many times as they've been added",
           function () {
               var calls = [];
               function listener(ev) {
                   calls.push("event");
               }
               emitter.addOneTimeEventListener("event", listener);
               emitter.addOneTimeEventListener("event", listener);
               var ret = emitter.addOneTimeEventListener("event", listener);
               emitter.removeEventListener("event", ret);
               emitter._emit("event", null);
               assert.deepEqual(calls, ["event", "event"]);
        });

        it("processes generic listeners first",
           function () {
            // The generic_listener will execute but not the regular
            // listener.
            var executed = [];
            function generic_listener(name, ev) {
                executed.push(name);
                return false;
            }
            var listener_executed = false;
            function listener(ev) {
                listener_executed = true;
            }
            var event_name = "a";
            emitter.addEventListener(event_name, listener);
            emitter.addEventListener("*", generic_listener);
            emitter._emit(event_name, null);
            assert.isFalse(listener_executed);
            assert.equal(executed[0], event_name);
        });

        it("calls generic listeners",
           function () {
            var expect = [
                ["a", null],
                ["b", 1]
            ];
            var expect_ix = 0;
            function listener(name, ev) {
                var expected = expect[expect_ix++];
                assert.equal(name, expected[0]);
                assert.equal(ev, expected[1]);
            }
            emitter.addEventListener("*", listener);
            emitter._emit("a", null);
            emitter._emit("b", 1);
        });

    });

    describe("removeEventListener", function () {
        it("does nothing if the listener is not present among those added",
           function () {
               assert.doesNotThrow(
                   emitter.removeEventListener.bind(emitter, "event",
                                                    function () {}));
           });

        it("removes a listener that was added",
           function () {
               var calls = [];
               function listener(ev) {
                   calls.push("event 1");
               }
               emitter.addEventListener("event 1", listener);
               emitter._emit("event 1", null);
               assert.deepEqual(calls, ["event 1"]);

               // Remove the listener, so emitting again won't change
               // the list of calls.
               emitter.removeEventListener("event 1", listener);
               emitter._emit("event 1", null);
               assert.deepEqual(calls, ["event 1"]);

           });

        it("removes a listener only once",
           function () {
               var calls = [];
               function listener(ev) {
                   calls.push("event 1");
               }
               emitter.addEventListener("event 1", listener);
               emitter.addEventListener("event 1", listener);
               emitter._emit("event 1", null);
               assert.deepEqual(calls, ["event 1", "event 1"]);

               // Remove the listener, so one listener is left.
               emitter.removeEventListener("event 1", listener);
               emitter._emit("event 1", null);
               // And we get one more element to our array.
               assert.deepEqual(calls, ["event 1", "event 1", "event 1"]);

           });

    });

    describe("removeAllListeners", function () {
        it("removes only the listeners related to a specific " +
           "event", function () {
               var calls = [];
               emitter.addEventListener("event 1", function (ev) {
                   calls.push("event 1");
               });
               emitter.addEventListener("event 2", function (ev) {
                   calls.push("event 2");
               });

               emitter._emit("event 1", null);
               emitter._emit("event 2", null);
               assert.deepEqual(calls, ["event 1", "event 2"]);
               emitter.removeAllListeners("event 1");
               emitter._emit("event 1", null);
               emitter._emit("event 2", null);
               assert.deepEqual(calls, ["event 1", "event 2", "event 2"]);
           });

        it("removes all event listener for a specific event", function () {
               var calls = [];
               emitter.addEventListener("event 1", function (ev) {
                   calls.push("event 1");
               });
               emitter.addEventListener("event 1", function (ev) {
                   calls.push("event 1.b");
               });
               emitter._emit("event 1", null);
               assert.deepEqual(calls, ["event 1", "event 1.b"]);
               emitter.removeAllListeners("event 1");
               emitter._emit("event 1", null);
               assert.deepEqual(calls, ["event 1", "event 1.b"]);
           });

    });

    describe("addOneTimeEventListener", function () {
        it("adds an event listener called only once", function () {
            var calls = [];
            emitter.addOneTimeEventListener("event", function (ev) {
                calls.push("event");
            });
            emitter._emit("event", null);
            assert.deepEqual(calls, ["event"]);
            emitter._emit("event", null);
            assert.deepEqual(calls, ["event"]);
        });

        it("returns a value that can be used by removeEventListener",
           function () {
               var calls = [];
               var ret = emitter.addOneTimeEventListener(
                   "event",
                   function (ev) {
                       calls.push("event a");
                   });
               emitter.addOneTimeEventListener(
                   "event",
                   function (ev) {
                       calls.push("event b");
                   });
               emitter.removeEventListener("event", ret);

               emitter._emit("event", null);
               assert.deepEqual(calls, ["event b"]);
           });
    });

});

// LocalWords:  requirejs oop chai SimpleEventEmitter
// LocalWords:  addEventListener removeEventListener
// LocalWords:  removeAllListeners addOneTimeEventListener
