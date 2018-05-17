"use strict";

/* eslint-disable no-console */

const { ArgumentParser } = require("argparse");
const { captureConfigObject, fileAsString } = require("./util");

const parser = new ArgumentParser({
  version: "0.2.0",
  addHelp: true,
  description: "Modifies a requirejs config file.",
});

//
// This is a very ad-hoc tool designed to modify our stock requirejs
// configuration to produce one suitable for the generated documentation. It
// expects a file that contains only calls to:
//
// - require.config
//
// - define: this define call must appear only once and the value of the module
//   must be an object. The form of the define must be define({...}).
//
// Key names that begin with ``config`` perform manipulations of the
// module. Otherwise, they perform manipulations of the RequireJS
// configuration. (Note that because of this, this tool cannot operate on the
// "config" part of a RequireJS configuration. However, that way of configuring
// wed has been deprecated, and wed's own codebase no longer uses it.)
//
// Functions may appear in the RequireJS configuration but not in the module.
//

parser.addArgument(["-d", "--delete"], {
  help: "Delete a configuration key. Hierarchichal keys " +
    "are possible.",
  action: "append",
  dest: "del",
});
parser.addArgument(["config"]);

const args = parser.parseArgs();

const configAsString = fileAsString(args.config);

if (/>>>F<<</.test(configAsString)) {
  process.stderr.write(
    "the input contains data that might make conversion fail");
  process.exit(1);
}

function deleteFrom(obj, parts) {
  let step = obj;

  parts.slice(0, -1).forEach((x) => {
    if (step) {
      step = step[x];
    }
  });

  if (step) {
    delete step[parts[parts.length - 1]];
  }
}

const config = captureConfigObject(configAsString);
if (args.del) {
  args.del.forEach((x) => {
    const parts = x.split(".");
    deleteFrom(config[parts[0] === "config" ? "wedConfig" : "requireConfig"],
               parts);
  });
}

// It is not possible to have the handler output a function as something which
// would create a function object when read back with eval. At best, it can be
// output as a string representation of a function. However, any other code
// which reads the result won't know that it is meant to be interpreted as a
// function, not a string. So we replace the value with a placeholder that we
// then replace with the function's text.
//
// Note: this code relies on JSON.stringify calling the replacer function in the
// same order as the order in which its results appear in the final JSON.
//
// As of ECMAScript 5th edition, this is the case. (ECMAScript defines the
// algorithm of JSON.stringify.)
//
const functions = [];
const placeholder = ">>>F<<<";
function handler(key, value) {
  if (value instanceof Function) {
    functions.push(value);
    return placeholder;
  }

  return value;
}

if (config.requireConfig) {
  const pre = JSON.stringify(config.requireConfig, handler, 4);

  const post = pre.replace(new RegExp(`"${placeholder}"`, "g"),
                           functions.shift.bind(functions));

  console.log(`require.config(${post});`);
}

if (config.wedConfig && Object.keys(config.wedConfig).length > 0) {
  console.log(
    `define(${JSON.stringify(config.wedConfig, undefined, 4)});`);
}
