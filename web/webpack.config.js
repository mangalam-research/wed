/* global __dirname */
"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const sourceDir = "./web";

function correctPath(x) {
  return path.resolve(__dirname, path.join(sourceDir, x));
}

const externals = {};
["jquery", "bootstrap", "dexie", "wed/log", "wed/mode-map", "wed/meta-map",
 // These need to be out of the bundle because they are loaded by the
 // kitchen-sink. dashboard/store needs the rest.
 "dashboard/store", "dashboard/xml-file", "dashboard/chunk",
 "dashboard/pack", "dashboard/meta", "dashboard/metadata",
 "dashboard/store-util"]
  .forEach((name) => {
    externals[name] = name;
  });

module.exports = {
  context: path.join(__dirname, sourceDir),
  resolve: {
    modules: [".", "node_modules"],
    extensions: [".ts", ".tsx", ".js"],
  },
  entry: {
    dashboard: "dashboard.ts",
    "dashboard/store": "dashboard/store.ts",
    "dashboard/xml-file": "dashboard/xml-file.ts",
    "wed-store": "wed-store.js",
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: ["ts-loader", "angular2-template-loader"],
    }, {
      test: /\.(html|css)$/,
      loader: "raw-loader"
    }, ],
  },
  externals: function makeExternals(context, request, callback) {
    // If the request is relative to the module it is in, we want to turn it
    // into something relative to our sourceDir. This allows handling a request
    // to "./store" made in a module located in "dashboard/" the same as a
    // request to "dashboard/store" made from outside dashboard.
    if (request[0] === ".") {
      request = path.relative(sourceDir, path.join(context, request));
    }

    if (request in externals) {
      callback(null, externals[request]);
      return;
    }

    callback();
  },
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "../build/standalone/lib/"),
    filename: "[name].js",
    sourceMapFilename: "[name].map.js",
    libraryTarget: "amd",
  },
  plugins: [
    new CopyWebpackPlugin([{ from: "{kitchen-sink,global-config}.js",
                             // There seem to be a bug in CopyWebpackPlugin
                             // which requires setting the context to this
                             // stupid value.
                             context: path.join(__dirname)}]),
  ],
};
