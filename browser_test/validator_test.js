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
  var mode_validator = require("wed/mode_validator");
  var oop = require("wed/oop");
  var domutil = require("wed/domutil");
  var schema_text = require("text!../../build/schemas/simplified-rng.js");
  var tei_schema_text = require(
    "text!../../build/schemas/tei-simplified-rng.js");

  // Do not break the string in the next line. RequireJS cannot perform analysis
  // of expressions.
  var multiple_namespaces =
        require("text!test-files/validator_test_data/multiple_namespaces_on_same_node_converted.xml");
  var percent_to_parse =
        require(
          "text!test-files/validator_test_data/percent_to_parse_converted.xml");

  // Remember that relative paths are resolved against requirejs'
  // baseUrl configuration value.
  var to_parse_stack = ["test-files/validator_test_data/to_parse_converted.xml"];
  var assert = chai.assert;
  var ValidationError = salve.ValidationError;
  var Name = salve.Name;
  var isAttr = domutil.isAttr;

  describe("validator", function validatorBlock() {
    var parser = new window.DOMParser();
    var frag = document.createDocumentFragment();
    var empty_tree = document.createElement("div");
    frag.appendChild(empty_tree);
    var grammar;
    var generic_tree;
    var multiple_namespaces_tree;
    var percent_to_parse_tree;

    before(function before(done) {
      grammar = salve.constructTree(schema_text);
      multiple_namespaces_tree = parser.parseFromString(multiple_namespaces,
                                                        "text/xml");
      percent_to_parse_tree = parser.parseFromString(percent_to_parse,
                                                     "text/xml");
      require(["text!" + to_parse_stack[0]], function loaded(data) {
        generic_tree = parser.parseFromString(data, "text/xml");
        done();
      });
    });

    describe("", function firstBlock() {
      function makeValidator(tree) {
        var p = new validator.Validator(grammar, tree);
        p._max_timespan = 0; // Work forever.
        return p;
      }

      it("with an empty document", function test(done) {
        var p = makeValidator(empty_tree);

        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._working_state, validator.INVALID);
          assert.equal(p._errors.length, 1);
          assert.equal(p._errors[0].error.toString(),
                       "tag required: {\"ns\":\"\",\"name\":\"html\"}");
          done();
        };

        p.start();
      });

      it("emits error event", function test(done) {
        var p = makeValidator(empty_tree);

        // Manipulate stop so that we know when the work is done.
        p.addEventListener("error", function error(ev) {
          assert.equal(ev.error.toString(),
                       "tag required: {\"ns\":\"\",\"name\":\"html\"}");
          assert.equal(ev.node, empty_tree);
          done();
        });

        p.start();
      });


      it("with actual contents", function test(done) {
        var p = makeValidator(generic_tree.cloneNode(true));

        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._working_state, validator.VALID);
          assert.equal(p._errors.length, 0);
          done();
        };

        p.start();
      });

      // This test was added in response to a bug that surfaced when
      // wed moved from HTML to XML for the data tree.
      it("with two namespaces on the same node", function test(done) {
        var tree = multiple_namespaces_tree.cloneNode(true);
        var tei_grammar = salve.constructTree(tei_schema_text);
        var p = new validator.Validator(tei_grammar, tree);
        p._max_timespan = 0; // Work forever.

        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._working_state, validator.VALID);
          assert.equal(p._errors.length, 0);
          done();
        };

        p.start();
      });

      it("percent done", function test(done) {
        var tree = percent_to_parse_tree.cloneNode(true);
        var p = makeValidator(tree);
        p.initialize(function initialized() {
          p._cycle(); // <html>
          assert.equal(p._part_done, 0);
          p._cycle(); // <head>
          assert.equal(p._part_done, 0);
          p._cycle(); // <title>
          assert.equal(p._part_done, 0);
          p._cycle(); // <title>
          assert.equal(p._part_done, 0.5);
          p._cycle(); // </head>
          assert.equal(p._part_done, 0.5);
          p._cycle(); // <body>
          assert.equal(p._part_done, 0.5);
          p._cycle(); // <em>
          assert.equal(p._part_done, 0.5);
          p._cycle(); // </em>
          assert.equal(p._part_done, 0.75);
          p._cycle(); // <em>
          assert.equal(p._part_done, 0.75);
          p._cycle(); // <em>
          assert.equal(p._part_done, 0.75);
          p._cycle(); // </em>
          assert.equal(p._part_done, 0.875);
          p._cycle(); // <em>
          assert.equal(p._part_done, 0.875);
          p._cycle(); // </em>
          assert.equal(p._part_done, 1);
          p._cycle(); // </em>
          assert.equal(p._part_done, 1);
          p._cycle(); // </body>
          assert.equal(p._part_done, 1);
          p._cycle(); // </html>
          assert.equal(p._part_done, 1);
          p._cycle(); // end
          assert.equal(p._part_done, 1);
          assert.equal(p._working_state, validator.VALID);
          assert.equal(p._errors.length, 0);
          done();
        });
      });

      it("restart at", function test(done) {
        var tree = generic_tree.cloneNode(true);
        var p = makeValidator(tree);
        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;
        var first = true;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._working_state, validator.VALID);
          assert.equal(p._errors.length, 0);
          // Deal with first invocation and subsequent
          // differently.
          if (first) {
            first = false;
            p.restartAt(tree);
          }
          else {
            done();
          }
        };
        p.start();
      });

      it("restart at triggers reset-errors event", function test(done) {
        var tree = generic_tree.cloneNode(true);
        var p = makeValidator(tree);

        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;
        var first = true;
        var got_reset = false;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._working_state, validator.VALID);
          assert.equal(p._errors.length, 0);
          // Deal with first invocation and subsequent differently.
          if (first) {
            first = false;
            p.restartAt(tree);
          }
          else {
            assert.equal(got_reset, true);
            done();
          }
        };
        p.addEventListener("reset-errors", function reset(ev) {
          assert.equal(ev.at, 0);
          got_reset = true;
        });

        p.start();
      });

      //
      // This test was added to handle problem with the internal state of the
      // validator.
      //
      it("restart at and getErrorsFor", function test(done) {
        var tree = generic_tree.cloneNode(true);
        var p = makeValidator(tree);
        // Manipulate stop so that we know when the work is done.
        var old_stop = p.stop;

        var times = 0;

        //
        // This method will be called 3 times:
        // - Once upon first validation.
        // - Second when p.restartAt is called a second time.
        // - Third upon final validation.
        //
        p.stop = function stop() {
          old_stop.call(p);
          if (times === 0 || times === 2) {
            assert.equal(p._working_state, validator.VALID);
            assert.equal(p._errors.length, 0);
          }
          // Deal with first invocation and subsequent
          // differently.
          if (times === 0) {
            setTimeout(function timeout() {
              p.restartAt(tree);
              p.getErrorsFor(tree.getElementsByTagName("em")[0]);
              p.restartAt(tree);
            }, 0);
          }

          if (times === 2) {
            done();
          }
          times++;
        };

        p.start();
      });
    });

    describe("", function secondBlock() {
      var data;
      before(function before(done) {
        to_parse_stack.unshift(
          "test-files/validator_test_data/wildcard_converted.xml");
        require(["text!" + to_parse_stack[0]], function loaded(data_) {
          data = data_;
          done();
        });
      });

      after(function after() {
        to_parse_stack.shift();
      });

      function makeValidator() {
        var tree = parser.parseFromString(data, "application/xml");
        var p = new validator.Validator(grammar, tree);
        p._max_timespan = 0; // Work forever.
        return p;
      }

      it("emits correct possible-due-to-wildcard-change events",
         function test(done) {
           // Manipulate stop so that we know when the work is done.
           var p = makeValidator();
           var count = 0;
           p.addEventListener(
             "possible-due-to-wildcard-change",
             function possible(node) {
               assert.isTrue(node.nodeType === Node.ELEMENT_NODE ||
                             isAttr(node));
               assert.isDefined(node.wed_possible_due_to_wildcard);
               if (node.nodeType === Node.ELEMENT_NODE) {
                 if (node.tagName === "foo:bar") {
                   assert.isTrue(node.wed_possible_due_to_wildcard);
                 }
                 else {
                   assert.isFalse(node.wed_possible_due_to_wildcard);
                 }
               }
               else if (node.name === "foo:baz" || node.name === "baz") {
                 assert.isTrue(node.wed_possible_due_to_wildcard);
               }
               else {
                 assert.isFalse(node.wed_possible_due_to_wildcard);
               }
               count++;
             });

           var old_stop = p.stop;
           p.stop = function stop() {
             old_stop.call(p);
             assert.equal(count, 11);
             done();
           };
           p.start();
         });
    });

    // Testing possibleAt also tests _validateUpTo because it
    // depends on that function.
    describe("possibleAt", function possibleAt() {
      function makeTest(name, stop_fn, top) {
        it(name, function test(done) {
          var tree = top || generic_tree.cloneNode(true);
          var p = new validator.Validator(grammar, tree);
          p.initialize(function initialized() {
            stop_fn(p, tree);
            done();
          });
        });
      }

      makeTest("empty document, at root", function stop(p) {
        var evs = p.possibleAt(empty_tree, 0);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "html"))]);
      }, empty_tree);

      makeTest("with actual contents, at root", function stop(p, tree) {
        var evs = p.possibleAt(tree, 0);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "html"))]);
      });

      makeTest("with actual contents, at end", function stop(p, tree) {
        var evs = p.possibleAt(tree, 1);
        assert.sameMembers(evs.toArray(), []);
      });

      makeTest("with actual contents, start of html", function stop(p, tree) {
        var evs = p.possibleAt(tree.getElementsByTagName("html")[0], 0);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "head"))]);
      });

      makeTest("with actual contents, start of head", function stop(p, tree) {
        var evs = p.possibleAt(tree.getElementsByTagName("head")[0], 0);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "title"))]);
      });

      makeTest("with actual contents, start of title (start of text node)",
               function stop(p, tree) {
                 var el = tree.getElementsByTagName("title")[0].firstChild;
                 // Make sure we know what we are looking at.
                 assert.equal(el.nodeType, Node.TEXT_NODE);
                 var evs = p.possibleAt(el, 0);
                 assert.sameMembers(
                   evs.toArray(),
                   [new salve.Event("endTag", new Name("", "", "title")),
                     new salve.Event("text", /^.*$/)]);
               });

      makeTest("with actual contents, index inside text node",
               function stop(p, tree) {
                 var el = tree.getElementsByTagName("title")[0].firstChild;
                 // Make sure we know what we are looking at.
                 assert.equal(el.nodeType, Node.TEXT_NODE);
                 var evs = p.possibleAt(el, 1);
                 assert.sameMembers(
                   evs.toArray(),
                   [new salve.Event("endTag", new Name("", "", "title")),
                     new salve.Event("text", /^.*$/)]);
               });

      makeTest("with actual contents, end of title", function stop(p, tree) {
        var title = tree.getElementsByTagName("title")[0];
        var evs = p.possibleAt(title, title.childNodes.length);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("endTag", new Name("", "", "title")),
            new salve.Event("text", /^.*$/)]);
      });

      makeTest("with actual contents, end of head", function stop(p, tree) {
        var el = tree.getElementsByTagName("head")[0];
        var evs = p.possibleAt(el, el.childNodes.length);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("endTag", new Name("", "", "head"))]);
      });

      makeTest("with actual contents, after head", function stop(p, tree) {
        var el = tree.getElementsByTagName("head")[0];
        var evs = p.possibleAt(
          el.parentNode,
          Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1);
        assert.sameMembers(
          evs.toArray(),
          [new salve.Event("enterStartTag", new Name("", "", "body"))]);
      });

      makeTest("with actual contents, attributes on root",
               function stop(p, tree) {
                 var evs = p.possibleAt(tree, 0, true);
                 assert.sameMembers(evs.toArray(),
                                    [new salve.Event("leaveStartTag")]);
               });
      makeTest("with actual contents, attributes on element",
               function stop(p, tree) {
                 var el = tree.getElementsByTagName("head")[0];
                 var evs = p.possibleAt(
                   el.parentNode,
                   Array.prototype.indexOf.call(el.parentNode.childNodes, el),
                   true);
                 assert.sameMembers(evs.toArray(),
                                    [new salve.Event("leaveStartTag")]);
               });
    });

    describe("_getWalkerAt", function _getWalkerAt() {
      function makeTest(name, stop_fn, top) {
        it(name, function test(done) {
          var tree = top || generic_tree.cloneNode(true);
          var p = new validator.Validator(grammar, tree);
          p.initialize(function initialized() {
            try {
              stop_fn(p, tree);
              done();
            }
            catch (e) {
              done(e);
            }
          });
        });
      }

      describe("returns correct walker", function correctWalker() {
        makeTest("empty document, at root", function stop(p, tree) {
          var walker = p._getWalkerAt(tree, 0, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("enterStartTag", new Name("", "", "html"))]);
        }, empty_tree);

        makeTest("with actual contents, at root", function stop(p, tree) {
          var walker = p._getWalkerAt(tree, 0, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("enterStartTag", new Name("", "", "html"))]);
        });

        makeTest("with actual contents, at end", function stop(p, tree) {
          var walker = p._getWalkerAt(tree, -1, false);
          var evs = walker.possible();
          assert.sameMembers(evs.toArray(), []);
        });

        makeTest("with actual contents, start of html", function stop(p, tree) {
          var walker = p._getWalkerAt(tree.getElementsByTagName("html")[0],
                                      0, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("enterStartTag", new Name("", "", "head"))]);
        });

        makeTest("with actual contents, start of head", function stop(p, tree) {
          var walker = p._getWalkerAt(tree.getElementsByTagName("head")[0],
                                      0, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("enterStartTag", new Name("", "", "title"))]);
        });

        makeTest("with actual contents, start of title (start of text node)",
                 function stop(p, tree) {
                   var el = tree.getElementsByTagName("title")[0].firstChild;
                   // Make sure we know what we are looking at.
                   assert.equal(el.nodeType, Node.TEXT_NODE);
                   var walker = p._getWalkerAt(el, 0, false);
                   var evs = walker.possible();
                   assert.sameMembers(
                     evs.toArray(),
                     [new salve.Event("endTag", new Name("", "", "title")),
                       new salve.Event("text", /^.*$/)]);
                 });

        makeTest("with actual contents, index inside text node",
                 function stop(p, tree) {
                   var el = tree.getElementsByTagName("title")[0].firstChild;
                   // Make sure we know what we are looking at.
                   assert.equal(el.nodeType, Node.TEXT_NODE);
                   var walker = p._getWalkerAt(el, 1, false);
                   var evs = walker.possible();
                   assert.sameMembers(
                     evs.toArray(),
                     [new salve.Event("endTag", new Name("", "", "title")),
                       new salve.Event("text", /^.*$/)]);
                 });

        makeTest("with actual contents, end of title", function stop(p, tree) {
          var title = tree.getElementsByTagName("title")[0];
          var walker = p._getWalkerAt(title, title.childNodes.length, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("endTag", new Name("", "", "title")),
              new salve.Event("text", /^.*$/)]);
        });

        makeTest("with actual contents, end of head", function stop(p, tree) {
          var el = tree.getElementsByTagName("head")[0];
          var walker = p._getWalkerAt(el, el.childNodes.length, false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("endTag", new Name("", "", "head"))]);
        });

        makeTest("with actual contents, after head", function stop(p, tree) {
          var el = tree.getElementsByTagName("head")[0];
          var walker = p._getWalkerAt(
            el.parentNode,
            Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1,
            false);
          var evs = walker.possible();
          assert.sameMembers(
            evs.toArray(),
            [new salve.Event("enterStartTag", new Name("", "", "body"))]);
        });

        makeTest("with actual contents, attributes on root",
                 function stop(p, tree) {
                   var walker = p._getWalkerAt(tree, 0, true);
                   var evs = walker.possible();
                   assert.sameMembers(evs.toArray(),
                                      [new salve.Event("leaveStartTag")]);
                 });

        makeTest("with actual contents, attributes on element",
                 function stop(p, tree) {
                   var el = tree.getElementsByTagName("head")[0];
                   var walker = p._getWalkerAt(
                     el.parentNode,
                     Array.prototype.indexOf.call(el.parentNode.childNodes, el),
                     true);
                   var evs = walker.possible();
                   assert.sameMembers(evs.toArray(),
                                      [new salve.Event("leaveStartTag")]);
                 });
      });

      describe("handles namespace attributes", function handlesNamespaceAttrs() {
        var data;
        before(function before(done) {
          to_parse_stack.unshift(
            "test-files/validator_test_data/" +
              "multiple_namespaces_on_same_node_converted.xml");
          require(["text!" + to_parse_stack[0]], function loaded(data_) {
            data = data_;
            done();
          });
        });

        after(function after() {
          to_parse_stack.shift();
        });

        // eslint-disable-next-line no-shadow
        function makeTest(name, stop_fn, top) {
          it(name, function test(done) {
            var tree = top || parser.parseFromString(data, "application/xml");
            var tei_grammar = salve.constructTree(tei_schema_text);
            var p = new validator.Validator(tei_grammar, tree);
            p.initialize(function initialized() {
              try {
                stop_fn(p, tree);
                done();
              }
              catch (e) {
                done(e);
              }
            });
          });
        }

        makeTest("up to an xmlns node", function stop(p, tree) {
          // This tests that validating up to an xmlns attribute
          // is not causing an error.
          var el = tree.getElementsByTagName("TEI")[0];
          var attribute = el.attributes.xmlns;
          var walker = p._getWalkerAt(attribute, 0, false);
          walker.possible();
          assert.equal(p._errors.length, 0);
        });

        makeTest("up to an xmlns:... node", function stop(p, tree) {
          // This tests that validating up to an xmlns:... attribute
          // is not causing an error.
          var el = tree.getElementsByTagName("TEI")[0];
          var attribute = el.attributes["xmlns:foo"];
          var walker = p._getWalkerAt(attribute, 0, false);
          walker.possible();
          assert.equal(p._errors.length, 0);
        });
      });

      describe("caches", function caches() {
        var data;
        var data_tree;
        before(function before(done) {
          to_parse_stack.unshift("test-files/validator_test_data/" +
                                 "caching_to_parse_converted.xml");
          require(["text!" + to_parse_stack[0]], function loaded(data_) {
            data = data_;
            data_tree = parser.parseFromString(data, "text/xml");
            done();
          });
        });

        after(function after() {
          to_parse_stack.shift();
        });

        // eslint-disable-next-line no-shadow
        function makeTest(name, stop_fn, top) {
          it(name, function test(done) {
            var tree = top || data_tree.cloneNode(true);
            var p = new validator.Validator(grammar, tree);
            p.initialize(function initialized() {
              try {
                assert.equal(Object.keys(p._walker_cache).length, 0);
                assert.equal(p._walker_cache_max, -1);
                stop_fn(p, tree);
                done();
              }
              catch (e) {
                done(e);
              }
            });
          });
        }

        makeTest("but not at the first position", function stop(p, tree) {
          // There is no point in caching the very first position in the
          // document, as creating a new walker is as fast or perhaps faster
          // than cloning a walker.

          p._getWalkerAt(tree, 0, false);
          assert.equal(p._walker_cache_max, -1);
          assert.equal(Object.keys(p._walker_cache).length, 0);
        }, empty_tree);

        makeTest("but not the final location", function stop(p, tree) {
          p._getWalkerAt(tree, -1, false);
          assert.equal(p._walker_cache_max, -1);
          assert.equal(Object.keys(p._walker_cache).length, 0);
        });

        makeTest("some walker (element)", function stop(p, tree) {
          var initial_max = p._walker_cache_max;
          var el = tree.getElementsByTagName("em")[100];
          var walker = p._getWalkerAt(el, 0, false);
          assert.isTrue(p._walker_cache_max > initial_max);
          assert.equal(Object.keys(p._walker_cache).length, 1);
          assert.equal(walker, p._getWalkerAt(el, 0, false));
        });

        makeTest("does not cache walkers that are too close (element)",
                 function stop(p, tree) {
                   var initial_max = p._walker_cache_max;
                   var el = tree.getElementsByTagName("em")[100];
                   p._getWalkerAt(el, 0, false);
                   var max_after_first = p._walker_cache_max;
                   assert.isTrue(max_after_first > initial_max);
                   assert.equal(Object.keys(p._walker_cache).length, 1);
                   // It won't cache this walker because it is too close
                   // to the previous one.
                   p._getWalkerAt(el, 1, false);
                   assert.equal(max_after_first, p._walker_cache_max);
                   assert.equal(Object.keys(p._walker_cache).length, 1);
                 });

        makeTest("some walker (text)", function stop(p, tree) {
          var initial_max = p._walker_cache_max;
          var el = tree.getElementsByTagName("em")[100];
          assert.equal(el.firstChild.nodeType, Node.TEXT_NODE);
          var walker = p._getWalkerAt(el.firstChild, 0, false);
          assert.isTrue(p._walker_cache_max > initial_max);
          assert.equal(Object.keys(p._walker_cache).length, 1);
          assert.equal(walker, p._getWalkerAt(el.firstChild, 0, false));
        });


        makeTest("does not cache walkers that are too close (text)",
                 function stop(p, tree) {
                   var initial_max = p._walker_cache_max;
                   var el = tree.getElementsByTagName("em")[100];
                   assert.equal(el.firstChild.nodeType, Node.TEXT_NODE);
                   p._getWalkerAt(el.firstChild, 0, false);
                   var max_after_first = p._walker_cache_max;
                   assert.isTrue(max_after_first > initial_max);
                   assert.equal(Object.keys(p._walker_cache).length, 1);
                   // It won't cache this walker because it is too close to the
                   // previous one.
                   p._getWalkerAt(el.firstChild, 1, false);
                   assert.equal(max_after_first, p._walker_cache_max);
                   assert.equal(Object.keys(p._walker_cache).length, 1);
                 });

        makeTest("some walker (attribute)", function stop(p, tree) {
          var initial_max = p._walker_cache_max;
          var el = tree.getElementsByTagName("em")[100];
          var attr = el.attributes.foo;
          assert.isDefined(attr);
          p._getWalkerAt(attr, 0, false);
          assert.isTrue(p._walker_cache_max > initial_max);
          assert.equal(Object.keys(p._walker_cache).length, 1);
          // Even though caching was used, the walker won't be the same.
          // assert.equal(walker, p._getWalkerAt(attr, 0, false));
        });
      });
    });

    describe("possibleWhere", function possibleWhere() {
      function makeTest(name, stop_fn) {
        it(name, function test(done) {
          var tree = generic_tree.cloneNode(true);
          var p = new validator.Validator(grammar, tree);
          p._max_timespan = 0; // Work forever.
          var old_stop = p.stop;
          p.stop = function stop() {
            old_stop.call(p);
            stop_fn(p, tree);
            done();
          };
          p.start();
        });
      }

      makeTest("multiple locations", function stop(p, tree) {
        var el = tree.querySelector("body");
        var locs = p.possibleWhere(el, new salve.Event(
          "enterStartTag", new Name("", "", "em")));
        assert.sameMembers(locs, [0, 1, 2, 3]);
      });

      makeTest("no locations", function stop(p, tree) {
        var el = tree.querySelector("title");
        var locs = p.possibleWhere(el, new salve.Event(
          "enterStartTag", new Name("", "", "impossible")));
        assert.sameMembers(locs, []);
      });

      makeTest("one location", function stop(p, tree) {
        var el = tree.querySelector("html");
        var locs = p.possibleWhere(el, new salve.Event(
          "enterStartTag", new Name("", "", "body")));
        assert.sameMembers(locs, [2, 3]);
      });

      makeTest("empty element", function stop(p, tree) {
        var el = tree.querySelector("em em");
        var locs = p.possibleWhere(el, new salve.Event(
          "enterStartTag", new Name("", "", "em")));
        assert.sameMembers(locs, [0]);
      });

      makeTest("match due to wildcard", function stop(p, tree) {
        var el = tree.querySelector("body");
        // The way the schema is structured, the following element can match
        // only due to a wildcard. So the code of possibleWhere has to check
        // every possibility one by one rather than use ``.has`` on the event
        // set.
        var locs = p.possibleWhere(el, new salve.Event(
          "enterStartTag", new Name("", "uri", "foreign")));
        assert.sameMembers(locs, [1, 2, 3]);
      });
    });

    // We test speculativelyValidateFragment through speculativelyValidate
    describe("speculativelyValidate", function speculativelyValidate() {
      var p;
      var tree;

      before(function before() {
        tree = generic_tree.cloneNode(true);
        p = new validator.Validator(grammar, tree);
        p._max_timespan = 0; // Work forever.
      });

      it("does not report errors on valid fragments", function test(done) {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        p.initialize(function initialized() {
          var ret = p.speculativelyValidate(container, index, body);
          assert.isFalse(ret);
          done();
        });
      });

      it("reports errors on invalid fragments", function test(done) {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        p.initialize(function initialized() {
          var em = tree.getElementsByTagName("em")[0];
          var ret = p.speculativelyValidate(container, index, em);
          assert.equal(ret.length, 1);
          assert.equal(ret[0].error.toString(),
                       "tag not allowed here: {\"ns\":\"\",\"name\":\"em\"}");
          done();
        });
      });

      it("on valid data, does not disturb its validator", function test(done) {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        p.initialize(function initialized() {
          var ret = p.speculativelyValidate(container, index, body);
          assert.isFalse(ret);
          assert.equal(p._errors.length, 0,
                       "no errors after speculativelyValidate");

          p._resetTo(container);
          p._validateUpTo(container, -1);
          assert.equal(p._errors.length, 0,
                       "no errors after subsequent validation");
          done();
        });
      });

      it("on invalid data, does not disturb its validator", function test(done) {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        p.initialize(function initialized() {
          var em = tree.getElementsByTagName("em")[0];
          var ret = p.speculativelyValidate(container, index, em);
          assert.equal(ret.length, 1, "the fragment is invalid");
          // No errors after.
          assert.equal(p._errors.length, 0,
                       "no errors after speculativelyValidate");

          p._resetTo(container);
          p._validateUpTo(container, -1);
          // Does not cause subsequent errors when the
          // validator validates.
          assert.equal(p._errors.length, 0,
                       "no errors after subsequent validation");
          done();
        });
      });

      // An early bug would cause this case to get into an infinite loop.
      it("works fine if the data to validate is only text", function test(done) {
        var container = tree.getElementsByTagName("em")[0];
        p.initialize(function initialized() {
          var to_parse = container.ownerDocument.createTextNode("data");
          var ret = p.speculativelyValidate(container, 0, to_parse);
          assert.isFalse(ret, "fragment is valid");
          done();
        });
      });
    });

    // speculativelyValidateFragment is largely tested through
    // speculativelyValidate above.
    describe("speculativelyValidateFragment", function speculativelyValidateF() {
      var p;
      var tree;

      before(function before() {
        tree = generic_tree.cloneNode(true);
        p = new validator.Validator(grammar, tree);
        p._max_timespan = 0; // Work forever.
      });

      it("throws an error if to_parse is not an element", function test(done) {
        var body = tree.getElementsByTagName("body")[0];
        var container = body.parentNode;
        var index = Array.prototype.indexOf.call(container.childNodes, body);
        p.initialize(function initialized() {
          assert.throws(p.speculativelyValidateFragment.bind(
            p, container, index,
            document.createTextNode("blah")),
                       Error, "to_parse is not an element");
          done();
        });
      });
    });


    describe("getDocumentNamespaces", function getDocumentNamespaces() {
      var p;
      var tree;
      beforeEach(function beforeEach(done) {
        require(["text!" + to_parse_stack[0]], function loaded(data) {
          tree = parser.parseFromString(data, "application/xml");
          p = new validator.Validator(grammar, tree);
          p._max_timespan = 0; // Work forever.
          done();
        });
      });

      describe("simple document", function simpleDoc() {
        before(function before() {
          to_parse_stack.unshift(
            "test-files/validator_test_data/" +
              "getDocumentNamespaces1_to_parse_converted.xml");
        });

        after(function after() {
          to_parse_stack.shift();
        });

        it("returns the namespaces", function test() {
          assert.deepEqual(p.getDocumentNamespaces(),
                           { "": ["http://www.tei-c.org/ns/1.0"] });
        });
      });

      describe("document with redefined namespaces", function redefinedNS() {
        before(function before() {
          to_parse_stack.unshift("test-files/validator_test_data/" +
                                 "getDocumentNamespaces_redefined_to_parse" +
                                 "_converted.xml");
        });

        after(function after() {
          to_parse_stack.shift();
        });

        it("returns the namespaces", function test() {
          assert.deepEqual(p.getDocumentNamespaces(), {
            "": ["http://www.tei-c.org/ns/1.0"],
            x: ["uri:x", "uri:x2"],
          });
        });
      });
    });

    describe("getErrorsFor", function getErrorsFor() {
      function makeTest(name, pre_fn, stop_fn) {
        it(name, function test(done) {
          var tree = generic_tree.cloneNode(true);
          pre_fn(tree);

          var p = new validator.Validator(grammar, tree);
          p._max_timespan = 0; // Work forever.
          var old_stop = p.stop;
          p.stop = function stop() {
            old_stop.call(p);
            stop_fn(p, tree);
            done();
          };
          p.start();
        });
      }

      makeTest("with actual contents, no errors", function pre() {},
               function stop(p, tree) {
                 assert.equal(p._errors.length, 0, "no errors");
                 assert.sameMembers(p.getErrorsFor(
                   tree.getElementsByTagName("em")[0]), []);
               });


      makeTest("with actual contents, errors in the tag examined",
               function pre(tree) {
                 var el = tree.getElementsByTagName("em")[0];
                 el.appendChild(el.ownerDocument.createElement("foo"));
               },
               function stop(p, tree) {
                 var errors = p.getErrorsFor(tree.getElementsByTagName("em")[0]);
                 assert.equal(errors.length, 1);
                 assert.equal(
                   errors[0].error.toString(),
                   "tag not allowed here: {\"ns\":\"\",\"name\":\"foo\"}");
               });

      makeTest("with actual contents, errors but not in the tag examined",
               function pre(tree) {
                 var el = tree.getElementsByTagName("em")[0];
                 el.appendChild(el.ownerDocument.createElement("foo"));
               },
               function stop(p, tree) {
                 var errors = p.getErrorsFor(tree.getElementsByTagName("em")[1]);
                 assert.equal(errors.length, 0);
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
        // We create a fake mode because a real mode needs a
        // whole editor, which is very expensive.
        function Validator() {
          mode_validator.ModeValidator.apply(this, arguments);
        }
        oop.inherit(Validator, mode_validator.ModeValidator);

        Validator.prototype.validateDocument = function validateDocument() {
          return [{
            error: validation_error,
            node: tree,
            index: 0,
          }];
        };

        p = new validator.Validator(grammar, tree, new Validator());
        p._max_timespan = 0; // Work forever.
      });

      it("records additional errors", function test(done) {
        var old_stop = p.stop;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(p._errors.length, 1);
          assert.equal(p._errors[0].error, validation_error);
          assert.isTrue(p._errors[0].node === tree);
          assert.equal(p._errors[0].index, 0);
          done();
        };
        p.start();
      });

      it("emits additional error events", function test(done) {
        var seen = 0;
        p.addEventListener("error", function onError(error) {
          assert.equal(error.error, validation_error);
          assert.isTrue(error.node === tree);
          assert.equal(error.index, 0);
          seen++;
        });
        var old_stop = p.stop;
        p.stop = function stop() {
          old_stop.call(p);
          assert.equal(seen, 1);
          done();
        };
        p.start();
      });
    });
  });
});

//  LocalWords:  enterStartTag html jQuery Dubeau MPL Mangalam config
//  LocalWords:  RequireJS requirejs subdirectory validator jquery js
//  LocalWords:  chai baseUrl rng
