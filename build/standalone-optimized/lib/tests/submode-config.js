define(["require", "exports", "module", "./base-config"], function (require, exports, module, base_config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/generic/generic",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
            submode: {
                method: "selector",
                selector: "teiHeader",
                mode: {
                    path: "wed/modes/test/test-mode",
                    options: {
                        metadata: "/base/build/schemas/tei-metadata.json",
                    },
                },
            },
        },
        ajaxlog: base_config_1.config.ajaxlog,
        save: base_config_1.config.save,
    };
});

//# sourceMappingURL=submode-config.js.map
