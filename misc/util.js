"use strict";

const fs = require("fs");
const path = require("path");

/**
 * This function defines ``require.config`` so that evaluating our
 * configuration file will capture the configuration passed to
 * ``require.config``.
 *
 * @param {String} config The text of the configuration file.
 * @returns {Object} The configuration object.
 */
function captureConfigObject(config) {
  let captured;
  const require = {};
  require.config = function _config(conf) {
    captured = conf;
  };

  let wedConfig;

  // eslint-disable-next-line no-unused-vars
  function define(name, obj) {
    if (wedConfig !== undefined) {
      throw new Error("more than one define");
    }

    switch (arguments.length) {
    case 0:
      throw new Error("no arguments to the define!");
    case 1:
      if (typeof name !== "object") {
        throw new Error("if define has only one argument, it must be an " +
                        "object");
      }
      wedConfig = name;
      break;
    default:
      throw new Error("captureConfigObject is designed to capture a " +
                      "maximum of two arguments.");
    }
  }

  eval(config); // eslint-disable-line no-eval
  return {
    requireConfig: captured,
    wedConfig,
  };
}

function fileAsString(p) {
  return fs.readFileSync(path.resolve(p), "utf8").toString();
}

exports.captureConfigObject = captureConfigObject;
exports.fileAsString = fileAsString;
