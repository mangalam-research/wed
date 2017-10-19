/**
 * Metadata management CLI tool.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import * as Ajv from "ajv";
import { ArgumentParser } from "argparse";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

import { compile } from "../modes/generic/doc-pattern";
import { Metadata } from "../modes/generic/metadata-as-json";
// tslint:disable-next-line:no-require-imports import-name
import schema = require("../modes/generic/metadata-schema.json");
import { fixPrototype } from "../util";

// tslint:disable-next-line:completed-docs
class Fatal extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "Fatal";
    this.message = msg;
    fixPrototype(this, Fatal);
 }
}

const prog = path.basename(process.argv[1]);

// tslint:disable-next-line:no-any
process.on("uncaughtException", (ex: any) => {
  if (ex instanceof Fatal) {
    process.stderr.write(`${prog}: ${ex.message}\n`);
    process.exit(1);
  }
  else {
    throw ex;
  }
});

//
// Actual logic
//

function fileAsString(p: string): string {
  return fs.readFileSync(path.resolve(p), "utf8").toString();
}

// tslint:disable-next-line:no-any
function parseFile(name: string, data: string): any {
  let ret;

  try {
    ret = JSON.parse(data);
  }
  // tslint:disable-next-line:no-empty
  catch (ex) {}

  if (ret !== undefined) {
    return ret;
  }

  try {
    ret = yaml.safeLoad(data, {
      schema: yaml.JSON_SCHEMA,
    });
  }
  // tslint:disable-next-line:no-empty
  catch (ex) {}

  if (ret !== undefined) {
    return ret;
  }

  throw new Fatal(`cannot parse ${name}`);
}

const parser = new ArgumentParser({
  addHelp: true,
  description: "Generates a JSON file suitable for using as the " +
    "``metadata`` option for a generic Meta object. The input file must " +
    "be a JSON file in the format produced by TEI's odd2json.xsl " +
    "transformation.",
});

parser.addArgument(["input"],
                   { help: "Input file." });

parser.addArgument(["output"], {
  help: "Output file. If absent, outputs to stdout.",
  nargs: "?",
});

parser.addArgument(["--tei"], {
  help: "Treat the input as a TEI JSON file produced by TEI's odd2json.xsl.",
  action: "storeTrue",
});

parser.addArgument(["-p", "--pretty"], {
  help: "Pretty print the final JSON.",
  action: "storeTrue",
});

parser.addArgument(["--merge"], {
  help: "Add a file to shallow merge with the generated output.",
  action: "append",
  defaultValue: [],
});

const args = parser.parseArgs();

const output: Partial<Metadata> = {
  generator: prog,
  date: new Date().toISOString(),
  version: "2",
};

if (args.tei as boolean) {
  const inputData = fileAsString(args.input);
  const parsed = parseFile(args.input, inputData);

  output.namespaces = {
    // tslint:disable-next-line:no-http-string
    "": "http://www.tei-c.org/ns/1.0",
  };

  const members = parsed.members;
  let i;
  for (i = members.length - 1; i >= 0; i--) {
    // Delete class specs
    if (members[i].type !== "elementSpec") {
      members.splice(i, 1);
    }
  }

  for (const member of members) {
    delete member.type;
    delete member.module;
    delete member.classes;
    delete member.model;
    delete member.attributes;
    delete member.classattributes;
    member.name = member.ident;
    member.desc = member.desc;
    delete member.ident;
  }

  output.elements = members;
}
else {
  if (args.merge === undefined) {
    args.merge = [args.input];
  }
  else {
    args.merge.unshift(args.input);
  }
}

for (const toMerge of args.merge) {
  const data = fileAsString(toMerge);
  const parsedMerge = parseFile(toMerge, data);

  if (parsedMerge.version !== "2") {
    throw new Fatal("files must follow metadata version 2");
  }

  if (parsedMerge.generator !== undefined || parsedMerge.date !== undefined) {
    throw new Error(
      "generator or date in a file consumed by this tool is invalid");
  }

  if (parsedMerge.namespaces !== undefined &&
      parsedMerge.namespaces.xml !== undefined) {
    throw new Error("trying to set the xml namespace");
  }

  // tslint:disable-next-line:forin
  for (const key in parsedMerge) {
    // tslint:disable-next-line:no-any
    (output as any)[key] = parsedMerge[key];
  }
}

const ajv = new Ajv();
const validator = ajv.compile(schema);
const valid = validator(output);
if (!(valid as boolean)) {
  if (validator.errors !== undefined) {
    for (const error of validator.errors) {
      // tslint:disable-next-line:no-console
      console.log(error);
    }
  }
  throw new Fatal("output is not valid");
}

if (output.dochtml !== undefined) {
  if (output.dochtml.method === "simple-pattern") {
    compile(output.dochtml.pattern);
  }
  else {
    throw new Fatal(`unknown method: ${output.dochtml.method}`);
  }
}

const stringified = JSON.stringify(output, undefined,
                                   (args.pretty as boolean) ? 2 : undefined);

if (args.output !== undefined) {
  fs.writeFileSync(args.output, stringified);
}
else {
  // tslint:disable-next-line:no-console
  console.log(stringified);
}

//  LocalWords:  CLI MPL uncaughtException utf TEI's json xsl stdout tei
//  LocalWords:  storeTrue elementSpec
