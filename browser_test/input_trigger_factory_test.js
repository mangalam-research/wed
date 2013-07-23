define(["mocha/mocha", "chai", "jquery", "wed/input_trigger_factory",
        "wed/wed", "wed/key", "wed/key_constants"],
function (mocha, chai, $, input_trigger_factory, wed, key, key_constants) {
var assert = chai.assert;

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
// Yes, we use *input_trigger* test data.
var source = "../../test-files/input_trigger_test_data/source_converted.xml";

describe("input_trigger_factory", function () {
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

    describe("makeSplitMergeInputTrigger", function () {
        it("creates an InputTrigger that handles a split triggered by a " +
           "keypress event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            // Synthetic event
            var event = new $.Event("keypress");
            var my_key = key.makeKey(";");
            event.which = my_key.which;
            event.keyCode = my_key.keyCode;
            event.charCode = my_key.charCode;
            event.ctrlKey = my_key.ctrlKey;
            event.altKey = my_key.altKey;
            event.metaKey = my_key.metaKey;
            editor.setDataCaret(
                editor.$data_root.find(".p").last().get(0).childNodes[0], 4);
            editor.$gui_root.trigger(event);

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 2);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">Blah</div>');
            assert.equal($ps.length, 2);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">Blah</div>');
            assert.equal($ps.get(1).outerHTML,
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

            // Synthetic event
            var event = new $.Event("keydown");
            var my_key = key_constants.ENTER;
            event.which = my_key.which;
            event.keyCode = my_key.keyCode;
            event.charCode = my_key.charCode;
            event.ctrlKey = my_key.ctrlKey;
            event.altKey = my_key.altKey;
            event.metaKey = my_key.metaKey;
            editor.setDataCaret(
                editor.$data_root.find(".p").last().get(0).childNodes[0], 4);
            editor.$gui_root.trigger(event);

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 2);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">Blah</div>');
            assert.equal($ps.length, 2);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">Blah</div>');
            assert.equal($ps.get(1).outerHTML,
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
            editor.setDataCaret($ps.get(0), 0);
            var text = document.createTextNode("ab;cd;ef");
            $ps.prepend(text);
            editor._syncDisplay();

            $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 3);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">ab</div>');
            assert.equal($ps.get(1).outerHTML,
                         '<div class="p _real">cd</div>');
            assert.equal($ps.get(2).outerHTML,
                         '<div class="p _real">efBlah blah '+
                         '<div class="term _real">blah</div>'+
                         '<div class="term _real">blah2</div> blah.</div>');
        });

        it("creates an InputTrigger that handles a split triggered by a " +
           "text-changed event",
           function () {
            input_trigger_factory.makeSplitMergeInputTrigger(
                editor, ".p", key.makeKey(";"),
                key_constants.BACKSPACE, key_constants.DELETE);

            var $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 1);
            editor.setDataCaret($ps.get(0), 0);
            var text = $ps.get(0).firstChild;
            text.nodeValue = "ab;cd;ef" + text.nodeValue;
            editor._syncDisplay();

            $ps = editor.$data_root.find(".body .p");
            assert.equal($ps.length, 3);
            assert.equal($ps.get(0).outerHTML,
                         '<div class="p _real">ab</div>');
            assert.equal($ps.get(1).outerHTML,
                         '<div class="p _real">cd</div>');
            assert.equal($ps.get(2).outerHTML,
                         '<div class="p _real">efBlah blah '+
                         '<div class="term _real">blah</div>'+
                         '<div class="term _real">blah2</div> blah.</div>');
        });

    });
});

});
