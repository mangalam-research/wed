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

var wedroot = $("#wedframe-invisible").contents().find("#wedroot")[0];
var $wedroot = $(wedroot);
// Yes, we use *input_trigger* test data.
var src_stack =
        ["../../test-files/input_trigger_test_data/source_converted.xml"];

describe("input_trigger_factory", function () {
    var editor;
    beforeEach(function (done) {
        $wedroot.empty();
        require(["requirejs/text!" + src_stack[0]], function(data) {
            $wedroot.append(data);
            editor = new wed.Editor();
            editor.addEventListener("initialized", function () {
                done();
            });
            editor.init(wedroot, options);
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
                editor, ".p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            // Synthetic event
            editor.setDataCaret(
                editor.$data_root.find(".p").get(-1).firstChild, 4);
            editor.type(";");

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 2);
            assert.equal($ps[0].outerHTML, '<div class="p _real">Blah</div>');
            assert.equal($ps.length, 2);
            assert.equal($ps[0].outerHTML, '<div class="p _real">Blah</div>');
            assert.equal($ps[1].outerHTML,
                         '<div class="p _real"> blah '+
                         '<div class="term _real">blah</div>'+
                         '<div class="term _real">blah2</div> blah.</div>');
        });

        it("creates an InputTrigger that handles a split triggered by a " +
           "keydown event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            editor.setDataCaret(
                editor.$data_root.find(".p").get(-1).firstChild, 4);
            editor.type(key_constants.ENTER);

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 2);
            assert.equal($ps[0].outerHTML, '<div class="p _real">Blah</div>');
            assert.equal($ps.length, 2);
            assert.equal($ps[0].outerHTML, '<div class="p _real">Blah</div>');
            assert.equal($ps[1].outerHTML,
                         '<div class="p _real"> blah '+
                         '<div class="term _real">blah</div>'+
                         '<div class="term _real">blah2</div> blah.</div>');
        });


        it("creates an InputTrigger that handles a split triggered by a " +
           "children-changed event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 1);

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
            editor.setDataCaret($ps[0], 0);
            editor.$gui_root.trigger(event);

            $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 3);
            assert.equal($ps[0].outerHTML, '<div class="p _real">ab</div>');
            assert.equal($ps[1].outerHTML, '<div class="p _real">cd</div>');
            assert.equal($ps[2].outerHTML,
                         '<div class="p _real">efBlah blah '+
                         '<div class="term _real">blah</div>'+
                         '<div class="term _real">blah2</div> blah.</div>');
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

        it("creates an InputTrigger that backspace in phantom text",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            editor.setGUICaret(
                editor.$gui_root.find(".p>.ref")[0].firstChild, 1);
            editor.type(key_constants.BACKSPACE);

            var $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 1);
        });

        it("creates an InputTrigger that delete in phantom text",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            editor.setGUICaret(
                editor.$gui_root.find(".p>.ref")[0].lastChild.previousSibling,
                0);
            editor.type(key_constants.DELETE);

            var $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 1);
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
                editor, ".p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret($ps[1].firstChild, 0);
            editor.type(key_constants.BACKSPACE);

            $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal($ps[0].outerHTML,
                         '<div class="p _real">BarFoo</div>');
        });

        it("creates an InputTrigger that merges on DELETE",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key_constants.ENTER,
                key_constants.BACKSPACE, key_constants.DELETE);

            var $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 2,
                         "there should be 2 paragraphs before backspacing");

            editor.setDataCaret($ps[0].lastChild,
                                $ps[0].lastChild.nodeValue.length);
            editor.type(key_constants.DELETE);

            $ps = editor.$data_root.find(".body>.p");
            assert.equal($ps.length, 1,
                        "there should be 1 paragraph after backspacing");
            assert.equal($ps[0].outerHTML,
                         '<div class="p _real">BarFoo</div>');
        });
    });

});

});

// LocalWords:  chai jquery tei InputTrigger
