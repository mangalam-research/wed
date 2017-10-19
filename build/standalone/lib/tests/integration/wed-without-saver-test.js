define(["require", "exports", "module", "../wed-test-util"], function (require, exports, module, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var options = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/test/test-mode",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
        },
        ajaxlog: {
            url: "/build/ajax/log.txt",
        },
    };
    describe("wed without saver:", function () {
        var setup;
        var editor;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/source_converted.xml", options, document);
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
        // tslint:disable-next-line:no-empty
        it("is able to start", function () { });
    });
});

//# sourceMappingURL=wed-without-saver-test.js.map
