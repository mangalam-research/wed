define(["require", "exports", "module", "wed/key-constants", "../base-config", "../wed-test-util"], function (require, exports, module, keyConstants, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed undo redo:", function () {
        var setup;
        var editor;
        var caretManager;
        var ps;
        var titles;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
                ps = editor.guiRoot.querySelectorAll(".body .p");
                titles = editor.guiRoot.getElementsByClassName("title");
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
        it("undo undoes typed text as a group", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            // There was a version of wed which would fail this test. The fake caret
            // would be inserted inside the text node, which would throw off the
            // nodeToPath/pathToNode calculations.
            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd", "text after edit");
            assert.equal(parent.childNodes.length, 3);
            editor.undo();
            assert.equal(initial.nodeValue, "abcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            wed_test_util_1.caretCheck(editor, initial, 0, "caret after undo");
        });
        it("undo undoes typed text as a group (inside element)", function () {
            // Text node inside title.
            var title = titles[0];
            var titleData = $.data(title, "wed_mirror_node");
            var trs = editor.modeTree.getMode(titleData.firstChild)
                .getContextualActions(["insert"], "hi", titleData.firstChild, 2);
            caretManager.setCaret(titleData.firstChild, 2);
            trs[0].execute({ node: undefined, name: "hi" });
            editor.type("a");
            var hi = titleData.firstElementChild;
            var hiText = hi.firstChild;
            assert.equal(hiText.textContent, "a", "text after edit");
            assert.equal(titleData.childNodes.length, 3);
            editor.undo();
            editor.type(keyConstants.CTRLEQ_Z);
        });
        it("redo redoes typed text as a group", function () {
            // Text node inside title.
            var initial = titles[0].childNodes[1];
            var parent = initial.parentNode;
            caretManager.setCaret(initial, 0);
            // There was a version of wed which would fail this test. The fake caret
            // would be inserted inside the text node, which would throw off the
            // nodeToPath/pathToNode calculations.
            editor.type("blah");
            assert.equal(initial.nodeValue, "blahabcd", "text after edit");
            assert.equal(parent.childNodes.length, 3);
            editor.undo();
            assert.equal(initial.nodeValue, "abcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            wed_test_util_1.caretCheck(editor, initial, 0, "caret after undo");
            editor.redo();
            assert.equal(initial.nodeValue, "blahabcd", "text after undo");
            assert.equal(parent.childNodes.length, 3);
            wed_test_util_1.caretCheck(editor, initial, 4, "caret after redo");
        });
        it("undoing an attribute value change undoes the value change", function () {
            var initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            caretManager.setCaret(initial, 4);
            assert.equal(initial.data, "rend_value", "initial value");
            editor.type("blah");
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "rendblah_value");
            wed_test_util_1.caretCheck(editor, initial, 8, "caret after text insertion");
            // Check that the data is also modified
            var dataNode = editor.toDataNode(initial);
            assert.equal(dataNode.value, "rendblah_value");
            editor.undo();
            // We have to refetch because the decorations have been redone.
            initial = wed_test_util_1.getAttributeValuesFor(ps[7])[0].firstChild;
            assert.equal(initial.data, "rend_value");
            wed_test_util_1.caretCheck(editor, initial, 4, "caret after undo");
            // Check that the data change has been undone.
            assert.equal(dataNode.value, "rend_value", "value undone");
        });
        it("undoing an attribute addition undoes the addition", function () {
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
            editor.undo();
            assert.equal(wed_test_util_1.getAttributeValuesFor(p).length, 0, "no attributes");
            // We would ideally want the caret to be back in the element name but
            // there's currently an issue with doing this.
            wed_test_util_1.caretCheck(editor, p, 1, "the caret should be in a reasonable position");
        });
        it("undoing an attribute deletion undoes the deletion", function () {
            var p = ps[7];
            var dataP = editor.toDataNode(p);
            var attrNames = wed_test_util_1.getAttributeNamesFor(p);
            var attrValues = wed_test_util_1.getAttributeValuesFor(p);
            var initialValue = attrValues[0].textContent;
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
            editor.undo();
            attrValues = wed_test_util_1.getAttributeValuesFor(p);
            attrNames = wed_test_util_1.getAttributeNamesFor(p);
            assert.equal(attrValues.length, initialLength, "the attribute should be back");
            assert.equal(attrNames[0].textContent, decodedName, "the first attribute should be the one that was deleted");
            assert.equal(attrValues[0].textContent, initialValue, "the attribute should have its initial value");
            wed_test_util_1.caretCheck(editor, attrValues[0].firstChild, 0, "the caret should be in the first attribute value");
        });
    });
});

//# sourceMappingURL=wed-undo-redo-test.js.map
