var fs = require("fs");
var path = require("path");

/**
 * This function defines ``require.config`` so that evaluating our
 * configuration file will capture the configuration passed to
 * ``require.config``.
 *
 * @param {String} config The text of the configuration file.
 * @returns {Object} The configuration object.
 */
function captureConfigObject(config) {
    var captured;
    var require = {};
    require.config = function (config) {
        captured = config;
    };
    /* jshint evil: true */
    eval(config);
    return captured;
}

function fileAsString(p) {
    return fs.readFileSync(path.resolve(p), "utf8").toString();
}

exports.captureConfigObject = captureConfigObject;
exports.fileAsString = fileAsString;
