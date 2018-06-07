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
    var expect = chai.expect;
    describe("wed label visibility level:", function () {
        var setup;
        var editor;
        var caretManager;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
                caretManager = editor.caretManager;
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