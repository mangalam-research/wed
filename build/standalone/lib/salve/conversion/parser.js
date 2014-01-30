/**
 * @module conversion/parser
 * @desc This module contains classes for a conversion parser.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:conversion/parser */
    function (require, exports, module) {
'use strict';

var oop = require("../oop");

/**
 * @classdesc A base class for classes that perform parsing based on
 * SAX parsers.
 *
 * Derived classes should add methods named ``on&lt;eventname>`` so as
 * to form a full name which matches the ``on&lt;eventname>`` methods
 * supported by SAX parsers. The constructor will attach these methods
 * to the SAX parser passed and bind them so in them ``this`` is the
 * ``Parser`` object. This allows neatly packaging methods and private
 * parameters.
 *
 * @class
 * @param sax_parser A parser created by the ``sax-js`` libary or
 * something compatible.
 *
 * @property sax_parser The parser passed when constructing the
 * object. Should not be modified.
 */
function Parser(sax_parser) {
    this.sax_parser = sax_parser;
    for(var name in this) {
        if (name.lastIndexOf("on", 0) === 0)
            this.sax_parser[name] = this[name].bind(this);
    }
}

/**
 * @classdesc An Element produced by {@link
 * module:conversion/parser~Parser Parser}.
 *
 * This constructor will insert the created object into the parent
 * automatically if the parent is provided.
 *
 * @class
 * @param {module:conversion/parser~Element} parent The parent
 * element, or a falsy value if this is the root element.
 * @param {Object} node The value of the ``node`` created by the SAX
 * parser.
 *
 * @property {module:conversion/parser~Element} parent The parent.
 * @property {Object} node The node.
 * @property {Array.<module:conversion/parser~Element|string>} children The
 * element's chidren.
 * @property {string} path The path of the element in its tree.
 */
function Element(parent, node) {
    this.parent = parent;
    this.node = node;
    this.children = [];
    this.path = undefined;
    if (parent)
        parent.children.push(this);
}

Element.prototype.makePath = function () {
    if (this.path)
        return;

    if (!this.node) {
        this.path = "";
        return;
    }

    var p_path = "";
    if (this.parent) {
        this.parent.makePath();
        p_path = this.parent.path;
    }

    this.path = p_path + "/" + this.node.local;

    if ("name" in this.node.attributes)
        this.path += "[@name='" + this.node.attributes.name.value + "']";

    for(var i = 0; i < this.children.length; ++i) {
        var child = this.children[i];
        if (child instanceof Element && child.node.local === "name") {
            var val = child.children.join("");
            this.path += "[@name='" + val + "']";
            break;
        }
    }

};

/**
 * @classdesc A simple parser used for loading a XML document into
 * memory. Parsers of this class use {@link
 * module:conversion/parser~Element Element} objects to represent the
 * tree of nodes.
 *
 * @class
 * @extends module:conversion/parser~Parser
 *
 * @param sax_parser A parser created by the ``sax-js`` libary or
 * something compatible.
 *
 * @property {Array.<module:conversion/parser~Element>} stack The
 * stack of elements. At the end of parsing, there should be only one
 * element on the stack, the root. This root is not an element that
 * was in the XML file but a holder for the tree of elements. It has a
 * single child which is the root of the actual file parsed.
 */
function ConversionParser() {
    Parser.apply(this, arguments);
    this.stack = [new Element()];
}

oop.inherit(ConversionParser, Parser);

ConversionParser.prototype.onopentag = function (node) {
    if (node.uri !== "http://relaxng.org/ns/structure/1.0")
        throw new Error("node in unexpected namespace: " + node.uri);

    var parent = this.stack[0];

    var me = new Element(parent, node);

    this.stack.unshift(me);
};

ConversionParser.prototype.onclosetag = function (name) {
    this.stack.shift();
};

ConversionParser.prototype.ontext = function (text) {
    var top = this.stack[0];
    if (!top)
        return;
    if (text.trim() !== "")
        top.children.push(text);
};

exports.Element = Element;
exports.ConversionParser = ConversionParser;


});
