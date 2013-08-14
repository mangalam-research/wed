#!/usr/bin/env node

var http = require("http");
var path = require("path");
var mime = require("mime");
var url = require("url");
var fs = require("fs");
var querystring = require("querystring");
var util = require("util");
var arg = process.argv[2] || "0.0.0.0:8888";
var parts = arg.split(":");
var ip = parts[0];
var port = parts[1];
var cwd = process.cwd();

function writeResponse(response, status, data, type) {
    type = type || "text/plain";
    response.writeHead(status, {"Content-Type": type});
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

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(cwd, uri);

    switch(request.method) {
    case 'GET':
        console.log('GET', uri);

        fs.exists(filename, function(exists) {
            if (!exists) {
                writeResponse(response, 404, "404 Not Found\n");
                return;
            }

            if (fs.statSync(filename).isDirectory()) filename += '/index.html';

            fs.readFile(filename, "binary", function(err, file) {
                if (err) {
                    writeResponse(response, 500, err + "\n");
                    return;
                }

                var contentType = mime.lookup(filename) || "text/plain";
                writeResponse(response, 200, file, contentType);
            });
        });
        break;
    case 'POST':
        console.log('POST', uri);
        var chunks = [];

        request.on('data', function (chunk) {
            chunks.push(chunk.toString());
        });

        request.on('end', function() {
            var body = chunks.join('');
            var writable = fs.createWriteStream(filename, {'flags': 'a'});
            writable.write("\n***\n");
            var decoded = querystring.parse(body);
            console.log('decoded body', decoded);
            writable.write(JSON.stringify(decoded));
            writable.end();

            var status = 200;
            var msg = {};
            // Log request
            if (uri === "/build/ajax/log.txt") {
                // Nothing needed.
            }
            // Save request.
            else if (uri === "/build/ajax/save.txt") {
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
                msg = {messages: messages};
            }
            else if (uri === "/build/ajax/control") {
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
            }

            var stringified = JSON.stringify(msg);
            console.log('response message', stringified);
            writeResponse(response, status, stringified, "application/json");
        });

        break;
    default:
        writeResponse(response, 403, "Unexpected method.");
    }
}).listen(port, ip);

console.log("http://localhost:" + port);
