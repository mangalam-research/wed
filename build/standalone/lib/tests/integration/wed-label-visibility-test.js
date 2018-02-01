define(["require", "exports", "../base-config", "../wed-test-util"], function (require, exports, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expect = chai.expect;
    describe("wed label visibility level:", function () {
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
        it("can be reduced using the toolbar", function () {
            // tslint:disable-next-line:no-any
            expect(editor.currentLabelLevel).to.equal(1);
            var button = editor.widget
                .querySelector("[data-original-title='Decrease label visibility level']");
            button.click();
            // tslint:disable-next-line:no-any
            expect(editor.currentLabelLevel).to.equal(0);
        });
        it("can be increased using the toolbar", function () {
            // tslint:disable-next-line:no-any
            expect(editor.currentLabelLevel).to.equal(1);
            var button = editor.widget
                .querySelector("[data-original-title='Increase label visibility level']");
            button.click();
            // tslint:disable-next-line:no-any
            expect(editor.currentLabelLevel).to.equal(2);
        });
    });
});
//# sourceMappingURL=wed-label-visibility-test.js.map