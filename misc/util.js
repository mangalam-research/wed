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
    if (typeof name !== "string" ||
        typeof obj !== "object" ||
        name !== "wed/config" ||
        arguments.length > 2) {
      throw new Error("captureConfigObject is designed to capture only " +
                      "a single define call that defines `wed/config`.");
    }

    if (wedConfig !== undefined) {
      throw new Error("`wed/config` defined more than once");
    }

    wedConfig = obj;
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
