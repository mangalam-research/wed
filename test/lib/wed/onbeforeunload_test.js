/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var chai = require("chai");
var assert = chai.assert;
var sinon = require("sinon");


describe("onbeforeunload", function () {
    var onbeforeunload;
    beforeEach(function () {
        // Leak into the global space.
        global.window = {};
        requirejs.config({
            baseUrl: __dirname + '/../../../build/standalone/lib'
        });
        onbeforeunload = requirejs("wed/onbeforeunload");
    });

    afterEach(function () {
        delete global.window;
        requirejs.undef("wed/onbeforeunload");
    });

    it("automatically installs itself on window", function () {
        assert.isDefined(window.onbeforeunload);
        assert.equal(window.onbeforeunload(),
                     "Do you really want to navigate away from this page?");
    });

    describe("install", function () {
        it("fails when force is not set", function () {
            assert.throws(
                onbeforeunload.install.bind(undefined, window),
                Error, "reregistering window with `force` false");
        });

        it("works when force is set", function () {
            onbeforeunload.install(window, "foo", null, true);
            assert.equal(window.onbeforeunload(), "foo");
        });

        it("a true check results in a prompt", function () {
            var check = sinon.stub();
            check.returns(true);

            onbeforeunload.install(window, "foo", check, true);
            assert.equal(window.onbeforeunload(), "foo");
            assert.isTrue(check.calledOnce);
        });

        it("a false check does not result in a prompt", function () {
            var check = sinon.stub();
            check.returns(false);

            onbeforeunload.install(window, "foo", check, true);
            assert.equal(window.onbeforeunload(), undefined);
            assert.isTrue(check.calledOnce);
        });
    });

});

//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
