/**
 * @module kitchen-sink
 * @desc A demo module for wed
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";

  var wed = require("wed/wed");
  var runtime = require("wed/runtime");
  var $ = require("jquery");
  var URI = require("urijs/URI");
  var lr = require("last-resort");
  var onerror = require("wed/onerror");
  var globalConfig = require("global-config");
  var mergeOptions = require("merge-options");
  var Promise = require("bluebird");

  // This installs last-resort on our current window and registers with it
  // wed's error handler.
  var onError = lr.install(window);
  onError.register(onerror.handler);

  var uri = new URI();
  var query = uri.query(true);
  var mode = query.mode;
  var file = query.file;
  var schema = query.schema;
  var options_param = query.options;

  var options = {};
  if (mode) {
    options.mode = { path: mode };
  }

  if (schema) {
    switch (schema) {
    case "@math":
      options.schema = "/build/schemas/tei-math-rng.js";
      options.mode = {
        path: "wed/modes/generic/generic",
        options: {
          metadata: "/build/schemas/tei-math-metadata.json",
        },
      };
      break;
    case "@docbook":
      options.schema = "/build/schemas/docbook.js";
      options.mode = {
        path: "wed/modes/generic/generic",
        options: {
          metadata: "/build/schemas/docbook-metadata.json",
        },
      };
      break;
    default:
      options.schema = schema;
    }
  }

  if (options_param === "noautoinsert") {
    options.mode.options = { autoinsert: false };
  }

  if (options_param === "ambiguous_fileDesc_insert") {
    options.mode.options = { ambiguous_fileDesc_insert: true };
  }

  if (options_param === "fileDesc_insert_needs_input") {
    options.mode.options = { fileDesc_insert_needs_input: true };
  }

  if (options_param === "hide_attributes") {
    options.mode.options = { hide_attributes: true };
  }

  var r = new runtime.Runtime(options);

  var deps = [];
  if (file) {
    deps.push(file);
  }

  var text;
  Promise.all(deps.map(r.resolve.bind(r)))
    .then(function resolved(resolvedDeps) {
      if (deps.length === 0) {
        return;
      }

      var resolvedFile = resolvedDeps[0];
      if (!resolvedFile) {
        throw new Error("did not resolve file! " + deps[0]);
      }

      text = resolvedFile;
    })
    .then(function start() {
      $(function ready() {
        var widget = document.getElementById("widget");
        window.wed_editor = new wed.Editor();
        var finalOptions = mergeOptions({}, globalConfig.config, options);
        window.wed_editor.init(widget, finalOptions, text);
      });
    });
});
