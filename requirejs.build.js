({
    baseUrl: "build/standalone/lib",
    mainConfigFile: "build/config/requirejs-config-dev.js",
    dir: "build/standalone-optimized/lib",
    findNestedDependencies: true,
    removeCombined: true,
    skipDirOptimize: true,
    useStrict: false,
    paths: {
        "browser_test": "empty:"
    },
    modules: [
        {
            name: "wed/wed",
            include: [
                "wed/modes/generic/generic",
                "wed/modes/generic/generic_meta"
            ],
            exclude: [
                "jquery",
                "bootstrap",
                "log4javascript",
                "jquery.bootstrap-growl",
                "pubsub-js",
                "lodash"
            ]
        }
    ]
})
