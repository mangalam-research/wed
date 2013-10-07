/**
 * @module util
 * @desc Various utilities for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:util */function (require, exports, module) {
"use strict";

/**
 * Calculates the distance on the basis of two deltas. This would
 * typically be called with the difference of X coordinates and the
 * difference of Y coordinates.
 *
 * @param {Float} delta1 The first delta.
 * @param {Float} delta2 The second delta.
 * @returns {Float} The distance.
 */
function distFromDeltas(delta1, delta2) {
    return Math.sqrt(delta1*delta1 + delta2*delta2);
}

/**
 * Measures the distance of a point from a rectangle. If the point is
 * in the rectangle or touches it, the distance is 0. In the
 * nomenclature below, left and right are on the X axis and top and
 * bottom on the Y axis.
 *
 * @param {Float} x X coordinate of the point.
 * @param {Float} y Y coordinate of the point.
 * @param {Float} left Left coordinate of the rectangle.
 * @param {Float} top Top coordinate of the rectangle.
 * @param {Float} right Right coordinate of the rectangle.
 * @param {Float} bottom Bottom coordinate of the rectangle.
 * @returns {Float} The distance.
 */
function distFromRect(x, y, left, top, right, bottom) {
    var top_delta = y - top;
    var left_delta = x - left;
    var bottom_delta = y - bottom;
    var right_delta = x - right;

    var above = top_delta < 0;
    var below = bottom_delta > 0;
    // Neologism used to avoid conflict with left above.
    var lefter = left_delta < 0;
    var righter = right_delta > 0;

    var delta_x = lefter ? left_delta : (righter ? right_delta : 0);
    var delta_y = above ? top_delta : (below ? bottom_delta : 0);

    return distFromDeltas(delta_x, delta_y);
}

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
    return "WED-ID-" + (++next_id);
}

function anySpecialKeyHeld(ev) {
    return ev.altKey || ev.ctrlKey || ev.metaKey;
}

exports.escapeCSSClass = escapeCSSClass;
exports.getOriginalName = getOriginalName;
exports.classFromOriginalName = classFromOriginalName;
exports.decodeAttrName = decodeAttrName;
exports.encodeAttrName = encodeAttrName;
exports.newGenericID = newGenericID;
exports.anySpecialKeyHeld = anySpecialKeyHeld;
exports.distFromDeltas = distFromDeltas;
exports.distFromRect = distFromRect;
});



//  LocalWords:  InputTrigger jQuery util jqutil jquery hashstructs
//  LocalWords:  keydown tabindex keypress submap focusable boolean

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown keyup
// LocalWords:  setTextNodeValue popup appender unhandled rethrown
// LocalWords:  Django overriden subarrays stylesheets RequireJS
// LocalWords:  characterData childList refman prepend concat
