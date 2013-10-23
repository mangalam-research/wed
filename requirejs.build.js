({
    baseUrl: "build/standalone/lib",
    mainConfigFile: "build/config/requirejs-config-dev.js",
    dir: "build/standalone-optimized/lib",
    findNestedDependencies: true,
    removeCombined: true,
    skipDirOptimize: true,
    useStrict: true,
    modules: [
        {
            name: "wed/wed",
            include: [ "wed/modes/generic/generic" ],
            exclude: [
                "jquery",
                "bootstrap",
                "rangy",
                "jquery.bootstrap-growl",
                "log4javascript"
            ]
        }
    ]
})
