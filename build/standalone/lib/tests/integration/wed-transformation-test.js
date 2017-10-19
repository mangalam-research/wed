define(["require", "exports", "module", "../base-config", "../wed-test-util"], function (require, exports, module, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed transformation:", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        var guiRoot;
        var titles;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                guiRoot = editor.guiRoot;
                ps = guiRoot.querySelectorAll(".body .p");
                titles = guiRoot.getElementsByClassName("title");
            });
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
            // tslint:disable-next-line:no-any
            caretManager = undefined;
        });
        it("doing an attribute addition changes the data", function () {
            var p = ps[0];
            var dataP = editor.toDataNode(p);
            var elName = wed_test_util_1.getElementNameFor(p);
            assert.equal(wed_test_util_1.getAttributeValuesFor(p).length, 0, "no attributes");
            var trs = editor.modeTree.getMode(elName).getContextualActions(["add-attribute"], "abbr", elName, 0);
            caretManager.setCaret(elName.firstChild, 0);
            wed_test_util_1.caretCheck(editor, elName.firstChild, 0, "the caret should be in the element name");
            trs[0].execute({ node: dataP, name: "abbr" });
            var attrVals = wed_test_util_1.getAttributeValuesFor(p);
            assert.equal(attrVals.length, 1, "one attribute");
            wed_test_util_1.caretCheck(editor, attrVals[0].firstChild, 0, "the caret should be in the attribute value");
            var dataNode = editor.toDataNode(attrVals[0]);
            assert.equal(dataNode.value, "");
            assert.equal(dataNode.name, "abbr");
        });
        it("doing an attribute deletion changes the data", function () {
            var p = ps[7];
            var dataP = editor.toDataNode(p);
            var attrNames = wed_test_util_1.getAttributeNamesFor(p);
            var attrValues = wed_test_util_1.getAttributeValuesFor(p);
            var initialLength = attrValues.length;
            assert.isTrue(initialLength > 0, "the paragraph should have attributes");
            var attr = editor.toDataNode(attrValues[0]);
            var decodedName = attrNames[0].textContent;
            var trs = editor.modeTree.getMode(attr).getContextualActions(["delete-attribute"], decodedName, attr);
            caretManager.setCaret(attr, 0);
            wed_test_util_1.caretCheck(editor, attrValues[0].firstChild, 0, "the caret should be in the attribute");
            trs[0].execute({ node: attr, name: decodedName });
            attrValues = wed_test_util_1.getAttributeValuesFor(p);
            assert.equal(attrValues.length, initialLength - 1, "one attribute should be gone");
            wed_test_util_1.caretCheck(editor, attrValues[0].firstChild, 0, "the caret should be in the first attribute value");
            assert.isNull(attr.ownerElement, "the old attribute should not have an onwer element");
            assert.isNull(dataP.getAttribute(attr.name));
        });
        it("unwraps elements", function () {
            var initial = editor.dataRoot.getElementsByTagName("title")[0];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcd");
            caretManager.setCaret(initial, 0);
            var caret = caretManager.getNormalizedCaret();
            assert.equal(caret.node.childNodes[caret.offset].nodeValue, "abcd");
            var trs = editor.modeTree.getMode(initial)
                .getContextualActions(["wrap"], "hi", initial, 0);
            caretManager.setCaret(initial.firstChild, 1);
            caret = caretManager.getNormalizedCaret();
            caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));
            trs[0].execute({ node: undefined, name: "hi" });
            var node = initial.getElementsByTagName("hi")[0];
            trs = editor.modeTree.getMode(node).getContextualActions(["unwrap"], "hi", node, 0);
            trs[0].execute({ node: node, element_name: "hi" });
            assert.equal(initial.childNodes.length, 1, "length after unwrap");
            assert.equal(initial.firstChild.textContent, "abcd");
        });
        it("wraps elements in elements (offset 0)", function () {
            var initial = editor.dataRoot.querySelectorAll("body>p")[4];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcdefghij");
            var trs = editor.modeTree.getMode(initial)
                .getContextualActions(["wrap"], "hi", initial, 0);
            caretManager.setCaret(initial.firstChild, 3);
            var caret = caretManager.getNormalizedCaret();
            caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de</hi>fghij</p>");
            assert.equal(initial.childNodes.length, 3, "length after first wrap");
            caret = caretManager.fromDataLocation(initial.firstChild, 0);
            caretManager.setRange(caret, caretManager.fromDataLocation(initial.lastChild, 0));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\"><hi>abc<hi>de</hi></hi>fghij</p>");
            assert.equal(initial.childNodes.length, 2, "length after second wrap");
        });
        it("wraps elements in elements (offset === nodeValue.length)", function () {
            var initial = editor.dataRoot.querySelectorAll("body>p")[4];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcdefghij");
            var trs = editor.modeTree.getMode(initial).getContextualActions(["wrap"], "hi", initial, 0);
            var caret = caretManager.fromDataLocation(initial.firstChild, 3);
            caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de</hi>fghij</p>");
            assert.equal(initial.childNodes.length, 3, "length after first wrap");
            // We can't set this to the full length of the node value on Chrome because
            // Chrome will move the range into the <div> that you see above in the
            // innerHTML test. :-/
            caret = caretManager.fromDataLocation(initial.firstChild, initial.firstChild.textContent.length - 1);
            caretManager.setRange(caret, caretManager.fromDataLocation(initial.lastChild, initial.lastChild.textContent.length));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\">ab<hi>c<hi>de</hi>fghij</hi></p>");
            assert.equal(initial.childNodes.length, 2, "length after second wrap");
        });
        it("wraps elements in elements (no limit case)", function () {
            var initial = editor.dataRoot.querySelectorAll("body>p")[4];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcdefghij");
            var trs = editor.modeTree.getMode(initial)
                .getContextualActions(["wrap"], "hi", initial, 0);
            var caret = caretManager.fromDataLocation(initial.firstChild, 3);
            caretManager.setRange(caret, caret.makeWithOffset(caret.offset + 2));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.childNodes.length, 3, "length after first wrap");
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\">abc<hi>de</hi>fghij</p>");
            caret = caretManager.fromDataLocation(initial.firstChild, 2);
            caretManager.setRange(caret, caretManager.fromDataLocation(initial.lastChild, 2));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.childNodes.length, 3, "length after second wrap");
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\">ab<hi>c<hi>de</hi>fg</hi>hij</p>");
        });
        it("wraps text in elements (no limit case)", function () {
            var initial = editor.dataRoot.querySelectorAll("body>p")[4];
            // Make sure we are looking at the right thing.
            assert.equal(initial.childNodes.length, 1);
            assert.equal(initial.firstChild.textContent, "abcdefghij");
            var trs = editor.modeTree.getMode(initial)
                .getContextualActions(["wrap"], "hi", initial, 0);
            var caret = caretManager.fromDataLocation(initial.firstChild, 0);
            caretManager.setRange(caret, caret.makeWithOffset(initial.firstChild.textContent.length));
            trs[0].execute({ node: undefined, name: "hi" });
            assert.equal(initial.childNodes.length, 1, "length after wrap");
            assert.equal(initial.outerHTML, "<p xmlns=\"http://www.tei-c.org/ns/1.0\"><hi>abcdefghij</hi></p>");
        });
        // This test only checks that the editor does not crash.
        it("autofills in the midst of text", function () {
            var p = editor.dataRoot.querySelector("body>p");
            assert.isTrue(p.firstChild.nodeType === Node.TEXT_NODE, "we should set our caret in a text node");
            caretManager.setCaret(p.firstChild, 3);
            var trs = editor.modeTree.getMode(p.firstChild).getContextualActions(["insert"], "biblFull", p.firstChild, 0);
            trs[0].execute({ node: undefined, name: "biblFull" });
        });
    });
});

//# sourceMappingURL=wed-transformation-test.js.map
