/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "wed/convert"], function (mocha, chai, convert) {
'use strict';

var assert = chai.assert;

//
// Convert cannot currently be tested using jsdom because jsdom does
// not parse XML.
//
describe("convert", function () {

    var reqs = [];
    var source, expected;
    beforeEach(function (done) {
        require(reqs, function(source_, expected_) {
            source = source_;
            expected = expected_;
            done();
        });
    });

    function makeTest(name) {
        var converted_name = name.replace(/ /g, '-');
        var source_path = "../../test-files/convert_test_data/" +
                converted_name + ".xml";
        var expected_path = "../../test-files/convert_test_data/" +
                converted_name + ".html";

        describe("", function () {
            before(function () {
                reqs = ["requirejs/text!" + source_path,
                        "requirejs/text!" + expected_path];
            });

            it(name, function (done) {
                var parser = new window.DOMParser();
                var root =
                    parser.parseFromString(source, "application/xml")
                    .documentElement;
                var html = convert.toHTMLTree(window.document, root);
                // The reason this does not produce a diff seems to be
                // that Mocha's HTML reporter does not support diffs.
                assert.equal(html.outerHTML + "\n", expected);
                done();
            });
        });
    }

    makeTest("should convert xml to html");
    makeTest("should encode name prefixes");
    makeTest("should encode dashes in attribute names");
    makeTest("should encode namespace changes");
});

});
