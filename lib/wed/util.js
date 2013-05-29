define(function (require, exports, module) {
"use strict";

var validate = require("salve/validate");

var XML1_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

function NameResolver() {
    this._context_stack = [];

    // Create a default context.
    this.enterContext();

    // Mandated by XML 1.x which is the only XML which exists now.
    this.definePrefix("xml", XML1_NAMESPACE);
}

(function () {
    this.definePrefix = function (prefix, uri) {
        this._context_stack[0].forward[prefix] = uri;
        
        var prefixes = this._context_stack[0].backwards[uri];
        if (prefixes === undefined)
            prefixes = this._context_stack[0].backwards[uri] = [];

        // This ensure that the default namespace is given priority
        // when unresolving names.
        if (prefix === "")
            prefixes.unshift("");
        else
            prefixes.push(prefix);
    };

    this.enterContext = function () {
        this._context_stack.unshift(Object.create(null));
        this._context_stack[0].forward = Object.create(null);
        this._context_stack[0].backwards = Object.create(null);
    };

    this.leaveContext = function () {
        if (this._context_stack.length > 1)
            this._context_stack.shift();
        else
            throw new Error("trying to leave the default context");
    };

    this.resolveName = function (name, attribute) {
        if (attribute === undefined)
            attribute = false;

        var parts = name.split(":");

        if (parts.length == 1) { // If there is no prefix
            if (attribute) // Attribute in undefined namespace
                return new validate.EName("", name);
            
            // We are searching for the default namespace currently in
            // effect.
            parts = [ "", name ];
        }
    
        if (parts.length > 2)
            throw new Error("invalid name passed to resolveName");
        
        // Search through the contexts
        var uri;
        for(var c_ix = 0, ctx;
            (uri === undefined) &&
            (ctx = this._context_stack[c_ix]) !== undefined; ++c_ix)
            uri = ctx.forward[parts[0]];

        if (uri === undefined)
            return (parts[0] === "") ? new validate.EName("", parts[1]): undefined;
            
        return new validate.EName(uri, parts[1]);
    };

    this.unresolveName = function (uri, name) {
        // Search through the contexts
        var prefixes;
        for(var c_ix = 0, ctx;
            (prefixes === undefined) &&
            (ctx = this._context_stack[c_ix]) !== undefined; ++c_ix)
            prefixes = ctx.backwards[uri];

        if (prefixes === undefined)
            return undefined;

        var pre = prefixes[0];

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
exports.XML1_NAMESPACE = XML1_NAMESPACE;
});
