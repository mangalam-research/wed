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

var config = captureConfigObject(fileAsString(args.config));
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
console.log("require.config(" +
            JSON.stringify(config, null, 4) +
           ");");
