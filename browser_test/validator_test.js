/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "wed/validator", "salve/validate",
        "wed/mode_validator", "wed/oop"],
function (mocha, chai, validator, validate, mode_validator, oop) {
'use strict';

// The test subdirectory is one of the paths required to be in the config
var schema = '../../../schemas/simplified-rng.js';
// Remember that relative paths are resolved against requirejs'
// baseUrl configuration value.
var to_parse_stack =
        ['../../test-files/validator_test_data/to_parse_converted.xml'];
var assert = chai.assert;
var ValidationError = validate.ValidationError;
describe("validator", function () {
    var parser = new window.DOMParser();
    var frag = document.createDocumentFragment();
    var empty_tree = document.createElement("div");
    frag.appendChild(empty_tree);

    describe("", function () {
        var p;

        function makeValidator(tree) {
            var p = new validator.Validator(schema, tree);
            p._max_timespan = 0; // Work forever.
            return p;
        }

        it("with an empty document", function (done) {
            var p = makeValidator(empty_tree);

            // Manipulate stop so that we know when the work is done.
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal(p._working_state, validator.INVALID);
                assert.equal(p._errors.length, 1);
                assert.equal(p._errors[0].error.toString(),
                             "tag required: {}html");
                done();
            };

            p.start();
        });

        it("triggers error event", function (done) {
            var p = makeValidator(empty_tree);

            // Manipulate stop so that we know when the work is done.
            p.addEventListener("error", function (ev) {
                assert.equal(ev.error.toString(), "tag required: {}html");
                assert.equal(ev.node, empty_tree);
                done();
            });

            p.start();
        });


        it("with actual contents", function (done) {
            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                var tree = parser.parseFromString(data, "application/xml");
                var p = makeValidator(tree);

                // Manipulate stop so that we know when the work is done.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    assert.equal(p._working_state, validator.VALID);
                    assert.equal(p._errors.length, 0);
                    done();
                };

                p.start();
            });
        });

        // This test was added in response to a bug that surfaced when
        // wed moved from HTML to XML for the data tree.
        it("with two namespaces on the same node", function (done) {
            require(["requirejs/text!../../test-files/validator_test_data/" +
                     "multiple_namespaces_on_same_node_converted.xml"],
                    function(data) {
                var tree = parser.parseFromString(data, "application/xml");
                var p = new validator.Validator(
                    "../../../schemas/tei-simplified-rng.js",
                    tree);
                p._max_timespan = 0; // Work forever.

                // Manipulate stop so that we know when the work is done.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    assert.equal(p._working_state, validator.VALID);
                    assert.equal(p._errors.length, 0);
                    done();
                };

                p.start();
            });
        });

        it("percent done", function (done) {
            require(["requirejs/text!../../test-files/" +
                     "validator_test_data/percent_to_parse_converted.xml"],
                    function(data) {
                var tree = parser.parseFromString(data, "application/xml");
                var p = makeValidator(tree);
                p.initialize(function () {
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
        });

        it("restart at", function (done) {
            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                var tree = parser.parseFromString(data, "application/xml");
                var p = makeValidator(tree);
                // Manipulate stop so that we know when the work is done.
                var old_stop = p.stop;
                var first = true;
                p.stop = function () {
                    old_stop.call(p);
                    assert.equal(p._working_state, validator.VALID);
                    assert.equal(p._errors.length, 0);
                    // Deal with first invocation and subsequent
                    // differently.
                    if (first) {
                        first = false;
                        p.restartAt(tree);
                    }
                    else
                        done();
                };
                p.start();
            });
        });

        it("restart at triggers reset-errors event", function (done) {
            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                var tree = parser.parseFromString(data, "application/xml");
                var p = makeValidator(tree);

                // Manipulate stop so that we know when the work is done.
                var old_stop = p.stop;
                var first = true;
                var got_reset = false;
                p.stop = function () {
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
                        assert.equal(got_reset, true);
                        done();
                    }
                };
                p.addEventListener("reset-errors", function (ev) {
                    assert.equal(ev.at, 0);
                    got_reset = true;
                });

                p.start();
            });
        });

        //
        // This test was added to handle problem with the internal state
        // of the validator.
        //
        it("restart at and getErrorsFor", function (done) {
            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                var tree = parser.parseFromString(data, "application/xml");
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
                p.stop = function () {
                    old_stop.call(p);
                    if (times === 0 || times === 2) {
                        assert.equal(p._working_state, validator.VALID);
                        assert.equal(p._errors.length, 0);
                    }
                    // Deal with first invocation and subsequent
                    // differently.
                    if (times === 0) {
                        setTimeout(function () {
                            p.restartAt(tree);
                            p.getErrorsFor(tree.getElementsByTagName("em")[0]);
                            p.restartAt(tree);
                        }, 0);
                    }

                    if (times === 2)
                        done();
                    times++;
                };

                p.start();
            });
        });
    });

    // Testing possibleAt also tests _validateUpTo because it
    // depends on that function.
    describe("possibleAt", function () {
        var data;
        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data_) {
                data = data_;
                done();
            });
        });

        function makeTest(name, stop_fn, top) {
            it(name, function (done) {
                top = top || data;
                var tree = parser.parseFromString(top, "application/xml");
                var p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn(p, tree);
                    done();
                };
                p.start();
            });
        }

        makeTest("empty document, at root", function (p, tree) {
            var evs = p.possibleAt(empty_tree, 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "html")]);
        }, empty_tree);

        makeTest("with actual contents, at root", function (p, tree) {
            var evs = p.possibleAt(tree, 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "html")]);
        });

        makeTest("with actual contents, at end", function (p, tree) {
            var evs = p.possibleAt(tree, 1);
            assert.sameMembers(evs.toArray(), []);
        });

        makeTest("with actual contents, start of html", function (p, tree) {
            var evs = p.possibleAt(tree.getElementsByTagName("html")[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "head")]);
        });

        makeTest("with actual contents, start of head", function (p, tree) {
            var evs = p.possibleAt(tree.getElementsByTagName("head")[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "title")]);
        });

        makeTest("with actual contents, start of title "+
                 "(start of text node)",
                 function (p, tree) {
            var el = tree.getElementsByTagName("title")[0].firstChild;
            // Make sure we know what we are looking at.
            assert.equal(el.nodeType, Node.TEXT_NODE);
            var evs = p.possibleAt(el, 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, index inside text node",
                 function (p, tree) {
            var el = tree.getElementsByTagName("title")[0].firstChild;
            // Make sure we know what we are looking at.
            assert.equal(el.nodeType, Node.TEXT_NODE);
            var evs = p.possibleAt(el, 1);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, end of title", function (p, tree) {
            var title = tree.getElementsByTagName("title")[0];
            var evs = p.possibleAt(title, title.childNodes.length);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, end of head", function (p, tree) {
            var el = tree.getElementsByTagName("head")[0];
            var evs = p.possibleAt(el, el.childNodes.length);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "head")]);
        });

        makeTest("with actual contents, after head", function (p, tree) {
            var el = tree.getElementsByTagName("head")[0];
            var evs = p.possibleAt(
                el.parentNode,
                Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "body")]);
        });
    });

    describe("possibleWhere", function () {
        var data;
        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data_) {
                data = data_;
                done();
            });
        });

        function makeTest(name, stop_fn, top) {
            it(name, function (done) {
                top = top || data;
                var tree = parser.parseFromString(top, "application/xml");
                var p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn(p, tree);
                    done();
                };
                p.start();
            });
        }

        makeTest("multiple locations", function (p, tree) {
            var el = tree.querySelector("body");
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "em"));
            assert.sameMembers(locs, [0, 1, 2, 3]);
        });

        makeTest("no locations", function (p, tree) {
            var el = tree.querySelector("body");
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "impossible"));
            assert.sameMembers(locs, []);
        });

        makeTest("one location", function (p, tree) {
            var el = tree.querySelector("html");
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "body"));
                assert.sameMembers(locs, [2, 3]);
        });

        makeTest("empty element", function (p, tree) {
            var el = tree.querySelector("em em");
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "em"));
                assert.sameMembers(locs, [0]);
        });

    });

    // We test speculativelyValidateFragment through speculativelyValidate
    describe("speculativelyValidate", function () {
        var p, tree;

        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                tree = parser.parseFromString(data, "application/xml");
                p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                done();
            });
        });

        it("does not report errors on valid fragments", function (done) {
            var body = tree.getElementsByTagName("body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
                var ret = p.speculativelyValidate(container, index, body);
                assert.isFalse(ret);
                done();
            });
        });

        it("reports errors on invalid fragments", function (done) {
            var body = tree.getElementsByTagName("body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
                var em = tree.getElementsByTagName("em")[0];
                var ret = p.speculativelyValidate(container, index, em);
                assert.equal(ret.length, 1);
                assert.equal(ret[0].error.toString(),
                             "tag not allowed here: {}em");
                done();
            });
        });

        it("on valid data, does not disturb its validator",
           function (done) {
            var body = tree.getElementsByTagName("body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
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

        it("on invalid data, does not disturb its validator",
           function (done) {
            var body = tree.getElementsByTagName("body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
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

        // An early bug would cause this case to get into an
        // infinite loop.
        it("works fine if the data to validate is only text",
           function (done) {
            var container = tree.getElementsByTagName("em")[0];
            p.initialize(function () {
                var to_parse = document.createTextNode("data");
                var ret = p.speculativelyValidate(container, 0, to_parse);
                assert.isFalse(ret, "fragment is valid");
                done();
            });
        });
    });

    // speculativelyValidateFragment is largely tested through
    // speculativelyValidate above.
    describe("speculativelyValidateFragment", function () {
        var p, tree;

        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                tree = parser.parseFromString(data, "application/xml");
                p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                done();
            });
        });

        it("throws an error if to_parse is not an element", function (done) {
            var body = tree.getElementsByTagName("body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
                assert.Throw(p.speculativelyValidateFragment.bind(
                    p, container, index,
                    document.createTextNode("blah")),
                             Error, "to_parse is not an element");
                done();
            });
        });
    });


    describe("getDocumentNamespaces", function () {
        var p, tree;
        beforeEach(function (done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                tree = parser.parseFromString(data, "application/xml");
                p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                done();
            });
        });

        describe("simple document", function () {
            before(function () {
                to_parse_stack.unshift(
                    '../../test-files/validator_test_data/' +
                        'getDocumentNamespaces1_to_parse_converted.xml');
            });

            after(function () {
                to_parse_stack.shift();
            });

            it("returns the namespaces", function () {
                assert.deepEqual(p.getDocumentNamespaces(),
                                 {"": ["http://www.tei-c.org/ns/1.0"]});
            });
        });

        describe("document with redefined namespaces", function () {
            before(function () {
                to_parse_stack.unshift(
                    '../../test-files/validator_test_data/' +
                        'getDocumentNamespaces_redefined_to_parse' +
                        '_converted.xml');
            });

            after(function () {
                to_parse_stack.shift();
            });

            it("returns the namespaces", function () {
                assert.deepEqual(p.getDocumentNamespaces(),
                                 {"": ["http://www.tei-c.org/ns/1.0"],
                                  "x": ["uri:x", "uri:x2"] });
            });
        });
    });

    describe("getErrorsFor", function () {
        var data;
        beforeEach(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data_) {
                data = data_;
                done();
            });
        });

        function makeTest(name, pre_fn, stop_fn) {
            it(name, function (done) {

                var tree = parser.parseFromString(data, "application/xml");
                pre_fn(tree);

                var p = new validator.Validator(schema, tree);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn(p, tree);
                    done();
                };
                p.start();
            });
        }

        makeTest("with actual contents, no errors", function () {},
                 function (p, tree) {
            assert.equal(p._errors.length, 0, "no errors");
            assert.sameMembers(p.getErrorsFor(
                tree.getElementsByTagName("em")[0]), []);
        });


        makeTest("with actual contents, errors in the tag examined",
                 function (tree) {
            tree.getElementsByTagName("em")[0].innerHTML += "<foo></foo>";
        },
                 function (p, tree) {
            var errors = p.getErrorsFor(tree.getElementsByTagName("em")[0]);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].error.toString(),
                         "tag not allowed here: {}foo");
        });

        makeTest("with actual contents, errors but not in the tag examined",
                 function (tree) {
            tree.getElementsByTagName("em")[0].innerHTML += "<foo></foo>";
        },
                 function (p, tree) {
            var errors = p.getErrorsFor(tree.getElementsByTagName("em")[1]);
            assert.equal(errors.length, 0);
        });


    });

    describe("with a mode validator", function () {
        var p, tree;
        var validation_error = new ValidationError("Test");

        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                tree = parser.parseFromString(data, "application/xml");
                done();
            });
        });

        beforeEach(function () {
            // We create a fake mode because a real mode needs a
            // whole editor, which is very expensive.
            function Validator() {
                mode_validator.ModeValidator.apply(this, arguments);
            }
            oop.inherit(Validator, mode_validator.ModeValidator);

            Validator.prototype.validateDocument = function () {
                return [{
                    error: validation_error,
                    node: tree,
                    index: 0
                }];
            };

            p = new validator.Validator(schema, tree, new Validator());
            p._max_timespan = 0; // Work forever.
        });

        it("records additional errors", function (done) {
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal(p._errors.length, 1);
                assert.equal(p._errors[0].error, validation_error);
                assert.isTrue(p._errors[0].node === tree);
                assert.equal(p._errors[0].index, 0);
                done();
            };
            p.start();
        });

        it("emits additional error events", function (done) {
            var seen = 0;
            p.addEventListener("error", function (error) {
                assert.equal(error.error, validation_error);
                assert.isTrue(error.node === tree);
                assert.equal(error.index, 0);
                seen++;
            });
            var old_stop = p.stop;
            p.stop = function () {
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
