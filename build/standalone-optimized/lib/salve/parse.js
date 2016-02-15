/**
 * @module parse
 * @desc A parser used for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:parse */ function (require, exports, module) {
'use strict';
var validate = require("./validate");
var sax = require("sax");
var parser = sax.parser(true, {xmlns: true});

function parse(rng_source, xml_source, mute) {
    mute = !!mute;

    var tree = validate.constructTree(rng_source);

    var walker = tree.newWalker();

    var error = false;

    function fireEvent() {
        var ev = new validate.Event(Array.prototype.slice.call(arguments));
        var ret = walker.fireEvent(ev);
        if (ret) {
            error = true;
            if (!mute)
                ret.forEach(function (x) {
                    console.log("on event " + ev);
                    console.log(x.toString());
                });
        }
    }

    var tag_stack = [];
    var text_buf = "";

    function flushTextBuf() {
        fireEvent("text", text_buf);
        text_buf = "";
    }


    parser.onopentag = function (node) {
        flushTextBuf();
        var names = Object.keys(node.attributes);
        var ns_definitions = [];
        names.sort();
        names.forEach(function (name) {
            var attr = node.attributes[name];
            if (attr.local === "" && name === "xmlns")// xmlns="..."
                ns_definitions.push(["", attr.value]);
            else if (attr.prefix === "xmlns") // xmlns:...=...
                ns_definitions.push([attr.local, attr.value]);
        });
        if (ns_definitions.length) {
            fireEvent("enterContext");
            ns_definitions.forEach(function (x) {
                fireEvent("definePrefix", x[0], x[1]);
            });
        }
        fireEvent("enterStartTag", node.uri, node.local);
        names.forEach(function (name) {
            var attr = node.attributes[name];
            // The parser handles all namespace issues
            if ((attr.local === "" && name === "xmlns") || // xmlns="..."
                (attr.prefix === "xmlns")) // xmlns:...=...
                return;
            fireEvent("attributeName", attr.uri, attr.local);
            fireEvent("attributeValue", attr.value);
        });
        fireEvent("leaveStartTag");
        tag_stack.unshift([node.uri, node.local, ns_definitions.length]);
    };

    parser.ontext = function (text) {
        text_buf += text;
    };

    parser.onclosetag = function (node) {
        flushTextBuf();
        var tag_info = tag_stack.shift();
        fireEvent("endTag", tag_info[0], tag_info[1]);
        if (tag_info[2])
            fireEvent("leaveContext");
    };

    var entity_re = /^<!ENTITY\s+([^\s]+)\s+(['"])(.*?)\2\s*>\s*/;

    parser.ondoctype = function (doctype) {
        // This is an extremely primitive way to handle ENTITY
        // declarations in a DOCTYPE. It is unlikely to support any
        // kind of complicated construct. If a reminder need be given
        // then: THIS PARSER IS NOT MEANT TO BE A GENERAL SOLUTION TO
        // PARSING XML FILES!!! It supports just enough to perform
        // some testing.
        doctype = doctype
            .replace(/^.*?\[/, '')
            .replace(/\].*?$/, '')
            .replace(/<!--(?:.|\n|\r)*?-->/g, '')
            .trim();

        var in_entity = false;

        while (doctype.length) {
            var match = entity_re.exec(doctype);
            if (match) {
                var name = match[1];
                var quote = match[2];
                var value = match[3];
                doctype = doctype.slice(match[0].length);
                if (parser.ENTITIES[name] !== undefined)
                    throw new Error("redefining entity: " + name);
                parser.ENTITIES[name] = value;
            }
            else
                throw new Error("unexpected construct in DOCTYPE: " + doctype);
        }

        console.log(doctype);
    };

    parser.write(xml_source).close();
    return error;
}

module.exports = parse;

});

// LocalWords:  namespace xmlns attributeName attributeValue endTag
// LocalWords:  leaveStartTag enterStartTag amd utf fs LocalWords
