'use strict';

//
// Safety harness...
//


function Fatal(msg) {
    this.name = "Fatal";
    this.message = msg;
}
Fatal.prototype = new Error();
Fatal.prototype.constructor = Fatal;

process.on('uncaughtException', function (ex) {
    if (ex instanceof Fatal) {
        process.stderr.write(ex.message + "\n");
        process.exit(1);
    }
    else
        throw ex;
});

//
// Actual logic
//

var spawn = require("child_process").spawn;
var semver = require("semver");
var util = require("util");
var ArgumentParser = require("argparse").ArgumentParser;

var parser = new ArgumentParser({
    addHelp: true,
    description: 'Generates build information.'});

parser.addArgument(["--unclean"],
                   { help: "Allows building an id on an unclean tree.",
                     action: "storeTrue" });
parser.addArgument(["--module"],
                   { help: "Output a module.",
                     action: "storeTrue"});

var args = parser.parseArgs();

var git = spawn("git", ["status", "--porcelain"]);

var unclean_wt = false;
git.stdout.on('data', function (data) {
    unclean_wt = true;
});

git.on('close', function (code) {
    if (code !== 0)
        throw new Fatal("git status exit code: " + code);

    if (!args.unclean && unclean_wt)
        throw new Fatal("Unclean tree. Stopping.");

    git = spawn("git", ["describe", "--match", "v*"],
                { stdio: [null, "pipe", 2] });

    var desc = "";
    git.stdout.on('data', function (data) {
        desc += data;
    });

    git.on('close', function (code) {
        if (code !== 0)
            throw new Fatal("git describe exit code: " + code);

        desc = desc.replace(/^\s+|\s+$/g, '');

        if (unclean_wt)
            desc += "-unclean";

        var version = desc.slice(1, desc.indexOf("-"));
        if (!semver.valid(version))
            throw new Fatal("invalid version: " + version);

        if (semver.lt(version, '0.10.0'))
            throw new Fatal("your development branch does not have all the " +
                            "tags; issue a git pull with the --tags option");

        if (args.module)
            console.log("define([], function () {\n" +
                        "return {\n" +
                        "    desc: '" + desc + "',\n" +
                        "    date: '" + new Date() + "'\n" +
                        "};\n" +
                        "});\n");
        else
            console.log(desc);
    });
});
