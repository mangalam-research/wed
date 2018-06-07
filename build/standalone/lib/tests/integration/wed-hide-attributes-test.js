var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "merge-options", "../base-config", "../wed-test-util"], function (require, exports, merge_options_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    merge_options_1 = __importDefault(merge_options_1);
    globalConfig = __importStar(globalConfig);
    var options = {
        mode: {
            options: {
                hide_attributes: true,
            },
        },
    };
    describe("wed hides attributes:", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", merge_options_1.default(globalConfig.config, options), document);
            (editor = setup.editor);
            return setup.init().then(function () {
                // tslint:disable-next-line:no-any
                editor.validator._validateUpTo(editor.dataRoot, -1);
            });
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        // We don't put this with wed-validation-error-test because it is not
        // specifically checking the validation code but is an overall smoketest.
        it("is able to start", function () {
            return editor.firstValidationComplete;
        });
    });
});
//# sourceMappingURL=wed-hide-attributes-test.js.map