define(["mocha/mocha", "chai", "jquery", "wed/validator",
        "wed/util", "salve/validate", "wed/domlistener",
        "wed/modes/generic/generic", "wed/transformation"],
function (mocha, chai, $, validator, util, validate,
          domlistener, generic, transformation) {
    // The test subirectory is one of the paths required to be in the config
    var schema = 'test/simplified-rng.js';
    // Remember that relative paths are resolved against requirejs'
    // baseUrl configuration value.
    var to_parse =
            '../../test-files/validator_test_data/to_parse_converted.xml';
    var assert = chai.assert;
    describe("validator", function () {
        var p;
        var $data = $("#data");
        beforeEach(function () {
            $data.empty();
            p = new validator.Validator(schema,
                                        $data.get(0));
            p._max_timespan = 0; // Work forever.
        });

        afterEach(function () {
            $data.empty();
            p = undefined;
        });

        it("with an empty document", function (done) {
            // Manipulate stop so that we know when the work is done.
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal(p._working_state, validator.INVALID);
                assert.equal(p._errors.length, 1);
                assert.equal(p._errors[0].toString(),
                             "tag required: {}html");
                done();
            };

            p.start();
        });

        it("triggers error event", function (done) {
            // Manipulate stop so that we know when the work is done.
            p.addEventListener("error", function (ev) {
                assert.equal(ev.error.toString(),
                             "tag required: {}html");
                assert.equal(ev.element, $data.get(0));
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

            require(["requirejs/text!" + to_parse], function(data) {
                $data.html(data);
                p.start();
            });
        });

        it("precent done", function (done) {
            require(["requirejs/text!../../test-files/validator_test_data/percent_to_parse_converted.xml"],
                    function(data) {
                        $data.html(data);
                        p._max_timespan = 0;
                        p._max_cycles = 1;
                        p.initialize(function () {
                            p._work(); // <html>
                            assert.equal(p._part_done, 0);
                            p._work(); // <head>
                            assert.equal(p._part_done, 0);
                            p._work(); // <title>
                            assert.equal(p._part_done, 0);
                            p._work(); // <title>
                            assert.equal(p._part_done, 0.5);
                            p._work(); // </head>
                            assert.equal(p._part_done, 0.5);
                            p._work(); // <body>
                            assert.equal(p._part_done, 0.5);
                            p._work(); // <em>
                            assert.equal(p._part_done, 0.5);
                            p._work(); // </em>
                            assert.equal(p._part_done, 0.75);
                            p._work(); // <em>
                            assert.equal(p._part_done, 0.75);
                            p._work(); // <em>
                            assert.equal(p._part_done, 0.75);
                            p._work(); // </em>
                            assert.equal(p._part_done, 0.875);
                            p._work(); // <em>
                            assert.equal(p._part_done, 0.875);
                            p._work(); // </em>
                            assert.equal(p._part_done, 1);
                            p._work(); // </em>
                            assert.equal(p._part_done, 1);
                            p._work(); // </body>
                            assert.equal(p._part_done, 1);
                            p._work(); // </html>
                            assert.equal(p._part_done, 1);
                            p._work(); // end
                            assert.equal(p._part_done, 1);
                            assert.equal(p._working_state,
                                         validator.VALID);
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
                    p.restartAt($data.get(0));
                    first = false;
                    }
                else
                    done();
            };

            require(["requirejs/text!" + to_parse], function(data) {
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
                    p.restartAt($data.get(0));
                    first = false;
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


            require(["requirejs/text!" + to_parse], function(data) {
                $data.html(data);
                p.start();
            });
        });

        describe("possibleAt", function () {
            var p;
            beforeEach(function () {
                $data.empty();
                p = new validator.Validator(schema,
                                            $data.get(0));
                p._max_timespan = 0; // Work forever.
            });

            afterEach(function () {
                $data.empty();
                p = undefined;
            });

            function makeTest(name, stop_fn, no_load) {
                it(name, function (done) {
                    // Manipulate stop so that we know when the
                    // work is done.
                    var old_stop = p.stop;
                    p.stop = function () {
                        stop_fn();
                        done();
                    };

                    if (!no_load)
                        require(["requirejs/text!" + to_parse],
                                function(data) {
                                    $data.html(data);
                                    p.start();
                                });
                    else
                        p.start();
                });
            }

            makeTest("empty document, at root", function () {
                var evs = p.possibleAt($data.get(0), 0);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("enterStartTag", "", "html")]);
            }, true);

            makeTest("with actual contents, at root", function () {
                var evs = p.possibleAt($data.get(0), 0);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("enterStartTag", "", "html")]);
            });

            makeTest("with actual contents, at end", function () {
                var evs = p.possibleAt($data.get(0), 1);
                assert.sameMembers(evs.toArray(), []);
            });

            makeTest("with actual contents, start of html", function () {
                var evs = p.possibleAt(
                    $data.children("._real.html").get(0), 0);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("enterStartTag", "", "head")]);
            });

            makeTest("with actual contents, start of head", function () {
                var evs = p.possibleAt(
                    $data.find("._real.head").get(0), 0);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("enterStartTag", "", "title")]);
            });

            makeTest("with actual contents, start of title "+
                     "(start of text node)",
                     function () {
                         var el = $data.find("._real.title").
                                 get(0).childNodes[0];
                         // Make sure we know what we are looking at.
                         assert.equal(el.nodeType, Node.TEXT_NODE);
                         var evs = p.possibleAt(el, 0);
                         assert.sameMembers(
                             evs.toArray(),
                             [new validate.Event("endTag", "", "title"),
                              new validate.Event("text")]);
                     });

            makeTest("with actual contents, index inside text node",
                     function () {
                         var el = $data.find("._real.title").
                                 get(0).childNodes[0];
                         // Make sure we know what we are looking at.
                         assert.equal(el.nodeType, Node.TEXT_NODE);
                         var evs = p.possibleAt(el, 1);
                         assert.sameMembers(
                             evs.toArray(),
                             [new validate.Event("endTag", "", "title"),
                              new validate.Event("text")]);
                     });

            makeTest("with actual contents, end of title", function () {
                var title = $data.find("._real.title").get(0);
                var evs = p.possibleAt(title,
                                       title.childNodes.length);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("endTag", "", "title"),
                     new validate.Event("text")]);

            });

            makeTest("with actual contents, end of head", function () {
                var el = $data.find("._real.head").get(0);
                var evs = p.possibleAt(el, el.childNodes.length);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("endTag", "", "head")]);

            });

            makeTest("with actual contents, after head", function () {
                var el = $data.find("._real.head").get(0);
                var evs = p.possibleAt(
                    el.parentNode,
                    Array.prototype.indexOf.call(
                        el.parentNode.childNodes, el) + 1);
                assert.sameMembers(
                    evs.toArray(),
                    [new validate.Event("enterStartTag", "", "body")]);
            });
        });
    });
});
