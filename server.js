#!/usr/bin/env node

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

'use strict';
var child_process = require("child_process");
var express = require("express");
var http = require("http");
var compression = require("compression");
var serve_static = require("serve-static");
var path = require("path");
var url = require("url");
var fs = require("fs");
var Buffer = require("buffer").Buffer;
var querystring = require("querystring");
var crypto = require("crypto");
var morgan = require("morgan");
var webdriver = require("selenium-webdriver");
var ArgumentParser = require("argparse").ArgumentParser;
var colors = require("colors/safe");
var headless = require("headless");

var parser = new ArgumentParser({
    addHelp: true,
    description: 'Starts a server to run the in-browser tests for wed.'});

parser.addArgument(["-v", "--verbose"], {
    help: "Run verbosely.",
    action: "storeTrue"
});

parser.addArgument(["--visible"], {
    help: "Do not hide the browser.",
    action: "storeTrue"
});

parser.addArgument(["--grep"], {
    help: "Grep through the tests. (This is passed to Mocha.)"
});


parser.addArgument(["mode"], {
    choices: ["browser", "runner", "server"]
});

parser.addArgument(["address"], {
    nargs: "?"
});

var args = parser.parseArgs();
var verbose = args.verbose;
var address = args.address;
var ip, port;
if (address) {
    var parts = address.split(":");
    ip = parts[0];
    port = parts[1];
}
var cwd = process.cwd();

if (args.mode === "browser")
    args.visible = true;

// Yes, setting the expiration date at the start and never changing it
// is sloppy... but this is not meant to be a production server.
var ten_years = 315360000; // 10 years, in seconds
var expiration = new Date(Date.now() + ten_years * 1000).toUTCString();

var app = express();

app.use(compression());
app.use(serve_static(cwd));
app.use('/forever', serve_static(cwd, {
    setHeaders: function (res, path, stat) {
        res.setHeader('Cache-Control', 'private, max-age=' + ten_years);
        res.setHeader('Expires', expiration);
    }
}));

if (verbose) {
    var log_file = process.stdout;
    app.use(morgan({stream: log_file}));
}

function writeResponse(response, status, data, type, headers) {
    if (verbose)
        console.log('response message:', data);

    type = type || "text/plain";

    headers = headers || {};
    headers["Content-Type"] = type;

    response.writeHead(status, headers);

    if (data) {
        if (type !== "text/plain")
            response.write(data, "binary");
        else
            response.write(data);
    }
    response.end();
}

function unlinkIfExists(path) {
    if (fs.existsSync(path))
        fs.unlinkSync(path);
}

var fail_on_save = false;
var fail_on_recover = false;
var precondition_fail_on_save = false;
var too_old_on_save = false;
var no_response_on_save = false;
var no_response_on_recover = false;

function dumpData(request, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }

    options = options || {
        dump: true
    };

    var uri = url.parse(request.url).pathname;
    var filename = path.join(cwd, uri);
    var chunks = [];
    request.on('data', function (chunk) {
        chunks.push(chunk.toString());
    });

    request.on('end', function() {
        var body = chunks.join('');
        var decoded;
        if (request.is("application/x-www-form-urlencoded"))
            decoded = querystring.parse(body);
        else if (request.is("json"))
            decoded = JSON.parse(body);
        else
            throw new Error("cannot handle content-type: " +
                            request.get('Content-Type'));

        if (options.dump) {
            var writable = fs.createWriteStream(filename, {'flags': 'a'});
            writable.write("\n***\n", function () {
                if (verbose)
                    console.log('decoded body', decoded);
                writable.write(JSON.stringify(decoded));
                writable.end();
            });
        }

        if (callback)
            callback(decoded);
    });
}

function make_paths(str) {
    return [str, "/forever" + str];
}

app.post(make_paths("/build/ajax/log.txt"), function (request, response) {
    dumpData(request);
    writeResponse(response, 200, "{}", "application/json");
});

app.post(make_paths("/build/ajax/save.txt"), function (request, response) {
    dumpData(request, function (decoded) {
        var headers = undefined;
        function success() {
            messages.push({type: 'save_successful'});
            var hash = crypto.createHash('md5');
            hash.update(decoded.data);
            headers = {ETag: hash.digest('base64')};
        }
        var status = 200;
        var messages = [];
        switch(decoded.command) {
        case 'check':
            break;
        case 'save':
        case 'autosave':
            if (!no_response_on_save) {

                if (too_old_on_save)
                    messages.push({type: 'version_too_old_error'});

                if (precondition_fail_on_save)
                    status = 412;
                else if (fail_on_save)
                    status = 400;
                else
                    success();
            }
            break;
        case 'recover':
            if (!no_response_on_recover) {
                if (!fail_on_recover)
                    success();
                else
                    status = 400;
            }
            break;
        default:
            status = 400;
        }
        var msg = {messages: messages};
        var stringified = JSON.stringify(msg);
        writeResponse(response, status, stringified, "application/json",
                      headers);
    });
});

