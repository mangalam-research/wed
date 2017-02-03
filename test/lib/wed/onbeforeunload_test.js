/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var requirejs = require("requirejs");
var chai = require("chai");
var sinon = require("sinon");
var path = require("path");

var assert = chai.assert;


describe("onbeforeunload", function onbeforeunloadBlock() {
  var onbeforeunload;
  beforeEach(function beforeEach() {
        // Leak into the global space.
    global.window = {};
    requirejs.config({
      baseUrl: path.join(__dirname, "../../../build/standalone/lib"),
      paths: {
        optional: "requirejs/optional",
      },
    });
    onbeforeunload = requirejs("wed/onbeforeunload");
  });

  afterEach(function afterEach() {
    delete global.window;
    requirejs.undef("wed/onbeforeunload");
  });

  it("automatically installs itself on window", function test() {
    assert.isDefined(window.onbeforeunload);
    assert.isTrue(window.onbeforeunload());
  });

  describe("install", function install() {
    it("fails when force is not set", function test() {
      assert.throws(onbeforeunload.install.bind(undefined, window),
                    Error, "reregistering window with `force` false");
    });

    it("works when force is set", function test() {
      onbeforeunload.install(window, null, true);
      assert.isTrue(window.onbeforeunload());
    });

    it("a true check results in a prompt", function test() {
      var check = sinon.stub();
      check.returns(true);

      onbeforeunload.install(window, check, true);
      assert.isTrue(window.onbeforeunload());
      assert.isTrue(check.calledOnce);
    });

    it("a false check does not result in a prompt", function test() {
      var check = sinon.stub();
      check.returns(false);

      onbeforeunload.install(window, check, true);
      assert.isUndefined(window.onbeforeunload());
      assert.isTrue(check.calledOnce);
    });
  });
});

//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
