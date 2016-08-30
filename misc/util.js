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

    var wedConfig = undefined;
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
    /* jshint evil: true */
    eval(config);
    return {
        requireConfig: captured,
        wedConfig: wedConfig
    };
}

function fileAsString(p) {
    return fs.readFileSync(path.resolve(p), "utf8").toString();
}

exports.captureConfigObject = captureConfigObject;
exports.fileAsString = fileAsString;
