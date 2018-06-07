#!/usr/bin/env node

"use strict";

/* eslint-disable no-console */

//
// This is a server designed SOLELY to perform wed testing. It serves
// two hierarchies:
//
// - One rooted at '/' (and which excludes '/forever') that uses
//   modification dates to control caching. This one is useful for
//   quickly checking modifications in development.
//
// - One rooted at '/forever' that sets files to "never" expire. This
//   one is used for automated testing. (In fact they expire 10 years
//   from now, which for the purpose of a test is "never".)
//

const express = require("express");
const http = require("http");
const compression = require("compression");
const serveStatic = require("serve-static");
const path = require("path");
const url = require("url");
const fs = require("fs");
const querystring = require("querystring");
const crypto = require("crypto");
const morgan = require("morgan");
const { ArgumentParser } = require("argparse");

const parser = new ArgumentParser({
  addHelp: true,
  description: "Starts a server to run the in-browser tests for wed.",
});

parser.addArgument(["-v", "--verbose"], {
  help: "Run verbosely.",
  action: "storeTrue",
});

parser.addArgument(["address"], {
  nargs: "?",
});

const args = parser.parseArgs();
const { verbose, address } = args;
let ip;
let port;
if (address) {
  [ip, port] = address.split(":");
}
const cwd = process.cwd();

if (args.mode === "browser") {
  args.visible = true;
}

// Yes, setting the expiration date at the start and never changing it
// is sloppy... but this is not meant to be a production server.
const tenYears = 315360000; // 10 years, in seconds
const expiration = new Date(Date.now() + (tenYears * 1000)).toUTCString();

const app = express();

app.use(compression());
app.use(serveStatic(cwd));
app.use("/forever", serveStatic(cwd, {
  setHeaders(res) {
    res.setHeader("Cache-Control", `private, max-age=${tenYears}`);
    res.setHeader("Expires", expiration);
  },
}));

if (verbose) {
  const logFile = process.stdout;
  app.use(morgan({ stream: logFile }));
}

function writeResponse(response, status, data, type, headers) {
  if (verbose) {
    console.log("response message:", data);
  }

  type = type || "text/plain";

  headers = headers || {};
  headers["Content-Type"] = type;

  response.writeHead(status, headers);

  if (data) {
    if (type !== "text/plain") {
      response.write(data, "binary");
    }
    else {
      response.write(data);
    }
  }
  response.end();
}

function dumpData(request, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }

  options = options || {
    dump: true,
  };

  const uri = url.parse(request.url).pathname;
  const filename = path.join(cwd, uri);
  const chunks = [];
  request.on("data", (chunk) => {
    chunks.push(chunk.toString());
  });

  request.on("end", () => {
    const body = chunks.join("");
    let decoded;
    if (request.is("application/x-www-form-urlencoded")) {
      decoded = querystring.parse(body);
    }
    else if (request.is("json")) {
      decoded = JSON.parse(body);
    }
    else {
      throw new Error(`cannot handle content-type: \
${request.get("Content-Type")}`);
    }

    if (options.dump) {
      const writable = fs.createWriteStream(filename, { flags: "a" });
      writable.write("\n***\n", () => {
        if (verbose) {
          console.log("decoded body", decoded);
        }
        writable.write(JSON.stringify(decoded));
        writable.end();
      });
    }

    if (callback) {
      callback(decoded);
    }
  });
}

function makePaths(strs) {
  if (!(strs instanceof Array)) {
    strs = [strs];
  }

  const ret = [];
  strs.forEach((x) => {
    ret.push(x, `/forever${x}`);
  });
  return ret;
}

app.post(makePaths("/build/ajax/log.txt"), (request, response) => {
  dumpData(request);
  writeResponse(response, 200, "{}", "application/json");
});

app.post(makePaths("/build/ajax/save.txt"), (request, response) => {
  dumpData(request, (decoded) => {
    let headers;
    const messages = [];
    function success() {
      messages.push({ type: "save_successful" });
      const hash = crypto.createHash("md5");
      hash.update(decoded.data);
      headers = { ETag: hash.digest("base64") };
    }
    let status = 200;
    switch (decoded.command) {
    case "check":
      break;
    case "save":
    case "autosave":
    case "recover":
      success();
      break;
    default:
      status = 400;
    }
    const msg = { messages };
    const stringified = JSON.stringify(msg);
    writeResponse(response, status, stringified, "application/json", headers);
  });
});

// Setting up the test environment requires getting *any* page from the server
// in some cases. It does not matter what the content of the page is. This
// serves the purpose.
app.get(makePaths("/blank"), (request, response) => {
  response.end();
});

function runserver() {
  if (!ip) {
    const server = http.createServer(app).listen();
    ip = "0.0.0.0";
    ({ port } = server.address());
    app.set("port", port);
  }
  else {
    app.listen(port, ip);
  }
}

function unlinkIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

unlinkIfExists(path.join(cwd, "/build/ajax/log.txt"));
unlinkIfExists(path.join(cwd, "/build/ajax/save.txt"));

runserver();

//  LocalWords:  url querystring ajax txt json