app.post(make_paths("/build/ajax/control"), function(request, response) {
    dumpData(request, function (decoded) {
        var status = 200;
        switch(decoded.command) {
        case 'reset':
            unlinkIfExists(path.join(cwd, "/build/ajax/log.txt"));
            unlinkIfExists(path.join(cwd, "/build/ajax/save.txt"));
            unlinkIfExists(path.join(cwd, "/build/ajax/control"));
            fail_on_save = false;
            fail_on_recover = false;
            precondition_fail_on_save = false;
            too_old_on_save = false;
            no_response_on_save = false;
            no_response_on_recover = false;
            break;
        case 'fail_on_save':
            fail_on_save = decoded.value;
            break;
        case 'precondition_fail_on_save':
            precondition_fail_on_save = decoded.value;
            break;
        case 'too_old_on_save':
            too_old_on_save = decoded.value;
            break;
        case 'fail_on_recover':
            fail_on_recover = decoded.value;
            break;
        case 'no_response_on_save':
            no_response_on_save = decoded.value;
            break;
        case 'no_response_on_recover':
            no_response_on_recover = decoded.value;
            break;
        case 'ping':
            break;
        default:
            status = 400;
        }
        writeResponse(response, status, "{}", "application/json");
    });
});

app.post(make_paths("/test-results"), function(request, response) {
    dumpData(request, {dump: false}, function (decoded) {
        writeResponse(response, 200, "{}", "application/json");
        app.emit("test-result", decoded);
    });
});

// Setting up the test environment requires getting *any* page from
// the server in some cases. It does not matter what the content of
// the page is. This serves the purpose.
app.get(make_paths("/blank"), function (request, response) {
    response.end();
});

function runserver() {
    if (!ip) {
        var server = http.createServer(app).listen();
        ip = "0.0.0.0";
        port = server.address().port;
        app.set('port', port);
    }
    else
        app.listen(port, ip);
    var driver, xvfb, wm;
    var failures = [];
    app.on("test-result", function (result) {
        switch(result[0]) {
        case 'fail':
            failures.push(result);
            process.stdout.write(colors.red('.'));
            break;
        case 'pass':
            process.stdout.write('.');
            break;
        case 'end':
            console.log("\n");
            for (var i = 0, failure; (failure = failures[i]); ++i) {
                var error = failure[1];
                console.log(colors.red("Failed test: " + error.fullTitle));
                if (error.err.stack) {
                    console.log(colors.red("Stack trace: "));
                    console.log(
                        colors.red(error.err.stack.replace(/^/gm, '    ')));
                }
                else {
                    var err = error.err;
                    err = (typeof err !== "string") ?
                        JSON.stringify(err, undefined, 4):
                        err.replace(/^/gm, '    ');
                    console.log(colors.red("Error: "));
                    console.log(colors.red(err));
                }
            }
            var stats = result[1];
            var d = new Date(0, 0, 0, 0, 0, 0, stats.duration);
            console.log("Elapsed: " + d.getHours() + "h" + d.getMinutes() +
                        "m" + d.getSeconds() + "s");
            if (stats.failures > 0)
                console.log(colors.red("Failures: " + stats.failures));
            console.log("Total: " + stats.tests);
            if (args.mode === "runner") {
                driver.quit().then(function () {
                    if (xvfb)
                        xvfb.kill();
                    process.exit(result.failures ? 1 : 0);
                });
            }
            break;
        }
    });

    function rundriver(nohtml) {
        driver = new webdriver.Builder()
            .forBrowser('chrome')
            .build();
        driver.manage().window().maximize();
        var query = {};
        if (nohtml)
            query.nohtml = "1";

        if (args.grep)
            query.grep = args.grep;

        var location = url.format({
            protocol: "http",
            hostname: ip,
            port: port,
            pathname: "/forever/build/standalone-optimized/test.html",
            query: query
        });

        driver.get(location);
    }

    if (args.mode === "server")
        return;

    if (!args.visible) {
        headless({
            display: {width: 1680, height: 1050}
        }, function (err, xvfb_, server_no) {
            xvfb = xvfb_;
            process.env.DISPLAY=":" + server_no;
            wm = child_process.spawn("fvwm2", { stdio: "ignore"} );
            rundriver(true);
        });
    }
    else
        rundriver(false);
}

runserver();

//  LocalWords:  url querystring ajax txt json
