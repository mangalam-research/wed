/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var child_process = require("child_process");
var fs = require("fs");
var assert = require("chai").assert;
describe("html-to-xml", function () {
    this.timeout(0);
    // Reminder: paths are relative to where mocha is run.
    // I.e. the root of our source tree!
    var XSL = "lib/wed/html-to-xml.xsl";
    function makeTest(name, alternate_name) {
        var converted_name =
                (alternate_name !== undefined) ?
                alternate_name.replace(/ /g, '-') :
                name.replace(/ /g, '-');
        it(name, function (done) {
            var source = "test/lib/wed/" + converted_name + ".html";
            var p = child_process.spawn('saxon', ['-xsl:' + XSL,
                                                  '-s:' + source]);
            var xml = [];
            var data = p.stdout.on('data', xml.push.bind(xml, data));
            p.on('close', function (code) {
                xml.push("\n");
                assert.equal(code, 0, "saxon failed");
                assert.equal(xml.join(""),
                             fs.readFileSync('test/lib/wed/' +
                                             converted_name + ".xml",
                                             'utf-8'));
                done();
            });
        });
    }

    makeTest("should convert html to xml",
             "should convert xml to html");

    // We reuse the files used
    // for the opposite
    // conversion.
    makeTest("should encode name prefixes");
    makeTest("should encode dashes in attribute names");
    makeTest("should encode namespace changes");
});

//  LocalWords:  Mangalam MPL Dubeau namespace utf saxon xsl html xml
//  LocalWords:  chai fs
