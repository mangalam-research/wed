/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/jqutil"],
       function (mocha, chai, $, jqutil) {
'use strict';
var assert = chai.assert;

describe("jqutil", function () {
    describe("toDataSelector", function () {
        it("raises an error on brackets",
                 function () {
            assert.Throw(jqutil.toDataSelector.bind(undefined, "abcde[f]"),
                         Error, "selector is too complex");
        });

        it("raises an error on parens",
                 function () {
            assert.Throw(jqutil.toDataSelector.bind(undefined, "abcde:not(f)"),
                         Error, "selector is too complex");
        });

        it("converts a > sequence",
                 function () {
            assert.equal(jqutil.toDataSelector("p > term > foreign"),
                         ".p._real > .term._real > .foreign._real");
        });

        it("converts a space sequence with namespaces",
                 function () {
            assert.equal(jqutil.toDataSelector("btw:cit tei:q"),
                         ".btw\\:cit._real .tei\\:q._real");
        });
    });
});

});

//  LocalWords:  Mangalam MPL Dubeau jQuery selectorToElements parens
//  LocalWords:  namespaces jquery chai jqutil toDataSelector
