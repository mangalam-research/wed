#!/usr/bin/env node

var express = require("express");
var path = require("path");
var url = require("url");
var fs = require("fs");
var Buffer = require("buffer").Buffer;
var querystring = require("querystring");

var verbose = false;

var next_arg = 2;
if (process.argv[2] === "-v") {
    verbose = true;
    next_arg++;
}

var arg = process.argv[next_arg] || "0.0.0.0:8888";
var parts = arg.split(":");
var ip = parts[0];
var port = parts[1];
var cwd = process.cwd();

var app = express();

if (verbose)
    app.use(express.logger());
app.use(express.compress());
app.use(express.static(cwd));

function writeResponse(response, status, data, type) {
    if (verbose)
        console.log('response message', data);

    type = type || "text/plain";

    var headers = {"Content-Type": type,
                   "Content-Length": Buffer.byteLength(data)};

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

function dumpData(request, callback) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(cwd, uri);
    var chunks = [];
    request.on('data', function (chunk) {
        chunks.push(chunk.toString());
    });

    request.on('end', function() {
        var body = chunks.join('');
        var writable = fs.createWriteStream(filename, {'flags': 'a'});
        writable.write("\n***\n");
        var decoded = querystring.parse(body);
        if (verbose)
            console.log('decoded body', decoded);
        writable.write(JSON.stringify(decoded));
        writable.end();
        if (callback)
            callback(decoded);
    });
}

app.post("/build/ajax/log.txt", function (request, response) {
    dumpData(request);
    writeResponse(response, 200, "{}", "application/json");
});

app.post("/build/ajax/save.txt", function (request, response) {
    dumpData(request, function (decoded) {
        var status = 200;
        var messages = [];
        switch(decoded.command) {
        case 'check':
            break;
        case 'save':
            if (!fail_on_save)
                messages.push({type: 'save_successful'});
            else
                status = 400;
            break;
        case 'recover':
            if (!fail_on_recover)
                messages.push({type: 'save_successful'});
            else
                status = 400;
            break;
        default:
            status = 400;
        }
        var msg = {messages: messages};
        var stringified = JSON.stringify(msg);
        writeResponse(response, status, stringified, "application/json");
    });
});

app.post("/build/ajax/control", function(request, response) {
    dumpData(request, function (decoded) {
        var status = 200;
        switch(decoded.command) {
        case 'reset':
            unlinkIfExists(path.join(cwd, "/build/ajax/log.txt"));
            unlinkIfExists(path.join(cwd, "/build/ajax/save.txt"));
            unlinkIfExists(path.join(cwd, "/build/ajax/control"));
            fail_on_save = false;
            fail_on_recover = false;
            break;
        case 'fail_on_save':
            fail_on_save = decoded.value;
            break;
        case 'fail_on_recover':
            fail_on_recover = decoded.value;
            break;
        default:
            status = 400;
        }
        writeResponse(response, status, "{}", "application/json");
    });
});

app.listen(port, ip);


console.log("http://" + ip + ":" + port);
