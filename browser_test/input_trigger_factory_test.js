/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/input_trigger_factory",
        "wed/wed", "wed/key", "wed/key_constants", "salve/validate",
        "browser_test/global", "wed/onerror",
        "requirejs/text!../../build/schemas/tei-simplified-rng.js",
        "requirejs/text!../../build/test-files/input_trigger_test_data/" +
        "source_converted.xml",
        "requirejs/text!../../build/test-files/input_trigger_test_data/" +
        "source2_converted.xml",
        "requirejs/text!../../build/test-files/input_trigger_test_data/" +
        "source3_converted.xml"],
function (mocha, chai, $, input_trigger_factory, wed, key, key_constants,
          validate, global, onerror, schema, generic_src, source2, source3) {
'use strict';

var assert = chai.assert;

var options = {
    schema: undefined,
    mode: {
        path: 'wed/modes/generic/generic',
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

// Yes, we use *input_trigger* test data.
var src_stack = [generic_src];

// This is an ad-hoc function meant for these tests *only*. The XML
// serialization adds an xmlns declaration that we don't care
// for. So...
function cleanNamespace(str) {
    return str.replace(/ xmlns=".*?"/, '');
}

describe("input_trigger_factory", function () {
    var editor;

    before(function () {
        // Resolve the schema to a grammar.
        options.schema = validate.constructTree(schema);
    });

    beforeEach(function (done) {
        editor = new wed.Editor();
        editor.addEventListener("initialized", function () {
            done();
        });
        var wedroot = window.parent.document.getElementById("wedframe")
            .contentWindow.document.getElementById("wedroot");
        editor.init(wedroot, options, src_stack[0]);
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

    function mit(name, fn) {
        it(name, function () {
            fn();
            // We want to make sure the changes do not screw up
            // validation and we want to catch these errors in the
            // test, rather than the hook.
            editor.validator._validateUpTo(editor.data_root, -1);
        });
    }

    describe("makeSplitMergeInputTrigger", function () {
        mit("creates an InputTrigger that handles a split triggered by a " +
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

        mit("creates an InputTrigger that handles a split triggered by a " +
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


        mit("creates an InputTrigger that handles a split triggered by a " +
           "paste event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, "p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            var ps = editor.data_root.querySelectorAll("body p");
            assert.equal(ps.length, 1);

            // Synthetic event
            var event = global.makeFakePasteEvent({
                types: ["text/plain"],
                getData: function (type) {
                    return "ab;cd;ef";
                }
            });
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
            src_stack.unshift(source2);
        });
        after(function () {
            src_stack.shift();
        });

        mit("creates an InputTrigger that backspaces in phantom text",
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

        mit("creates an InputTrigger that deletes in phantom text",
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
            src_stack.unshift(source3);
        });
        after(function () {
            src_stack.shift();
        });

        mit("creates an InputTrigger that merges on BACKSPACE",
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

        mit("creates an InputTrigger that merges on BACKSPACE, and can undo",
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

        mit("creates an InputTrigger that merges on DELETE",
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

        mit("creates an InputTrigger that merges on DELETE, and can undo",
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
