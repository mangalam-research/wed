var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "wed/transformation", "../base-config", "../wed-test-util"], function (require, exports, transformation, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    transformation = __importStar(transformation);
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("transformation", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        describe("swapWithPreviousHomogeneousSibling", function () {
            it("swaps", function () {
                var ps = editor.dataRoot.querySelectorAll("body>p");
                transformation.swapWithPreviousHomogeneousSibling(editor, ps[1]);
                var ps2 = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps[0], ps2[1]);
                assert.equal(ps2[1], ps[0]);
            });
            it("does nothing if the element is the first child", function () {
                var ps = editor.dataRoot.querySelectorAll("publicationStmt>p");
                transformation.swapWithPreviousHomogeneousSibling(editor, ps[0]);
                var ps2 = editor.dataRoot.querySelectorAll("publicationStmt>p");
                assert.equal(ps[0], ps2[0]);
            });
            it("does nothing if the previous element is not homogeneous", function () {
                var divs = editor.dataRoot.querySelectorAll("body>div");
                transformation.swapWithPreviousHomogeneousSibling(editor, divs[0]);
                var divs2 = editor.dataRoot.querySelectorAll("body>div");
                assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
            });
        });
        describe("swapWithNextHomogeneousSibling", function () {
            it("swaps", function () {
                var ps = editor.dataRoot.querySelectorAll("body>p");
                transformation.swapWithNextHomogeneousSibling(editor, ps[0]);
                var ps2 = editor.dataRoot.querySelectorAll("body>p");
                assert.equal(ps[0], ps2[1]);
                assert.equal(ps2[1], ps[0]);
            });
            it("does nothing if the element is the last child", function () {
                var ps = editor.dataRoot.querySelectorAll("publicationStmt>p");
                transformation.swapWithNextHomogeneousSibling(editor, ps[ps.length - 1]);
                var ps2 = editor.dataRoot.querySelectorAll("publicationStmt>p");
                assert.equal(ps[ps.length - 1], ps2[ps.length - 1]);
            });
            it("does nothing if the next element is not homogeneous", function () {
                var divs = editor.dataRoot.querySelectorAll("body>div");
                transformation.swapWithNextHomogeneousSibling(editor, divs[0]);
                var divs2 = editor.dataRoot.querySelectorAll("body>div");
                assert.equal(divs[0].previousSibling, divs2[0].previousSibling);
            });
        });
    });
});
//  LocalWords:  rng wedframe RequireJS dropdown Ctrl Mangalam MPL
//  LocalWords:  Dubeau previousSibling nextSibling abcd jQuery xmlns
//  LocalWords:  sourceDesc publicationStmt titleStmt fileDesc txt
//  LocalWords:  ajax xml moveCaretRight moveCaretLeft teiHeader html
//  LocalWords:  innerHTML nodeValue seekCaret nodeToPath pathToNode
//  LocalWords:  mouseup mousedown unhandled requirejs btn gui metas
//  LocalWords:  wedroot tei domutil onerror jquery chai
//# sourceMappingURL=transformation-test.js.map