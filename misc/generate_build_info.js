"use strict";

/* eslint-disable no-console */

//
// Safety harness...
//

/* eslint-disable no-console */

function Fatal(msg) {
  this.name = "Fatal";
  this.message = msg;
}
Fatal.prototype = new Error();
Fatal.prototype.constructor = Fatal;

process.on("uncaughtException", (ex) => {
  if (ex instanceof Fatal) {
    process.stderr.write(`${ex.message}\n`);
    process.exit(1);
  }
  else {
    throw ex;
  }
});

//
// Actual logic
//

const { spawn } = require("child_process");
const semver = require("semver");
const { ArgumentParser } = require("argparse");

const parser = new ArgumentParser({
  addHelp: true,
  description: "Generates build information.",
});

parser.addArgument(["--unclean"], {
  help: "Allows building an id on an unclean tree.",
  action: "storeTrue",
});
parser.addArgument(["--module"], {
  help: "Output a module.",
  action: "storeTrue",
});

const args = parser.parseArgs();

let git = spawn("git", ["status", "--porcelain"]);

let uncleanWT = false;
git.stdout.on("data", () => {
  uncleanWT = true;
});

git.on("close", (code) => {
  if (code !== 0) {
    throw new Fatal(`git status exit code: ${code}`);
  }

  if (!args.unclean && uncleanWT) {
    throw new Fatal("Unclean tree. Stopping.");
  }

  git = spawn("git", ["describe", "--match", "v*"],
              { stdio: [null, "pipe", 2] });

  let desc = "";
  git.stdout.on("data", (data) => {
    desc += data;
  });

  git.on("close", (code) => { // eslint-disable-line no-shadow
    if (code !== 0) {
      throw new Fatal(`git describe exit code: ${code}`);
    }

    desc = desc.replace(/^\s+|\s+$/g, "");

    if (uncleanWT) {
      desc += "-unclean";
    }

    const sepIx = desc.indexOf("-");
    const version = (sepIx !== -1) ? desc.slice(1, sepIx) : desc;
    if (!semver.valid(version)) {
      throw new Fatal(`invalid version: ${version}`);
    }

    if (semver.lt(version, "0.10.0")) {
      throw new Fatal("your development branch does not have all the " +
                      "tags; issue a git pull with the --tags option");
    }

    if (args.module) {
      console.log(`define([], function () {
  return {
    desc: '${desc}',
    date: '${new Date()}'
  };
});`);
    }
    else {
      console.log(desc);
    }
  });
});
