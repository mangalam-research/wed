/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var child_process = require("child_process");
var fs = require("fs");
var assert = require("chai").assert;
describe("xml-to-html", function () {
    this.timeout(0);
    // Reminder: paths are relative to where mocha is run.
    // I.e. the root of our source tree!
    var XSL = "lib/wed/xml-to-html.xsl";
    function makeTest(name) {
        var converted_name = name.replace(/ /g, '-');
        it(name, function (done) {
            var source = "test/lib/wed/" + converted_name + ".xml";
            var p = child_process.spawn('saxon', ['-xsl:' + XSL,
                                                  '-s:' + source]);
            var html = [];
            var data = p.stdout.on('data', html.push.bind(html, data));
            p.on('close', function (code) {
                assert.equal(code, 0, "saxon failed");
                assert.equal(html.join(""),
                             fs.readFileSync('test/lib/wed/' +
                                             converted_name + ".html",
                                             'utf-8'));
                done();
            });
        });
    }

    makeTest("should convert xml to html");
    makeTest("should encode name prefixes");
    makeTest("should encode dashes in attribute names");
    makeTest("should encode namespace changes");
});

//  LocalWords:  namespace xml xsl saxon utf chai Dubeau MPL Mangalam
//  LocalWords:  html
