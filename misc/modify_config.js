'use strict';

var util = require("./util");
var captureConfigObject = util.captureConfigObject;
var fileAsString = util.fileAsString;

var ArgumentParser = require("argparse").ArgumentParser;

var parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: 'Modifies a requirejs config file.'});

parser.addArgument(["-d", "--delete"],
                   { help: "Delete a configuration key. Hierarchichal keys " +
                     "are possible. For instance: config.wed/wed.x would " +
                     "delete the 'x' key in the object associated with the " +
                     "'wed/wed' key in the object associated with the " +
                     "'config' key in the configuration passed to requirejs.",
                     action: "append",
                     dest: "del"});
parser.addArgument(["config"]);

var args = parser.parseArgs();

var config_as_string = fileAsString(args.config);

if (/>>>F<<</.test(config_as_string)) {
    process.stderr.write(
        "the input contains data that might make conversion fail");
    process.exit(1);
}

var config = captureConfigObject(config_as_string);
if (args.del) {
    args.del.forEach(function (x) {
        var parts = x.split('.');
        var step = config;
        parts.slice(0, -1).forEach(function (x) {
            if (step)
                step = step[x];
        });
        if (step)
            delete step[parts[parts.length - 1]];
    });
}

// It is not possible to have the handler output a function as
// something which would create a function object when read back with
// eval. At best, it can be output as a string representation of a
// function. However, any other code which reads the result won't know
// that it is meant to be interpreted as a function, not a string. So
// we replace the value with a placeholder that we then replace with
// the function's text.
//
// Note: this code relies on JSON.stringify calling the replacer
// function in the same order as the order in which its results appear
// in the final JSON.
//
// As of ECMAScript 5th edition, this is the case. (ECMAScript defines
// the algorithm of JSON.stringify.)
//
var functions = [];
var placeholder = ">>>F<<<";
function handler(key, value) {
    if (value instanceof Function) {
        functions.push(value);
        return placeholder;
    }

    return value;
}

var pre = JSON.stringify(config, handler, 4);

var post = pre.replace(new RegExp('"' + placeholder + '"', 'g'),
                       functions.shift.bind(functions));

console.log("require.config(" + post + ");");
