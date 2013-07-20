define(["mocha/mocha", "chai", "jquery", "wed/domlistener",
        "wed/input_trigger", "wed/wed", "wed/key", "wed/key_constants"],
function (mocha, chai, $, domlistener, input_trigger, wed, key,
          key_constants) {
var assert = chai.assert;
var Listener = domlistener.Listener;
var InputTrigger = input_trigger.InputTrigger;

var options = {
    schema: 'test/tei-simplified-rng.js',
    mode: {
        path: 'wed/modes/generic/generic',
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

    it("triggers on children-changed events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        var $p = editor.$data_root.find(".p").last();
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "children-changed");
            assert.equal($el.get(0), $p.get(0));
            seen++;
        });
        var text = document.createTextNode("abc;def");
        $p.append(text);
        editor._syncDisplay();
        assert.equal(seen, 1);
    });

    it("triggers on text-changed events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        var $p = editor.$data_root.find(".p").last();
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "text-changed");
            assert.equal($el.get(0), $p.get(0));
            seen++;
        });

        var text = $p.get(0).lastChild;
        // Make sure we're looking at the right thing.
        assert.equal(text.nodeValue, " blah.");

        // Initiate the change.
        text.nodeValue = " bl;a";
        editor._syncDisplay();
        assert.equal(seen, 1);
    });

    it("triggers on input events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        input_trigger.addKeyHandler(key_constants.ENTER, function (type, $el, ev) {
            assert.equal(type, "keydown");
            assert.equal($el.get(0),
                         editor.$data_root.find(".p").last().get(0));
            ev.stopImmediatePropagation();
            seen++;
        });

        // Synthetic event
        var event = new $.Event("keydown");
        var my_key = key_constants.ENTER;
        event.which = my_key.which;
        event.keyCode = my_key.keyCode;
        event.charCode = my_key.charCode;
        event.ctrlKey = my_key.ctrlKey;
        event.altKey = my_key.altKey;
        event.metaKey = my_key.metaKey;
        editor.setCaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.$gui_root.trigger(event);
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
        editor._syncDisplay();
        assert.equal(seen, 0);
    });

    it("does not trigger on unimportant text-changed events", function () {
        var input_trigger = new InputTrigger(editor, ".p");
        var seen = 0;
        var $p = editor.$data_root.find(".p").last();
        input_trigger.addKeyHandler(key.makeKey(";"), function (type, $el) {
            assert.equal(type, "text-changed");
            assert.equal($el.get(0), $p.get(0));
            seen++;
        });

        var text = $p.get(0).lastChild;
        // Make sure we're looking at the right thing.
        assert.equal(text.nodeValue, " blah.");

        // Initiate the change.
        text.nodeValue = " blah...";
        editor._syncDisplay();
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
        var event = new $.Event("keydown");
        var my_key = key.makeKey(":");
        event.which = my_key.which;
        event.keyCode = my_key.keyCode;
        event.charCode = my_key.charCode;
        event.ctrlKey = my_key.ctrlKey;
        event.altKey = my_key.altKey;
        event.metaKey = my_key.metaKey;
        editor.setCaret(editor.$gui_root.find(".p").last().get(0), 0);
        editor.$gui_root.trigger(event);
        assert.equal(seen, 0);
    });

    it("does not triggers on modifications of text when they key is " +
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
           editor._syncDisplay();
           assert.equal(seen, 0);
       });

    it("does not triggers on additions of text when they key is " +
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
           editor._syncDisplay();
           assert.equal(seen, 0);
       });


});

});
