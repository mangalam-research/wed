/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/validator", "salve/validate"],
function (mocha, chai, $, validator, validate) {
'use strict';

// The test subdirectory is one of the paths required to be in the config
var schema = '../../../schemas/simplified-rng.js';
// Remember that relative paths are resolved against requirejs'
// baseUrl configuration value.
var to_parse_stack =
        ['../../test-files/validator_test_data/to_parse_converted.xml'];
var assert = chai.assert;
describe("validator", function () {
    var p;
    var $data = $("#data");
    var $empty_data = $("#empty-data");
    describe("(general)", function () {
        beforeEach(function () {
            $data.empty();
            p = new validator.Validator(schema, $data[0]);
            p._max_timespan = 0; // Work forever.
        });

        after(function () {
            $data.empty();
        });

        it("with an empty document", function (done) {
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
            // Manipulate stop so that we know when the work is done.
            p.addEventListener("error", function (ev) {
                assert.equal(ev.error.toString(), "tag required: {}html");
                assert.equal(ev.node, $data[0]);
                done();
            });

            p.start();
        });


        it("with actual contents", function (done) {
            // Manipulate stop so that we know when the work is done.
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal(p._working_state, validator.VALID);
                assert.equal(p._errors.length, 0);
                done();
            };

            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                $data.html(data);
                p.start();
            });
        });

        it("percent done", function (done) {
            require(["requirejs/text!../../test-files/" +
                     "validator_test_data/percent_to_parse_converted.xml"],
                    function(data) {
                $data.html(data);
                p._max_timespan = 0;
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
                    p.restartAt($data[0]);
                }
                else
                    done();
            };

            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                $data.html(data);
                p.start();
            });
        });

        it("restart at triggers reset-errors event", function (done) {
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
                    p.restartAt($data[0]);
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


            require(["requirejs/text!" + to_parse_stack[0]], function(data) {
                $data.html(data);
                p.start();
            });
        });
    });

    // Testing possibleAt also tests _validateUpTo because it
    // depends on that function.
    describe("possibleAt", function () {
        var p;
        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                done();
            });
        });

        after(function () {
            $data.empty();
        });

        function makeTest(name, stop_fn, $top) {
            $top = $top || $data;
            it(name, function (done) {
                p = new validator.Validator(schema, $top[0]);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn();
                    done();
                };
                p.start();
            });
        }

        makeTest("empty document, at root", function () {
            var evs = p.possibleAt($empty_data[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "html")]);
        }, $empty_data);

        makeTest("with actual contents, at root", function () {
            var evs = p.possibleAt($data[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "html")]);
        });

        makeTest("with actual contents, at end", function () {
            console.log($data[0]);
            var evs = p.possibleAt($data[0], 1);
            assert.sameMembers(evs.toArray(), []);
        });

        makeTest("with actual contents, start of html", function () {
            var evs = p.possibleAt($data.children("._real.html")[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "head")]);
        });

        makeTest("with actual contents, start of head", function () {
            var evs = p.possibleAt($data.find("._real.head")[0], 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "title")]);
        });

        makeTest("with actual contents, start of title "+
                 "(start of text node)",
                 function () {
            var el = $data.find("._real.title")[0].childNodes[0];
            // Make sure we know what we are looking at.
            assert.equal(el.nodeType, Node.TEXT_NODE);
            var evs = p.possibleAt(el, 0);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, index inside text node",
                 function () {
            var el = $data.find("._real.title")[0].childNodes[0];
            // Make sure we know what we are looking at.
            assert.equal(el.nodeType, Node.TEXT_NODE);
            var evs = p.possibleAt(el, 1);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, end of title", function () {
            var title = $data.find("._real.title")[0];
            var evs = p.possibleAt(title, title.childNodes.length);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "title"),
                 new validate.Event("text", "*")]);
        });

        makeTest("with actual contents, end of head", function () {
            var el = $data.find("._real.head")[0];
            var evs = p.possibleAt(el, el.childNodes.length);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("endTag", "", "head")]);
        });

        makeTest("with actual contents, after head", function () {
            var el = $data.find("._real.head")[0];
            var evs = p.possibleAt(
                el.parentNode,
                Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1);
            assert.sameMembers(
                evs.toArray(),
                [new validate.Event("enterStartTag", "", "body")]);
        });
    });

    describe("possibleWhere", function () {
        var p;
        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                done();
            });
        });

        after(function () {
            $data.empty();
        });

        function makeTest(name, stop_fn, $top) {
            $top = $top || $data;
            it(name, function (done) {
                p = new validator.Validator(schema, $top[0]);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn();
                    done();
                };
                p.start();
            });
        }

        makeTest("multiple locations", function () {
            var el = $data.find("._real.body")[0];
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "em"));
            assert.sameMembers(locs, [0, 1, 2, 3]);
        });

        makeTest("no locations", function () {
            var el = $data.find("._real.body")[0];
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "impossible"));
            assert.sameMembers(locs, []);
        });

        makeTest("one location", function () {
            var el = $data.find("._real.html")[0];
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "body"));
                assert.sameMembers(locs, [2, 3]);
        });

        makeTest("empty element", function () {
            var el = $data.find("._real.em ._real.em")[0];
            var locs = p.possibleWhere(el, new validate.Event(
                "enterStartTag", "", "em"));
                assert.sameMembers(locs, [0]);
        });

    });

    // We test speculativelyValidateFragment through speculativelyValidate
    describe("speculativelyValidate", function () {
        var p;

        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                p = new validator.Validator(schema, $data[0]);
                p._max_timespan = 0; // Work forever.
                done();
            });
        });

        after(function () {
            $data.empty();
        });

        it("does not report errors on valid fragments", function (done) {
            var body = $data.find(".body")[0];
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
            var body = $data.find(".body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
                var em = $data.find(".em").first();
                var ret = p.speculativelyValidate(container, index, em);
                assert.equal(ret.length, 1);
                assert.equal(ret[0].error.toString(),
                             "tag not allowed here: {}em");
                done();
            });
        });

        it("on valid data, does not disturb its validator",
           function (done) {
            var body = $data.find(".body")[0];
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
            var body = $data.find(".body")[0];
            var container = body.parentNode;
            var index = Array.prototype.indexOf.call(container.childNodes,
                                                     body);
            p.initialize(function () {
                var em = $data.find(".em").first();
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
            var container = $data.find(".em")[0];
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
        var p;

        before(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                p = new validator.Validator(schema, $data[0]);
                p._max_timespan = 0; // Work forever.
                done();
            });
        });

        after(function () {
            $data.empty();
        });

        it("throws an error if to_parse is not an element", function (done) {
            var body = $data.find(".body")[0];
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
        beforeEach(function (done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                p = new validator.Validator(schema, $data[0]);
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
        var p;
        beforeEach(function(done) {
            require(["requirejs/text!" + to_parse_stack[0]],
                    function(data) {
                $data.html(data);
                done();
            });
        });

        after(function () {
            $data.empty();
        });

        function makeTest(name, pre_fn, stop_fn) {
            it(name, function (done) {

                pre_fn();

                p = new validator.Validator(schema, $data[0]);
                p._max_timespan = 0; // Work forever.
                var old_stop = p.stop;
                p.stop = function () {
                    old_stop.call(p);
                    stop_fn();
                    done();
                };
                p.start();
            });
        }

        makeTest("with actual contents, no errors", function () {},
                 function () {
            assert.equal(p._errors.length, 0, "no errors");
            assert.sameMembers(p.getErrorsFor($data.find(".em")[0]), []);
        });


        makeTest("with actual contents, errors in the tag examined",
                 function () {
            var $em = $data.find(".em").first();
            $em.prepend("<div class='foo _real'></foo>");
        },
                 function () {
            var errors = p.getErrorsFor($data.find(".em")[0]);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].error.toString(),
                         "tag not allowed here: {}foo");
        });

        makeTest("with actual contents, errors but not in the tag examined",
                 function () {
            var $em = $data.find(".em").first();
            $em.prepend("<div class='foo _real'></foo>");
        },
                 function () {
            var errors = p.getErrorsFor($data.find(".em")[1]);
            assert.equal(errors.length, 0);
        });


    });
});

});

//  LocalWords:  enterStartTag html jQuery Dubeau MPL Mangalam config
//  LocalWords:  RequireJS requirejs subdirectory validator jquery js
//  LocalWords:  chai baseUrl rng
