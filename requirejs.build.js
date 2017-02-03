({ // eslint-disable-line no-unused-expressions
  baseUrl: "build/standalone/lib",
  mainConfigFile: "build/config/requirejs-config-dev.js",
  dir: "build/standalone-optimized/lib",
  findNestedDependencies: true,
  removeCombined: true,
  skipDirOptimize: true,
  useStrict: false,
  paths: {
    browser_test: "empty:",
    "wed/config": "empty:",
  },
  modules: [
    {
      name: "lodash",
    },
    {
      name: "jquery",
    },
    {
      name: "wed/wed",
      include: [
        "wed/modes/generic/generic",
        "wed/modes/generic/generic_meta",
        "wed/modes/generic/metas/tei_meta",
      ],
      exclude: [
        "jquery",
        "interact",
        "bootstrap",
        "log4javascript",
        "bootstrap-notify",
        "pubsub-js",
        "lodash",
        "localforage",
        "async",
        "angular",
        "bootbox",
        "typeahead",
        "wed/patches/bootstrap",
      ],
    },
  ],
});
