/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "wed/convert", "wed/browsers"],
       function (mocha, chai, convert, browsers) {
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

    function makeTest(name, differs_on_IE) {
        var converted_name = name.replace(/ /g, '-');
        var source_path = "test-files/convert_test_data/" +
                converted_name + ".xml";

        // If the test differs on IE and we are on IE, then
        // add -ie to the basename.
        var expected_path = "test-files/convert_test_data/" +
                converted_name +
                ((differs_on_IE && browsers.MSIE) ? "-ie": "") +
                ".html";

        describe("", function () {
            before(function () {
                reqs = ["text!" + source_path, "text!" + expected_path];
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
    makeTest("should encode name prefixes", true);
    makeTest("should encode dashes in attribute names");
    makeTest("should encode namespace changes", true);
});

});
