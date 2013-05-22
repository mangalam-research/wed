define(function (require, exports, module) {
"use strict";

var validate = require("salve/validate");

//
//  This code operates under the following assumptions:
//
// * The structure being parsed uses the exact same prefixes passed to
//   the constructor with the exact same values.
//
// * There are no redeclaration of namespaces in the DOM structure
//   being parsed. [A namespace redeclared to the same value it
//   previously had is fine because it changes nothing.]
//

function NameResolver(prefix_to_uri) {
    if (prefix_to_uri.xml !== "http://www.w3.org/XML/1998/namespace")
        throw new Error("invalid xml declaration: " + prefix_to_uri.xml);

    this._prefix_to_uri = prefix_to_uri;
    this._uri_to_prefix = {};

    // Create the reverse mapping
    for (var p in prefix_to_uri) {
        this._uri_to_prefix[prefix_to_uri[p]] = p;
    }

    if (prefix_to_uri[""] !== undefined)
        // Make sure the empty prefix has priority
        this._uri_to_prefix[prefix_to_uri[""]] = "";
}

(function () {
    this.resolveName = function (name, attribute) {
        if (attribute === undefined)
            attribute = false;

        var parts = name.split(":");

        if (parts.length == 1) { // If there is no prefix
            if (attribute) // Attribute in undefined namespace
                return new validate.EName("", name);
            
            // We are searching for the default namespace currently in effect.
            parts = [ "", name ];
        }
    
        if (parts.length > 2)
            throw new Error("invalid name passed to resolveName");
        
        var uri = this._prefix_to_uri[parts[0]];

        if (uri === undefined)
            throw new Error(
                parts[0] === "" ?
                    "trying to resolve a name in the default namespace but the default namespace is undefined" : 
                    "trying to resolve an unexpected namespace: " + parts[0]);
    
        return new validate.EName(uri, parts[1]);
        
    };

    this.unresolveName = function (uri, name) {
        var pre = this._uri_to_prefix[uri];
        if (pre === undefined)
            throw new Error("unknown uri");
        return (pre !== "") ? (pre + ":" + name) : name;
        
    };
}).call(NameResolver.prototype);


// No attempt here to be general... escape only what we use.
function escapeCSSClass(cls) {
    return cls.replace(/:/g, '\\:');
}

function getOriginalName(node) {
    // The original name is the first class name of the element that
    // was created.
    return node.className.split(" ", 1)[0];
}

function classFromOriginalName(name) {
    // Special case if we want to match all
    if (name === "*")
        return "._real";

    return "._real." + escapeCSSClass(name);
}

function decodeAttrName(name) {
    // The slice skips "data-wed-"
    return name.slice(9).replace(/---/, ':').replace(/---(-+)/g,"--$1"); 
}

function encodeAttrName(name) {
    return "data-wed-" + name.replace(/--(-+)/g, "---$1").replace(/:/, '---');
}

var next_id = 0;
function newGenericID() {
    return "WED.ID." + (++next_id);
}

function anySpecialKeyHeld(ev) {
    return ev.altKey || ev.ctrlKey || ev.metaKey;
}

function eventHandler(h) {
    return function (ev) {
        return h(ev, this);
    };
}


exports.NameResolver = NameResolver;
exports.escapeCSSClass = escapeCSSClass;
exports.getOriginalName = getOriginalName;
exports.classFromOriginalName = classFromOriginalName;
exports.decodeAttrName = decodeAttrName;
exports.encodeAttrName = encodeAttrName;
exports.newGenericID = newGenericID;
exports.anySpecialKeyHeld = anySpecialKeyHeld;
exports.eventHandler = eventHandler;
});
