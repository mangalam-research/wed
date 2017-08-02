"use strict";
var tsconfigPath = "./test/tsconfig.json";
require("ts-node").register({
  project: tsconfigPath,
});

var tsconfig = require("./tsconfig.json");
require("tsconfig-paths").register({
  baseUrl: "./test/",
  paths: tsconfig.compilerOptions.paths,
});

require("amd-loader");
