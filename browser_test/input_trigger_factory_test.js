/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/input_trigger_factory",
        "wed/wed", "wed/key", "wed/key_constants"],
function (mocha, chai, $, input_trigger_factory, wed, key, key_constants) {
'use strict';

var assert = chai.assert;

var options = {
    schema: '../../../schemas/tei-simplified-rng.js',
    mode: {
        path: 'generic',
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

var wedroot = $("#wedframe-invisible").contents().find("#wedroot")[0];
var $wedroot = $(wedroot);
// Yes, we use *input_trigger* test data.
var src_stack =
        ["../../test-files/input_trigger_test_data/source_converted.xml"];

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care
// for. So...
function cleanNamespace(str) {
    return str.replace(/ xmlns=".*?"/, '');
}

describe("input_trigger_factory", function () {
    var editor;
    beforeEach(function (done) {
        require(["requirejs/text!" + src_stack[0]], function(data) {
            editor = new wed.Editor();
            editor.addEventListener("initialized", function () {
                done();
            });
            editor.init(wedroot, options, data);
        });
    });

    afterEach(function () {
        if (editor)
            editor.destroy();
        editor = undefined;
    });

    describe("makeSplitMergeInputTrigger", function () {
        it("creates an InputTrigger that handles a split triggered by a " +
           "keypress event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.getElementsByTagName("p");
            editor.setDataCaret(ps[ps.length - 1].firstChild, 4);
            editor.type(";");

            ps = editor.data_root.querySelectorAll("body p");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Blah</p>');
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Blah</p>');
            assert.equal(cleanNamespace(ps[1].outerHTML),
                         '<p> blah <term>blah</term>' +
                         '<term>blah2</term> blah.</p>');
        });

        it("creates an InputTrigger that handles a split triggered by a " +
           "keydown event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.getElementsByTagName("p");
            editor.setDataCaret(ps[ps.length - 1].firstChild, 4);
            editor.type(key_constants.ENTER);

            ps = editor.data_root.querySelectorAll("body p");
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Blah</p>');
            assert.equal(ps.length, 2);
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Blah</p>');
            assert.equal(cleanNamespace(ps[1].outerHTML),
                         '<p> blah <term>blah</term>' +
                         '<term>blah2</term> blah.</p>');
        });


        it("creates an InputTrigger that handles a split triggered by a " +
           "paste event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body p");
            assert.equal(ps.length, 1);

            // Synthetic event
            var event = new $.Event("paste");
            // Provide a skeleton of clipboard data
            event.originalEvent = {
                clipboardData: {
                    types: ["text/plain"],
                    getData: function (type) {
                        return "ab;cd;ef";
                    }
                }
            };
            editor.setDataCaret(ps[0], 0);
            editor.$gui_root.trigger(event);

            ps = editor.data_root.querySelectorAll("body p");
            assert.equal(ps.length, 3);
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>ab</p>');
            assert.equal(cleanNamespace(ps[1].outerHTML), '<p>cd</p>');
            assert.equal(cleanNamespace(ps[2].outerHTML),
                         '<p>efBlah blah <term>blah</term>'+
                         '<term>blah2</term> blah.</p>');
        });
    });

    describe("makeSplitMergeInputTrigger", function () {
        before(function () {
            src_stack.unshift("../../test-files/input_trigger_test_data" +
                              "/source2_converted.xml");
        });
        after(function () {
            src_stack.shift();
        });

        it("creates an InputTrigger that backspaces in phantom text",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            editor.setGUICaret(
                editor.gui_root.querySelector(".p>.ref").firstChild, 1);
            editor.type(key_constants.BACKSPACE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1);
        });

        it("creates an InputTrigger that deletes in phantom text",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            editor.setGUICaret(
                editor.gui_root.querySelector(".p>.ref")
                    .lastChild.previousSibling,
                0);
            editor.type(key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1);
        });
    });

    describe("makeSplitMergeInputTrigger", function () {
        before(function () {
            src_stack.unshift("../../test-files/input_trigger_test_data" +
                              "/source3_converted.xml");
        });
        after(function () {
            src_stack.shift();
        });

        it("creates an InputTrigger that merges on BACKSPACE",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret(ps[1].firstChild, 0);
            editor.type(key_constants.BACKSPACE);

            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>BarFoo</p>');
        });

        it("creates an InputTrigger that merges on BACKSPACE, and can undo",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret(ps[1].firstChild, 0);
            editor.type(key_constants.BACKSPACE);

            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>BarFoo</p>');

            editor.undo();

            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                        "there should be 2 paragraphs after undo");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Bar</p>');
            assert.equal(cleanNamespace(ps[1].outerHTML), '<p>Foo</p>');
        });

        it("creates an InputTrigger that merges on DELETE",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret(ps[0].lastChild,
                                ps[0].lastChild.nodeValue.length);
            editor.type(key_constants.DELETE);

            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>BarFoo</p>');
        });

        it("creates an InputTrigger that merges on DELETE, and can undo",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret(ps[0].lastChild,
                                ps[0].lastChild.nodeValue.length);
            editor.type(key_constants.DELETE);

            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>BarFoo</p>');

            editor.undo();
            ps = editor.data_root.querySelectorAll("body>p");
            assert.equal(ps.length, 2,
                         "there should be 2 paragraphs before backspacing");
            assert.equal(cleanNamespace(ps[0].outerHTML), '<p>Bar</p>');
            assert.equal(cleanNamespace(ps[1].outerHTML), '<p>Foo</p>');
        });
    });

});

});

// LocalWords:  chai jquery tei InputTrigger
