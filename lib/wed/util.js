define(function (require, exports, module) {
"use strict";

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

    return "." + escapeCSSClass(name) + "._real";
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

exports.escapeCSSClass = escapeCSSClass;
exports.getOriginalName = getOriginalName;
exports.classFromOriginalName = classFromOriginalName;
exports.decodeAttrName = decodeAttrName;
exports.encodeAttrName = encodeAttrName;
exports.newGenericID = newGenericID;
exports.anySpecialKeyHeld = anySpecialKeyHeld;
exports.eventHandler = eventHandler;
});
