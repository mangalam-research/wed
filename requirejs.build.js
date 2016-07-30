({
    baseUrl: "build/standalone/lib",
    mainConfigFile: "build/config/requirejs-config-dev.js",
    dir: "build/standalone-optimized/lib",
    findNestedDependencies: true,
    removeCombined: true,
    skipDirOptimize: true,
    useStrict: false,
    paths: {
        "browser_test": "empty:",
        "wed/config": "empty:",
    },
    modules: [
        {
            name: "lodash"
        },
        {
            name: "jquery"
        },
        {
            name: "wed/wed",
            include: [
                "wed/modes/generic/generic",
                "wed/modes/generic/generic_meta",
                "wed/modes/generic/metas/tei_meta"
            ],
            exclude: [
                "jquery",
                "interact",
                "bootstrap",
                "log4javascript",
                "jquery.bootstrap-growl",
                "pubsub-js",
                "lodash",
                "localforage",
                "async",
                "angular",
                "bootbox",
                "typeahead"
            ]
        }
    ],
    // This prevents a problem in rangy 1.3alpha804 and later. We
    // basically do not want it to use its internal AMD support
    // because it cannot be optimized.
    onBuildWrite: function (moduleName, path, contents) {
        if (moduleName === "external/rangy/rangy-core") {
            // This temporary undefines define.
            return "(function () { var __wed_saved_define = define; \n" +
                "define = undefined;" + contents +
                "define = __wed_saved_define; })()";
        }
        return contents;
    }
})
