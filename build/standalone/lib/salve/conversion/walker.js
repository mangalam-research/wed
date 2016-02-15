/**
 * @module conversion/walker
 * @desc This module contains classes for walking a parsed tree.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:conversion/walker */
    function (require, exports, module) {
'use strict';

var _ = require("lodash");
var oop = require("../oop");
var parser = require("./parser");
var formats = require("../formats");
var datatypes = require("../datatypes");
var Element = parser.Element;

// Table of names (string) to constructors.(function).
var name_to_constructor = formats.__protected.name_to_constructor;
var constructors = [];
var i = 0;
while(name_to_constructor[i]) {
    constructors[i] = name_to_constructor[i];
    i++;
}

// Table of names (string) to corresponding type number.
var constructor_name_to_index = {};
for(var name in name_to_constructor) {
    if (!(name in constructors)) {
        // Not a number
        constructor_name_to_index[name] =
            constructors.indexOf(name_to_constructor[name]);
    }
}


/**
 * @classdesc Base class for walkers.
 * @class
 *
 * @property {Array.<string>} output The output of the conversion as
 * an array of strings to be concatenated.
 */
function ConversionWalker() {
    this._construct_state = [{open: "", close: "", first: true}];
    this.output = [];
}

/**
 * Opens a construct in the output.
 *
 * @param {string} open The opening string
 * @param {string} close The closing string. This will be used to
 * check that the construct is closed properly.
 */
ConversionWalker.prototype.openConstruct = function (open, close) {
    this._construct_state.unshift({open: open, close: close, first: true});
    this.output.push(open);
};

/**
 * Closes a construct in the output.
 *
 * @param {string} close The closing string. This will be used to
 * check that the construct is closed properly.
 * @throws {Error} If the ``close`` parameter does not match what was
 * passed to {@link
 * module:conversion/walker~ConversionWalker#openConstruct
 * openConstruct}.
 */
ConversionWalker.prototype.closeConstruct = function (close) {
    var top = this._construct_state.shift();
    if (close !== top.close)
        throw new Error('construct mismatch: ' + top.close + ' vs' + close);
    this.output.push(close);
};

/**
 * Indicates that a new item is about to start in the current
 * construct. Outputs a separator (",") if this is not the first item
 * in the construct.
 */
ConversionWalker.prototype.newItem = function() {
    if (!this._construct_state[0].first)
        this.output.push(",");
    this._construct_state[0].first = false;
};

/**
 * Outputs an item in the current construct. Outputs a separator (",")
 * if this is not the first item in the construct.
 *
 * @param {string} item The item to output.
 */
ConversionWalker.prototype.outputItem = function(item) {
    this.newItem();
    this.output.push(item);
};


/**
 * Outputs a string in the current construct. Outputs a separator
 * (",") if this is not the first item in the construct. The
 * double-quotes in the string will be escaped and the string will be
 * surrounded by double quotes in the output.
 *
 * @param {string} string The string to output.
 */
ConversionWalker.prototype.outputString = function(string) {
    this.newItem();

    var to_output = JSON.stringify(string);
    this.output.push(to_output);
};

/**
 * Outputs a key, value pair. Both are strings. Outputs a separator
 * (",") if this is not the first item in the construct. The
 * double-quotes in the strings will be escaped and the strings will be
 * surrounded by double quotes in the output.
 *
 * @param {string} key The key to output.
 * @param {string} value The value to output.
 */
ConversionWalker.prototype.outputKeyValue = function(key, value) {
    this.newItem();

    var to_output = JSON.stringify(key);
    this.output.push(to_output);
    to_output = JSON.stringify(value);
    this.output.push(":");
    this.output.push(to_output);
};


/**
 * Walks a element's children.
 *
 * @param {module:conversion/parser~Element} el The element whose
 * children must be walked.
 * @param {integer} start_at Index at which to start walking.
 * @param {integer} end_at Index at which to end walking.
 */
ConversionWalker.prototype.walkChildren = function (el, start_at, end_at) {
    if (!start_at)
        start_at = 0;

    var children = el.children;

    if (!end_at)
        end_at = children.length;

    var limit = Math.min(end_at, children.length);
    if (limit < start_at)
        throw new Error("invalid parameters passed");
    for(var i = start_at; i < limit; ++i) {
        var child = children[i];
        if (child instanceof Element)
            this.walk(child);
    }
};

/**
 * Walk an element.
 *
 * @param {module:conversion/parser~Element} el The element whose
 * children must be walked.
 */
ConversionWalker.prototype.walk = function (el) {
    throw new Error("derived classes must implement this");
};


/**
 * ConversionWalker for the default version generated by salve.
 *
 * @param {boolean} include_paths Whether to include paths in the output.
 * @param {boolean} verbose Whether to output verbosely.
 */
function DefaultConversionWalker(version, include_paths, verbose) {
    if (version !== 3)
        throw new Error("DefaultConversionWalker only supports version 3");
    ConversionWalker.call(this);
    this.include_paths = include_paths;
    this.verbose = verbose;
    this.array_start = this.verbose ? '"Array"' : 0;
    this.in_name_class = false;
}

oop.inherit(DefaultConversionWalker, ConversionWalker);

/**
 * Open an array in the output.
 */
DefaultConversionWalker.prototype.openArray = function () {
    this.openConstruct("[", "]");
    this.outputItem(this.array_start);
};

DefaultConversionWalker.prototype.walk = function (el) {
    el.makePath();

    var name, constructor;  // Damn hoisting.

    var node = el.node;
    switch(node.local) {
    case "start":
        this.walkChildren(el);
        break;
    case "param":
        this.outputString(node.attributes.name.value);
        this.outputString(el.children[0]);
        break;
    case "grammar":
        this.openConstruct("{", "}");
        this.outputItem('"v":3,"o":' + (this.include_paths ? 0 : 1) +
                        ',"d":');
        constructor = constructor_name_to_index.Grammar;
        if (!constructor)
            throw new Error("can't find constructor for " + capitalized);
        this.openConstruct("[", "]");
        if (this.verbose)
            this.outputString("Grammar");
        else
            this.outputItem(constructor);
        if (this.include_paths)
            this.outputString(el.path);
        this.walk(el.children[0]);
        this.newItem();
        this.openArray();
        this.walkChildren(el, 1);
        this.closeConstruct("]");
        this.closeConstruct(']');
        this.closeConstruct("}");
        break;
    default:
        var capitalized =
                node.local.charAt(0).toUpperCase() + node.local.slice(1);
        var skip_to_children = (capitalized === "Except");
        if (this.in_name_class) {
            // When we are in an name class, some elements are
            // converted differently from when outside it. For
            // instance, choice can appear as a general pattern to
            // encode a choice between two elements or two attributes,
            // and it can be used inside a name class to encode a
            // choice between two names. We convert such elements to a
            // different class.
            switch(capitalized) {
            case "Choice":
                capitalized = "NameChoice";
                break;
            }
        }

        // We do not output anything for this element itself but
        // instead go straight to its children.
        if (skip_to_children) {
            this.walkChildren(el);
            return;
        }

        this.newItem();
        constructor = constructor_name_to_index[capitalized];
        if (!constructor)
            throw new Error("can't find constructor for " + capitalized);


        this.openConstruct("[", "]");
        if (this.verbose)
            this.outputString(capitalized);
        else
            this.outputItem(constructor);
        if (this.include_paths)
            this.outputString(el.path);
        switch(node.local) {
        case "ref":
            name = node.attributes.name.value;
            if (typeof name === "number")
                this.outputItem(name);
            else
                this.outputString(name);
            break;
        case "define":
            name = node.attributes.name.value;
            if (typeof name === "number")
                this.outputItem(name);
            else
                this.outputString(name);
            this.newItem();
            this.openArray();
            this.walkChildren(el);
            this.closeConstruct("]");
            break;
        case "value":
            // Output a variable number of items.
            // Suppose item 0 is called it0 and so forth. Then:
            //
            // Number of items  value  type    datatypeLibrary  ns
            // 1                it0    "token" ""               ""
            // 2                it0     it1    ""               ""
            // 3                it0     it1    it2              ""
            // 4                it0     it1    it2              it3
            //
            this.outputString(el.children.join(""));
            if (node.attributes.type.value !== "token" ||
                node.attributes.datatypeLibrary.value !== "" ||
                node.attributes.ns.value !== "") {
                this.outputString(node.attributes.type.value);
                if (node.attributes.datatypeLibrary.value !== "" ||
                    node.attributes.ns.value !== "") {
                    this.outputString(node.attributes.datatypeLibrary.value);
                    // No value === empty string.
                    if (node.attributes.ns.value !== "")
                        this.outputString(node.attributes.ns.value);
                }
            }
            break;
        case "data":
            // Output a variable number of items.
            // Suppose item 0 is called it0 and so forth. Then:
            //
            // Number of items  type    datatypeLibrary params except
            // 0                "token" ""              {}     undefined
            // 1                it0     ""              {}     undefined
            // 2                it0     it1             {}     undefined
            // 3                it0     it1             it2    undefined
            // 4                it0     it1             it2    it3
            //
            // Parameters are necessarily first among the children.
            var has_params =
                (el.children.length && (el.children[0].node.local === "param"));
            // Except is necessarily last.
            var has_except =
                    (el.children.length &&
                     el.children[el.children.length - 1].node.local ===
                     "except");
            if (node.attributes.type.value !== "token" ||
                node.attributes.datatypeLibrary.value !== "" ||
                has_params ||
                has_except) {
                this.outputString(node.attributes.type.value);
                if (node.attributes.datatypeLibrary.value !== "" ||
                    has_params ||
                    has_except) {
                    this.outputString(node.attributes.datatypeLibrary.value);
                    if (has_params || has_except) {
                        this.newItem();
                        this.openArray();
                        if (has_params)
                            this.walkChildren(el, 0, has_except ?
                                              el.children.length - 1 :
                                              undefined);
                        this.closeConstruct("]");
                        if (has_except)
                            this.walk(el.children[el.children.length - 1]);
                    }
                }
            }
            break;
        case "group":
        case "interleave":
        case "choice":
        case "oneOrMore":
            this.newItem();
            this.openArray();
            this.walkChildren(el);
            this.closeConstruct("]");
            break;
        case "element":
        case "attribute":
            // The first element of `<element>` or `<attribute>` is
            // necessarily a name class. Note that there is no need to
            // owrry about recursivity since it is not possible to get
            // here recursively from the `this.walk` call that
            // follows. (A name class cannot contain `<element>` or
            // `<attribute>`.
            this.in_name_class = true;
            this.walk(el.children[0]);
            this.in_name_class = false;
            this.newItem();
            this.openArray();
            this.walkChildren(el, 1);
            this.closeConstruct("]");
            break;
        case "name":
            this.outputString(node.attributes.ns.value);
            this.outputString(el.children.join(""));
            break;
        case "nsName":
            this.outputString(node.attributes.ns.value);
            this.walkChildren(el);
            break;
        default:
            this.walkChildren(el);
        }
        this.closeConstruct(']');
        break;
    }
};

/**
 * A ConversionWalker specialized in gathering the names used for
 * Relax NG's &lt;ref> and &lt;define> elements.
 *
 * @class
 *
 * @property {Object.<String,integer>} names The names gathered. Each
 * name is associated with the number of times it was seen. This
 * property is valid after the walker has walked the element tree.
 */
function NameGatherer() {
    ConversionWalker.call(this);
    this.names = Object.create(null);
}

oop.inherit(NameGatherer, ConversionWalker);

NameGatherer.prototype.walk = function(el) {
    this.walkChildren(el);
    if (el.node.local === "define" || el.node.local === "ref") {
        var name = el.node.attributes.name.value;
        if (!(name in this.names))
            this.names[name] = 0;

        this.names[name]++;

    }
};

/**
 * A ConversionWalker specialized in reassinging the names used by
 * Relax NG's &lt;ref> and &lt;define> elements.
 *
 * @class
 *
 * @param {Object.<string, string>} names This is a map whose keys are
 * the names that already exist in the element tree and the values are
 * the new names to use. A ``(key, value)`` pair indicates that
 * ``key`` should be replaced with ``value``. It is up to the caller
 * to ensure that two keys do not share the same value and that the
 * map is complete.
 */
function Renamer(names) {
    ConversionWalker.call(this);
    this.names = names;
}
oop.inherit(Renamer, ConversionWalker);

Renamer.prototype.walk = function(el) {
    if (el.node.local === "define" || el.node.local === "ref") {
        el.node.attributes.name.value =
            this.names[el.node.attributes.name.value];
    }
    this.walkChildren(el);
};

/**
 * This walker checks that the types used in the tree can be
 * used, and does special processing for QName and NOTATION.
 */
function DatatypeProcessor() {
    ConversionWalker.call(this);
    this.warnings = [];
    this.incomplete_types_used = {};
}
oop.inherit(DatatypeProcessor, ConversionWalker);

var warn_about_these_types = {
    "float": true,
    "double": true,
    ENTITY: true,
    ENTITIES: true
};

/**
 * @private
 * @param {module:conversion/parser~Element} el Element to start the
 * search from.
 * @returns {boolean} ``true`` if ``el`` is an attribute or is in an
 * RNG &lt;attribute> element. ``false`` otherwise.
 */
function inAttribute(el) {

    while(el) {
        if (el.node && (el.node.local === "attribute"))
            return true;
        el = el.parent;
    }

    return false;
}

/**
 * Searches for an attribute on an element or on the ancestors of this
 * element, going from parent, to grand-parent, to grand-grand-parent,
 * etc.
 * @private
 * @param {module:conversion/parser~Element} el Element from which to search.
 * @param {string} name The name of the attribute.
 * @returns {string|undefined} The value of the attribute on the
 * closest element that has the attribute.
 */
function findAttributeUpwards(el, name) {
    while(el) {
        if (el.node && el.node.attributes[name])
            return el.node.attributes[name].value;

        el = el.parent;
    }

    return undefined;
}

function localName(value) {
    var sep = value.indexOf(":");
    return (sep === -1) ? value : value.slice(sep + 1);
}

function fromQNameToURI(value, el) {
    var attribute = inAttribute(el);
    var parts = value.split(":");

    if (parts.length == 1) { // If there is no prefix
        if (attribute) // Attribute in undefined namespace
            return "";

        // We are searching for the default namespace currently in
        // effect.
        parts = [ "", name ];
    }

    if (parts.length > 2)
        throw new Error("invalid name");

    if (parts[0] === "")
        // Yes, we return the empty string even if that what @ns is
        // set to: there is no default namespace when @ns is set to
        // ''.
        return el.node.attributes.ns.value;

    // We have a prefix, in which case @ns is useless. We have to get
    // the namespace from @xmlns and @xmlns:prefix attributes.
    var uri = findAttributeUpwards(el, (parts[0] === "") ? "xmlns":
                                   ("xmlns:" + parts[0]));
    if (!uri)
        throw new Error("cannot resolve prefix: " + parts[0]);
    return uri;
}


DatatypeProcessor.prototype.walk = function(el) {
    var node, type, libname, lib;

    if (el.node.local === "value") {
        el.makePath();
        node = el.node;
        var value = el.children.join("");
        type = node.attributes.type.value;
        libname = node.attributes.datatypeLibrary.value;
        var ns = node.attributes.ns.value;

        lib = datatypes.registry.find(libname);
        if (!lib)
            throw new datatypes.ValueValidationError(
                [new datatypes.ValueError("unknown datatype library: " +
                                          libname)]);
        var datatype = lib.types[type];
        if (!datatype)
            throw new datatypes.ValueValidationError(
                [new datatypes.ValueError(
                    "unknown datatype " + type + " in " +
                        ((libname === "") ? "default library" :
                         ("library " + libname)))]);

        if (datatype.needs_context &&
            !(libname === "http://www.w3.org/2001/XMLSchema-datatypes" &&
              (type === "QName" || type === "NOTATION")))
            throw new Error("datatype needs context but is not " +
                            "QName or NOTATION form the XML Schema " +
                            "library: don't know how to handle");
        if (datatype.needs_context) {
            // Change ns to the namespace we need.
            ns = node.attributes.ns.value = fromQNameToURI(value, el);
            value = localName(value);
            el.children = [value];
        }

        // Generating the element will cause salve's to perform checks
        // on the params, etc. We do not need to record the return
        // value.
        new name_to_constructor.Value(el.path, value, type, libname, ns);
    }
    else if (el.node.local === "data") {
        el.makePath();
        node = el.node;
        // Except is necessarily last.
        var has_except =
                (el.children.length &&
                 el.children[el.children.length - 1].node.local ===
                 "except");

        type = node.attributes.type.value;
        libname = node.attributes.datatypeLibrary.value;
        lib = datatypes.registry.find(libname);
        if (!lib)
            throw new datatypes.ValueValidationError(
                [new datatypes.ValueError("unknown datatype library: " +
                                          libname)]);
        if (!lib.types[type])
            throw new datatypes.ValueValidationError(
                [new datatypes.ValueError(
                    "unknown datatype " + type + " in " +
                        ((libname === "") ? "default library" :
                         ("library " + libname)))]);
        var params = [];
        _.each(el.children.slice(0, has_except ? el.children.length - 1 :
                                 undefined), function (child) {
            params.push({name: child.node.attributes.name.value,
                         value: child.children.join("")});
        });

        // Generating the element will cause salve's to perform checks
        // on the params, etc. We do not need to record the return
        // value. Also, we do not need to pass the possible exception,
        // as it will be dealt when children of this element are
        // walked.
        new name_to_constructor.Data(el.path, type, libname, params);
    }

    if (libname === "http://www.w3.org/2001/XMLSchema-datatypes" &&
        warn_about_these_types.hasOwnProperty(type)) {
        this.warnings.push("WARNING: " + el.path + " uses the " +
                           type + " type in library " + libname);
        this.incomplete_types_used[type] = true;
    }
    this.walkChildren(el);
};


exports.DefaultConversionWalker = DefaultConversionWalker;
exports.NameGatherer = NameGatherer;
exports.Renamer = Renamer;
exports.DatatypeProcessor = DatatypeProcessor;

});
