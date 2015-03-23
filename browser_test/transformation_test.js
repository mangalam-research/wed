/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2015 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/wed",
        "wed/domutil", "wed/onerror", "wed/log",
        "wed/dloc", "wed/util", "salve/validate", "wed/transformation"],
       function (mocha, chai, $, wed, domutil,
                onerror, log, dloc, util, validate, transformation) {
'use strict';

var _indexOf = Array.prototype.indexOf;

var options = {
    schema: '../../../schemas/tei-simplified-rng.js',
    mode: {
        path: 'test',
        options: {
            meta: {
                path: 'wed/modes/generic/metas/tei_meta',
                options: {
                    metadata: '../../../../../schemas/tei-metadata.json'
                }
            }
        }
    }
};
var assert = chai.assert;

var wedroot = window.parent.document.getElementById("wedframe")
        .contentWindow.document.getElementById("wedroot");
var src_stack = ["../../test-files/wed_test_data/source_converted.xml"];
var option_stack = [options];

function caretCheck(editor, container, offset, msg) {
    var caret = editor.getGUICaret(true);
    assert.isTrue(!!caret, "there should be a caret");
    if (offset !== null) {
        assert.equal(caret.node, container, msg + " (container)");
        assert.equal(caret.offset, offset, msg + " (offset)");
    }
    else {
        // A null offset means we are not interested in the specific
        // offset.  We just want to know that the caret is *inside*
        // container either directly or indirectly.
        assert.isTrue($(caret.node).closest(container).length !== 0,
                      msg + " (container)");
    }
}

function dataCaretCheck(editor, container, offset, msg) {
    var data_caret = editor.getDataCaret();
    assert.equal(data_caret.node, container, msg + " (container)");
    assert.equal(data_caret.offset, offset, msg + " (offset)");
}

describe("transformation", function () {
    before(function (done) {
        // Resolve the schema to a grammar.
        $.get(require.toUrl(options.schema), function (x) {
            options.schema = validate.constructTree(x);
            done();
        }, "text").fail(
            function (jqXHR, textStatus, errorThrown) {
            throw new Error(textStatus + " " + errorThrown);
        });
    });

    var editor;
    beforeEach(function (done) {
        require(["requirejs/text!" + src_stack[0]], function(data) {
            editor = new wed.Editor();
            editor.addEventListener("initialized", function () {
                done();
            });
            editor.init(wedroot, option_stack[0], data);
        });
    });

    afterEach(function () {
        if (editor)
            editor.destroy();
        editor = undefined;
        assert.isFalse(onerror.is_terminating(),
                       "test caused an unhandled exception to occur");
        // We don't reload our page so we need to do this.
        onerror.__test.reset();
    });

    describe("swapWithPreviousHomogeneousSibling", function () {
        it("swaps", function () {
            var ps = editor.data_root.querySelectorAll("body>p");
            transformation
                .swapWithPreviousHomogeneousSibling(editor, ps[1]);

            var ps2 = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps[0], ps2[1]);
            assert.equal(ps2[1], ps[0]);
        });

        it("does nothing if the element is the first child", function () {
            var ps = editor.data_root.querySelectorAll("publicationStmt>p");
            transformation
                .swapWithPreviousHomogeneousSibling(editor, ps[0]);

            var ps2 = editor.data_root
                .querySelectorAll("publicationStmt>p");
            assert.equal(ps[0], ps2[0]);
        });

        it("does nothing if the previous element is not homogeneous",
           function () {
            var divs = editor.data_root.querySelectorAll("body>div");
            transformation
                .swapWithPreviousHomogeneousSibling(editor, divs[0]);

            var divs2 = editor.data_root
                .querySelectorAll("body>div");
            assert.equal(divs[0].previousSibling, divs[0].previousSibling);
        });
    });

    describe("swapWithNextHomogeneousSibling", function () {
        it("swaps", function () {
            var ps = editor.data_root.querySelectorAll("body>p");
            transformation.swapWithNextHomogeneousSibling(editor, ps[0]);

            var ps2 = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps[0], ps2[1]);
            assert.equal(ps2[1], ps[0]);
        });

        it("does nothing if the element is the last child", function () {
            var ps = editor.data_root.querySelectorAll("publicationStmt>p");
            transformation
                .swapWithNextHomogeneousSibling(editor, ps[ps.length - 1]);

            var ps2 = editor.
                data_root.querySelectorAll("publicationStmt>p");
            assert.equal(ps[ps.length - 1], ps2[ps.length - 1]);
        });

        it("does nothing if the next element is not homogeneous",
           function () {
            var divs = editor.data_root.querySelectorAll("body>div");
            transformation
                .swapWithNextHomogeneousSibling(editor, divs[0]);

            var divs2 = editor.data_root
                .querySelectorAll("body>div");
            assert.equal(divs[0].previousSibling, divs[0].previousSibling);
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
