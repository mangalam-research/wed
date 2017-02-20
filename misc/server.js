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

const childProcess = require("child_process");
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
const webdriver = require("selenium-webdriver");
const ArgumentParser = require("argparse").ArgumentParser;
const colors = require("colors/safe");
const headless = require("headless");

const parser = new ArgumentParser({
  addHelp: true,
  description: "Starts a server to run the in-browser tests for wed." });

parser.addArgument(["-v", "--verbose"], {
  help: "Run verbosely.",
  action: "storeTrue",
});

parser.addArgument(["--visible"], {
  help: "Do not hide the browser.",
  action: "storeTrue",
});

parser.addArgument(["--grep"], {
  help: "Grep through the tests. (This is passed to Mocha.)",
});


parser.addArgument(["mode"], {
  choices: ["browser", "runner", "server"],
});

parser.addArgument(["address"], {
  nargs: "?",
});

const args = parser.parseArgs();
const verbose = args.verbose;
const address = args.address;
let ip;
let port;
if (address) {
  const parts = address.split(":");
  ip = parts[0];
  port = parts[1];
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

function unlinkIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

let failOnSave = false;
let failOnRecover = false;
let preconditionFailOnSave = false;
let tooOldOnSave = false;
let noResponseOnSave = false;
let noResponseOnRecover = false;

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
      throw new Error(`cannot handle content-type: ${
                      request.get("Content-Type")}`);
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
      if (!noResponseOnSave) {
        if (tooOldOnSave) {
          messages.push({ type: "version_too_old_error" });
        }

        if (preconditionFailOnSave) {
          status = 412;
        }
        else if (failOnSave) {
          status = 400;
        }
        else {
          success();
        }
      }
      break;
    case "recover":
      if (!noResponseOnRecover) {
        if (!failOnRecover) {
          success();
        }
        else {
          status = 400;
        }
      }
      break;
    default:
      status = 400;
    }
    const msg = { messages };
    const stringified = JSON.stringify(msg);
    writeResponse(response, status, stringified, "application/json", headers);
  });
});

app.post(makePaths("/build/ajax/control"), (request, response) => {
  dumpData(request, (decoded) => {
    let status = 200;
    switch (decoded.command) {
    case "reset":
      unlinkIfExists(path.join(cwd, "/build/ajax/log.txt"));
      unlinkIfExists(path.join(cwd, "/build/ajax/save.txt"));
      unlinkIfExists(path.join(cwd, "/build/ajax/control"));
      failOnSave = false;
      failOnRecover = false;
      preconditionFailOnSave = false;
      tooOldOnSave = false;
      noResponseOnSave = false;
      noResponseOnRecover = false;
      break;
    case "fail_on_save":
      failOnSave = decoded.value;
      break;
    case "precondition_fail_on_save":
      preconditionFailOnSave = decoded.value;
      break;
    case "too_old_on_save":
      tooOldOnSave = decoded.value;
      break;
    case "fail_on_recover":
      failOnRecover = decoded.value;
      break;
    case "no_response_on_save":
      noResponseOnSave = decoded.value;
      break;
    case "no_response_on_recover":
      noResponseOnRecover = decoded.value;
      break;
    case "ping":
      break;
    default:
      status = 400;
    }
    writeResponse(response, status, "{}", "application/json");
  });
});

app.post(makePaths("/test-results"), (request, response) => {
  dumpData(request, { dump: false }, (decoded) => {
    writeResponse(response, 200, "{}", "application/json");
    app.emit("test-result", decoded);
  });
});

app.get(makePaths(["/build/standalone/dashboard",
                   "/build/standalone-optimized/dashboard"]),
        (request, response) => {
          response.redirect(`${request.path}/index.html`);
        });

app.get(makePaths(["/build/standalone/dashboard/*",
                   "/build/standalone-optimized/dashboard/*"]),
        (request, response) => {
          response.redirect(`${request.path}`.replace(/dashboard\/.*$/,
                                                      "dashboard/"));
        });

// Setting up the test environment requires getting *any* page from
// the server in some cases. It does not matter what the content of
// the page is. This serves the purpose.
app.get(makePaths("/blank"), (request, response) => {
  response.end();
});

function runserver() {
  if (!ip) {
    const server = http.createServer(app).listen();
    ip = "0.0.0.0";
    port = server.address().port;
    app.set("port", port);
  }
  else {
    app.listen(port, ip);
  }
  let driver;
  let xvfb;
  let failures = [];
  app.on("test-result", (result) => {
    switch (result[0]) {
    case "start":
      failures = [];
      break;
    case "fail":
      failures.push(result);
      process.stdout.write(colors.red("."));
      break;
    case "pass":
      process.stdout.write(".");
      break;
    case "end": {
      console.log("\n");
      for (const failure of failures) {
        const error = failure[1];
        console.log(colors.red(`Failed test: ${error.fullTitle}`));
        if (error.err.stack) {
          console.log(colors.red("Stack trace: "));
          console.log(colors.red(error.err.stack.replace(/^/gm, "    ")));
        }
        else {
          let err = error.err;
          err = (typeof err !== "string") ? JSON.stringify(err, undefined, 4) :
            err.replace(/^/gm, "    ");
          console.log(colors.red("Error: "));
          console.log(colors.red(err));
        }
      }
      const stats = result[1];
      const d = new Date(0, 0, 0, 0, 0, 0, stats.duration);
      console.log(`Elapsed: ${d.getHours()}h${d.getMinutes()
}m${d.getSeconds()}s`);
      if (stats.failures > 0) {
        console.log(colors.red(`Failures: ${stats.failures}`));
      }
      console.log(`Total: ${stats.tests}`);
      if (args.mode === "runner") {
        driver.quit().then(() => {
          if (xvfb) {
            xvfb.kill();
          }
          process.exit(result.failures ? 1 : 0);
        });
      }
      break;
    }
    default:
      break;
    }
  });

  function rundriver(nohtml) {
    driver = new webdriver.Builder().forBrowser("chrome").build();
    driver.manage().window().maximize();
    const query = {};
    if (nohtml) {
      query.nohtml = "1";
    }

    if (args.grep) {
      query.grep = args.grep;
    }

    const location = url.format({
      protocol: "http",
      hostname: ip,
      port,
      pathname: "/forever/build/standalone-optimized/test.html",
      query,
    });

    driver.get(location);
  }

  if (args.mode === "server") {
    return;
  }

  if (!args.visible) {
    headless({
      display: { width: 1680, height: 1050 },
    }, (err, xvfb_, serverNo) => {
      xvfb = xvfb_;
      process.env.DISPLAY = `:${serverNo}`;
      childProcess.spawn("fvwm2", { stdio: "ignore" });
      rundriver(true);
    });
  }
  else {
    rundriver(false);
  }
}

runserver();

//  LocalWords:  url querystring ajax txt json
