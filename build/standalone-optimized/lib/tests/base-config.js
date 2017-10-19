define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = {
        schema: "/base/build/schemas/tei-simplified-rng.js",
        mode: {
            path: "wed/modes/test/test-mode",
            options: {
                metadata: "/base/build/schemas/tei-metadata.json",
            },
        },
        // You certainly do not want this in actual deployment.
        ajaxlog: {
            url: "/build/ajax/log.txt",
        },
        // You certainly do not want this in actual deployment.
        save: {
            path: "wed/savers/ajax",
            options: {
                url: "/build/ajax/save.txt",
            },
        },
    };
});

//# sourceMappingURL=base-config.js.map
