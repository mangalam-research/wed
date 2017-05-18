/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var validator = require("wed/validator");
  var salve = require("salve");
  var dloc = require("wed/dloc");
  var schema_text = require("text!../../build/schemas/simplified-rng.js");
  var to_parse = require("text!test-files/validator_test_data/to_parse_converted.xml");

  // Remember that relative paths are resolved against requirejs'
  // baseUrl configuration value.
  var assert = chai.assert;
  var ValidationError = salve.ValidationError;
  var Name = salve.Name;

  function onCompletion(p, cb) {
    p.events.addEventListener("state-update", function update(state) {
      if (!(state.state === validator.VALID ||
            state.state === validator.INVALID)) {
        return;
      }
      cb();
    });
  }

  describe("validator", function validatorBlock() {
    var parser = new window.DOMParser();
    var frag = document.createDocumentFragment();
    var empty_tree = document.createElement("div");
    frag.appendChild(empty_tree);
    var empty_data_root = new dloc.DLocRoot(frag);
    var grammar;
    var generic_tree;

    before(function before() {
      grammar = salve.constructTree(schema_text);
      generic_tree = parser.parseFromString(to_parse, "text/xml");
    });

    // Testing possibleAt also tests _validateUpTo because it
    // depends on that function.
    describe("possibleAt", function possibleAt() {
      function makeTest(name, stop_fn, top) {
        it(name, function test() {
          var tree = top || generic_tree.cloneNode(true);
          var p = new validator.Validator(grammar, tree);
          stop_fn(p, tree);
        });
      }

      makeTest("with DLoc", function stop(p) {
        var evs = p.possibleAt(dloc.makeDLoc(empty_data_root, empty_tree, 0));
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "html"))]);
      }, empty_tree);
    });

    // We test speculativelyValidateFragment through speculativelyValidate
    describe("speculativelyValidate", function speculativelyValidate() {
      var p;
      var tree;
      var data_root;

      before(function before() {
        tree = generic_tree.cloneNode(true);
        data_root = new dloc.DLocRoot(tree);
        p = new validator.Validator(grammar, tree);
        p._maxTimespan = 0; // Work forever.
      });

      it("with DLoc", function test() {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        var ret = p.speculativelyValidate(
          dloc.makeDLoc(data_root, container, index), body);
        assert.isFalse(ret);
      });
    });

    // speculativelyValidateFragment is largely tested through
    // speculativelyValidate above.
    describe("speculativelyValidateFragment", function speculativelyValidateF() {
      var p;
      var tree;
      var data_root;

      before(function before() {
        tree = generic_tree.cloneNode(true);
        data_root = new dloc.DLocRoot(tree);
        p = new validator.Validator(grammar, tree);
        p._maxTimespan = 0; // Work forever.
      });

      it("throws an error if toParse is not an element", function test() {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        assert.throws(p.speculativelyValidateFragment.bind(
          p, dloc.makeDLoc(data_root, container, index),
          document.createTextNode("blah")), Error, "toParse is not an element");
      });
    });

    describe("with a mode validator", function modeValidator() {
      var p;
      var tree;
      var validation_error = new ValidationError("Test");

      before(function before() {
        tree = generic_tree.cloneNode(true);
      });

      beforeEach(function beforeEach() {
        function Validator() {}

        Validator.prototype.validateDocument = function validateDocument() {
          return [{
            error: validation_error,
            node: tree,
            index: 0,
          }];
        };

        p = new validator.Validator(grammar, tree, new Validator());
        p._maxTimespan = 0; // Work forever.
      });

      it("records additional errors", function test(done) {
        onCompletion(p, function stopped() {
          assert.equal(p.errors.length, 1);
          assert.equal(p.errors[0].error, validation_error);
          assert.isTrue(p.errors[0].node === tree);
          assert.equal(p.errors[0].index, 0);
          done();
        });
        p.start();
      });

      it("emits additional error events", function test(done) {
        var seen = 0;
        p.events.addEventListener("error", function onError(error) {
          assert.equal(error.error, validation_error);
          assert.isTrue(error.node === tree);
          assert.equal(error.index, 0);
          seen++;
        });
        onCompletion(p, function stopped() {
          assert.equal(seen, 1);
          done();
        });
        p.start();
      });
    });
  });
});

//  LocalWords:  enterStartTag html jQuery Dubeau MPL Mangalam config
//  LocalWords:  RequireJS requirejs subdirectory validator jquery js
//  LocalWords:  chai baseUrl rng
