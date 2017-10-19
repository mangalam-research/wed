define(["require", "exports", "module", "merge-options", "../base-config", "../wed-test-util"], function (require, exports, module, mergeOptions, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var options = {
        mode: {
            options: {
                hide_attributes: true,
            },
        },
    };
    describe("wed hide attributes:", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", mergeOptions(globalConfig.config, options), document);
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
