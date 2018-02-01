/**
 * Metadata management CLI tool.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "ajv", "argparse", "fs", "js-yaml", "path", "../modes/generic/doc-pattern", "../modes/generic/metadata-schema.json", "../util"], function (require, exports, Ajv, argparse_1, fs, yaml, path, doc_pattern_1, schema, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:completed-docs
    var Fatal = /** @class */ (function (_super) {
        __extends(Fatal, _super);
        function Fatal(msg) {
            var _this = _super.call(this, msg) || this;
            _this.name = "Fatal";
            _this.message = msg;
            util_1.fixPrototype(_this, Fatal);
            return _this;
        }
        return Fatal;
    }(Error));
    var prog = path.basename(process.argv[1]);
    // tslint:disable-next-line:no-any
    process.on("uncaughtException", function (ex) {
        if (ex instanceof Fatal) {
            process.stderr.write(prog + ": " + ex.message + "\n");
            process.exit(1);
        }
        else {
            throw ex;
        }
    });
    //
    // Actual logic
    //
    function fileAsString(p) {
        return fs.readFileSync(path.resolve(p), "utf8").toString();
    }
    // tslint:disable-next-line:no-any
    function parseFile(name, data) {
        var ret;
        try {
            ret = JSON.parse(data);
        }
        // tslint:disable-next-line:no-empty
        catch (ex) { }
        if (ret !== undefined) {
            return ret;
        }
        try {
            ret = yaml.safeLoad(data, {
                schema: yaml.JSON_SCHEMA,
            });
        }
        // tslint:disable-next-line:no-empty
        catch (ex) { }
        if (ret !== undefined) {
            return ret;
        }
        throw new Fatal("cannot parse " + name);
    }
    var parser = new argparse_1.ArgumentParser({
        addHelp: true,
        description: "Generates a JSON file suitable for using as the " +
            "``metadata`` option for a generic Meta object. The input file must " +
            "be a JSON file in the format produced by TEI's odd2json.xsl " +
            "transformation.",
    });
    parser.addArgument(["input"], { help: "Input file." });
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
    var args = parser.parseArgs();
    var output = {
        generator: prog,
        date: new Date().toISOString(),
        version: "2",
    };
    if (args.tei) {
        var inputData = fileAsString(args.input);
        var parsed = parseFile(args.input, inputData);
        output.namespaces = {
            // tslint:disable-next-line:no-http-string
            "": "http://www.tei-c.org/ns/1.0",
        };
        var members = parsed.members;
        var i = void 0;
        for (i = members.length - 1; i >= 0; i--) {
            // Delete class specs
            if (members[i].type !== "elementSpec") {
                members.splice(i, 1);
            }
        }
        var elements = [];
        for (var _i = 0, members_1 = members; _i < members_1.length; _i++) {
            var member = members_1[_i];
            elements.push({
                name: member.ident,
                desc: member.desc,
                ns: member.ns,
            });
        }
        output.elements = elements;
    }
    else {
        if (args.merge === undefined) {
            args.merge = [args.input];
        }
        else {
            args.merge.unshift(args.input);
        }
    }
    for (var _a = 0, _b = args.merge; _a < _b.length; _a++) {
        var toMerge = _b[_a];
        var data = fileAsString(toMerge);
        var parsedMerge = parseFile(toMerge, data);
        if (parsedMerge.version !== "2") {
            throw new Fatal("files must follow metadata version 2");
        }
        if (parsedMerge.generator !== undefined || parsedMerge.date !== undefined) {
            throw new Error("generator or date in a file consumed by this tool is invalid");
        }
        if (parsedMerge.namespaces !== undefined &&
            parsedMerge.namespaces.xml !== undefined) {
            throw new Error("trying to set the xml namespace");
        }
        // tslint:disable-next-line:forin
        for (var key in parsedMerge) {
            // tslint:disable-next-line:no-any
            output[key] = parsedMerge[key];
        }
    }
    var ajv = new Ajv();
    var validator = ajv.compile(schema);
    var valid = validator(output);
    if (!valid) {
        if (validator.errors !== undefined) {
            for (var _c = 0, _d = validator.errors; _c < _d.length; _c++) {
                var error = _d[_c];
                // tslint:disable-next-line:no-console
                console.log(error);
            }
        }
        throw new Fatal("output is not valid");
    }
    if (output.dochtml !== undefined) {
        if (output.dochtml.method === "simple-pattern") {
            doc_pattern_1.compile(output.dochtml.pattern);
        }
        else {
            throw new Fatal("unknown method: " + output.dochtml.method);
        }
    }
    var stringified = JSON.stringify(output, undefined, args.pretty ? 2 : undefined);
    if (args.output !== undefined) {
        fs.writeFileSync(args.output, stringified);
    }
    else {
        // tslint:disable-next-line:no-console
        console.log(stringified);
    }
});
//  LocalWords:  CLI MPL uncaughtException utf TEI's json xsl stdout tei
//  LocalWords:  storeTrue elementSpec
//# sourceMappingURL=wed-metadata.js.map