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
var conditioned = requirejs("wed/lib/conditioned");
var Conditioned = conditioned.Conditioned;
var oop = requirejs("wed/oop");
var chai = require("chai");
var assert = chai.assert;

function Example() {
    SimpleEventEmitter.call(this);
    Conditioned.call(this);
}

oop.implement(Example, SimpleEventEmitter);
oop.implement(Example, Conditioned);

describe("Conditioned", function () {
    var emitter;

    beforeEach(function () {
        emitter = new Example();
    });

    describe("whenCondition", function () {
        it("adds an event listener if the condition is not attained",
           function () {
            var called = false;
            emitter.whenCondition("event", function (ev) {
                called = true;
            });
            emitter._setCondition("event", null);
            assert.isTrue(called);
        });

        it("calls the listener right away if the condition is attained",
           function () {
            var called = false;
            emitter._setCondition("event", null);
            emitter.whenCondition("event", function (ev) {
                called = true;
            });
            assert.isTrue(called);
        });

        it("adds an event listener if the condition is not attained",
           function () {
            var calls = [];
            emitter.whenCondition("event", function (ev) {
                calls.push("event a");
            });
            emitter.whenCondition("event", function (ev) {
                calls.push("event b");
            });
            emitter._setCondition("event", null);
            assert.deepEqual(calls, ["event a", "event b"]);
        });
    });
});
