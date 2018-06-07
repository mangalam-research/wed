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
    describe("wed gui:", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", globalConfig.config, document);
            (editor = setup.editor);
            return setup.init();
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        describe("setNavigationList", function () {
            var $navigationPanel;
            before(function () {
                // tslint:disable-next-line:no-any
                $navigationPanel = editor.$navigationPanel;
            });
            it("makes the navigation list appear", function () {
                assert.equal($navigationPanel.css("display"), "none", "the list is not displayed");
                editor.setNavigationList([]);
                assert.equal($navigationPanel.css("display"), "block", "the list is displayed");
            });
        });
    });
});
//# sourceMappingURL=wed-gui-test.js.map