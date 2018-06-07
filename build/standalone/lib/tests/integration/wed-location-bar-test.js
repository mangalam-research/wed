var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "../base-config", "../wed-test-util"], function (require, exports, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("wed location bar", function () {
        var setup;
        var editor;
        var caretManager;
        var locationBar;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                caretManager = editor.caretManager;
                // tslint:disable-next-line:no-any
                locationBar = editor.wedLocationBar;
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
            // tslint:disable-next-line:no-any
            locationBar = undefined;
        });
        it("ignores placeholders", function () {
            var ph = editor.guiRoot.getElementsByClassName("_placeholder")[0];
            caretManager.setCaret(ph, 0);
            assert.equal(
            // Normalize all spaces to a regular space with ``replace``.
            locationBar.textContent.replace(/\s+/g, " "), "@ TEI / teiHeader / fileDesc / publicationStmt / p ");
        });
        it("ignores phantom parents", function () {
            var p = editor.guiRoot.querySelector(".ref>._text._phantom");
            // We are cheating here. Instead of creating a mode what would put
            // children elements inside of a phantom element we manually add a child.
            // tslint:disable-next-line:no-inner-html
            p.innerHTML = "<span>foo</span>" + p.innerHTML;
            caretManager.setCaret(p.firstChild, 0);
            assert.equal(
            // Normalize all spaces to a regular space with ``replace``.
            locationBar.textContent.replace(/\s+/g, " "), "@ TEI / text / body / p / ref ");
        });
    });
});
//# sourceMappingURL=wed-location-bar-test.js.map