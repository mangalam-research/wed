/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(["mocha/mocha", "chai", "jquery", "wed/input_trigger", "wed/wed",
        "wed/key", "wed/key_constants", "wed/input_trigger_factory",
        "wed/transformation"],
function (mocha, chai, $, input_trigger, wed, key, key_constants,
         input_trigger_factory, transformation) {
'use strict';
var assert = chai.assert;
var InputTrigger = input_trigger.InputTrigger;

var options = {
    schema: '../../../schemas/tei-simplified-rng.js',
    mode: {
        path: 'test',
        options: {
            meta: 'wed/modes/generic/metas/tei_meta'
        }
    }
};

var wedroot = $("#wedframe-invisible").contents().find("#wedroot").get(0);
var $wedroot = $(wedroot);
var source = "../../test-files/input_trigger_test_data/source_converted.xml";

describe("InputTrigger", function () {
    var editor;
    beforeEach(function (done) {
        $wedroot.empty();
        require(["requirejs/text!" + source], function(data) {
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

    it("triggers on paste events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        var $p = editor.$data_root.find(".p").last();
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "paste");
            assert.equal($el.get(0), $p.get(0));
            seen++;
        });
        // Synthetic event
        var event = new $.Event("paste");
        // Provide a skeleton of clipboard data
        event.originalEvent = {
            clipboardData: {
                types: ["text/plain"],
                getData: function (type) {
                    return "abc;def";
                }
            }
        };
        editor.setGUICaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.$gui_root.trigger(event);
        assert.equal(seen, 1);
    });

    it("triggers on keydown events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        input_trigger.addKeyHandler(key_constants.ENTER,
                                    function (type, $el, ev) {
            assert.equal(type, "keydown");
            assert.equal($el.get(0),
                         editor.$data_root.find(".p").last().get(0));
            ev.stopImmediatePropagation();
            seen++;
        });

        // Synthetic event
        editor.setGUICaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.type(key_constants.ENTER);
        assert.equal(seen, 1);
    });

    it("triggers on keypress events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        input_trigger.addKeyHandler(key.makeKey(";"),
                                    function (type, $el, ev) {
            assert.equal(type, "keypress");
            assert.equal($el.get(0),
                         editor.$data_root.find(".p").last().get(0));
            ev.stopImmediatePropagation();
            seen++;
        });

        // Synthetic event
        editor.setGUICaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.type(";");
        assert.equal(seen, 1);
    });


    it("does not trigger on unimportant children-changed events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        var $p = editor.$data_root.find(".p").last();
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "children-changed");
            assert.equal($el.get(0), $p.get(0));
            seen++;
        });
        var text = document.createTextNode("abcdef");
        $p.append(text);
        assert.equal(seen, 0);
    });

    it("does not trigger on unimportant input events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "keydown");
            assert.equal($el.get(0),
                         editor.$data_root.find(".p").last().get(0));
            seen++;
        });

        // Synthetic event
        editor.setGUICaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.type(":");
        assert.equal(seen, 0);
    });

    it("does not trigger on modifications of text when they key is " +
       "not a text input key", function () {
           var input_trigger = new InputTrigger(editor, ".p");
           var seen = 0;
           var DELETE = key_constants.DELETE;
           input_trigger.addKeyHandler(DELETE, function (type, $el) {
               seen++;
           });

           var $p = editor.$data_root.find(".p").last();
           var text = $p.get(0).lastChild;
           // Make sure we're looking at the right thing.
           assert.equal(text.nodeValue, " blah.");

           // Initiate the change.
           text.nodeValue = " blah...";
           assert.equal(seen, 0);
       });

    it("does not trigger on additions of text when they key is " +
       "not a text input key", function () {
           var input_trigger = new InputTrigger(editor, ".p");
           var seen = 0;
           var DELETE = key_constants.DELETE;
           input_trigger.addKeyHandler(DELETE, function (type, $el) {
               seen++;
           });

           var $p = editor.$data_root.find(".p").last();
           var text = document.createTextNode("...");
           $p.append(text);
           assert.equal(seen, 0);
       });

    // The following tests need to modify the document in significant
    // ways, so we use input_trigger_factory to create an
    // input_trigger that does something significant.
    it("does not try to act on undo/redo changes", function () {
        input_trigger_factory.makeSplitMergeInputTrigger(
            editor, ".p", key.makeKey(";"),
            key_constants.BACKSPACE, key_constants.DELETE);
        var $ps = editor.$data_root.find(".body .p");
        assert.equal($ps.length, 1);
        editor.setDataCaret($ps.get(0), 0);
        var text = $ps.get(0).firstChild;
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
        editor.$gui_root.trigger(event);

        $ps = editor.$data_root.find(".body .p");
        assert.equal($ps.length, 3);
        assert.equal($ps.get(0).outerHTML,
                     '<div class="p _real">ab</div>');
        assert.equal($ps.get(1).outerHTML,
                     '<div class="p _real">cd</div>');
        assert.equal($ps.get(2).outerHTML,
                     '<div class="p _real">efBlah blah '+
                     '<div class="term _real">blah</div>'+
                     '<div class="term _real">blah2</div> blah.</div>',
                    "first split: 3rd part");

        editor.undo();
        $ps = editor.$data_root.find(".body .p");
        assert.equal($ps.length, 1);
        assert.equal($ps.get(0).outerHTML,
                     '<div class="p _real">Blah blah '+
                     '<div class="term _real">blah</div>'+
                     '<div class="term _real">blah2</div> blah.</div>',
                     "after undo");

        editor.redo();
        $ps = editor.$data_root.find(".body .p");
        assert.equal($ps.length, 3, "after redo: length");
        assert.equal($ps.get(0).outerHTML,
                     '<div class="p _real">ab</div>',
                     "after redo: 1st part");
        assert.equal($ps.get(1).outerHTML,
                     '<div class="p _real">cd</div>',
                     "after redo: 2nd part");
        assert.equal($ps.get(2).outerHTML,
                     '<div class="p _real">efBlah blah '+
                     '<div class="term _real">blah</div>'+
                     '<div class="term _real">blah2</div> blah.</div>',
                     "after redo: 3rd part");
    });

});

});

//  LocalWords:  requirejs wedroot wedframe metas js rng RequireJS cd
//  LocalWords:  Mangalam MPL Dubeau jquery jQuery tei keypress chai
//  LocalWords:  keydown InputTrigger
