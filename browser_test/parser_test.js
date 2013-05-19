define(["module", "mocha/mocha", "chai", "jquery", "wed/parser", "wed/util"], 
function (module, mocha, chai, $, parser, util) {
    var config = module.config();
    var schema = config.schema;
    var to_parse = config.to_parse;
    var assert = chai.assert;
    var resolver = new util.NameResolver({
        "xml": "http://www.w3.org/XML/1998/namespace",
        "": ""
    });
    describe("parsing", function () {
        var p;
        beforeEach(function () {
            $("#data").empty();
            $("#sb-errorlist").empty();
            p = new parser.Parser(schema, 
                                  resolver,
                                  $("#data").get(0),
                                  $("#tmp-state").get(0),
                                  $("#sb-errorlist").get(0));
            p._max_timespan = 0; // Work forever.
        });

        afterEach(function () {
            $("#data").empty();
            $("#sb-errorlist").empty();
            p = undefined;
        });

        it("with an empty document", function (done) {
            // Manipulate stop so that we know when the work is done.
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal($("#tmp-state").get(0).childNodes.length, 1);
                assert.equal($("#tmp-state").get(0).innerHTML, "invalid");
                var $errors = $("#sb-errorlist");
                assert.equal($errors.get(0).childNodes.length, 1);
                assert.equal($errors.find("a").contents().get(0).data, "tag required: {}html");
                done();
            };
            
            p.start();
        });
        
        it("with actual contents", function (done) {
            // Manipulate stop so that we know when the work is done.
            var old_stop = p.stop;
            p.stop = function () {
                old_stop.call(p);
                assert.equal($("#tmp-state").get(0).childNodes.length, 1);
                assert.equal($("#tmp-state").get(0).innerHTML, "valid");
                var $errors = $("#sb-errorlist");
                assert.equal($errors.get(0).childNodes.length, 0);
                done();
            };
            
            require(["requirejs/text!" + to_parse], function(data) {
                $("#data").html(data);
                p.start();
            });
        });

        it("precent done", function (done) {
            require(["requirejs/text!" + config.percent_to_parse], function(data) {
                $("#data").html(data);
                p._max_timespan = 0;
                p._max_cycles = 1;
                p._initialize(function () {
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
                    assert.equal($("#tmp-state").get(0).childNodes.length, 1);
                    assert.equal($("#tmp-state").get(0).innerHTML, "valid");
                    var $errors = $("#sb-errorlist");
                    assert.equal($errors.get(0).childNodes.length, 0);
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
                assert.equal($("#tmp-state").get(0).childNodes.length, 1);
                assert.equal($("#tmp-state").get(0).innerHTML, "valid");
                var $errors = $("#sb-errorlist");
                assert.equal($errors.get(0).childNodes.length, 0);
                // Deal with first invocation and subsequent differently.
                if (first) {
                    p.restartAt($("#data").get(0)); 
                    first = false;
                }
                else 
                    done();
            };
            
            require(["requirejs/text!" + to_parse], function(data) {
                $("#data").html(data);
                p.start();
            });
        });

    });
});
