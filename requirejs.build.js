({ // eslint-disable-line no-unused-expressions
  baseUrl: "build/standalone/lib",
  mainConfigFile: "build/config/requirejs-config-dev.js",
  dir: "build/standalone-optimized/lib",
  findNestedDependencies: true,
  removeCombined: true,
  skipDirOptimize: true,
  useStrict: false,
  paths: {
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
      ],
      exclude: [
        "jquery",
        "interact",
        "bootstrap",
        "log4javascript",
        "bootstrap-notify",
        "lodash",
        "localforage",
        "bootbox",
        "typeahead",
        "wed/patches/bootstrap",
        "dexie",
        "bluebird",
        "bluejax",
      ],
    },
  ],
});
