/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/browsers", "wed/convert", "../util"], function (require, exports, browsers, convert, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    browsers = __importStar(browsers);
    convert = __importStar(convert);
    var assert = chai.assert;
    describe("convert", function () {
        var parser;
        var provider;
        before(function () {
            parser = new DOMParser();
            provider =
                new util_1.DataProvider("/base/build/standalone/lib/tests/convert_test_data/");
        });
        function makeTest(name, differsOnIE) {
            if (differsOnIE === void 0) { differsOnIE = false; }
            var convertedName = name.replace(/ /g, "-");
            var sourcePath = convertedName + ".xml";
            // If the test differs on IE and we are on IE, then add -ie to the basename.
            var ie = differsOnIE && browsers.MSIE;
            var expectedPath = convertedName + (ie ? "-ie" : "") + ".html";
            describe("", function () {
                var source;
                var expected;
                before(function () { return Promise.all([
                    provider.getText(sourcePath).then(function (data) {
                        source = data;
                    }),
                    provider.getText(expectedPath).then(function (data) {
                        expected = data;
                    })
                ]); });
                it(name, function () {
                    var root = parser.parseFromString(source, "application/xml")
                        .documentElement;
                    var html = convert.toHTMLTree(window.document, root);
                    // The reason this does not produce a diff seems to be that Mocha's HTML
                    // reporter does not support diffs.
                    assert.equal(html.outerHTML + "\n", expected);
                });
            });
        }
        // tslint:disable:mocha-no-side-effect-code
        makeTest("should convert xml to html");
        makeTest("should encode name prefixes", true);
        makeTest("should encode dashes in attribute names");
        makeTest("should encode namespace changes", true);
        // tslint:enable:mocha-no-side-effect-code
    });
});
//# sourceMappingURL=convert-test.js.map