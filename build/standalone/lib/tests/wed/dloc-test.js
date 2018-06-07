var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "jquery", "wed/convert", "wed/dloc", "wed/domutil", "wed/util", "../util"], function (require, exports, jquery_1, convert, dloc_1, domutil_1, util_1, util_2) {
    /**
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    convert = __importStar(convert);
    var assert = chai.assert;
    function defined(x) {
        assert.isDefined(x);
        // The assertion above already excludes null and undefined, but TypeScript
        // does not know this.
        return x;
    }
    describe("dloc", function () {
        var $root;
        var root;
        var rootObj;
        var encodedType;
        before(function () {
            return new util_2.DataProvider("/base/build/standalone/lib/tests/dloc_test_data/")
                .getText("source_converted.xml")
                .then(function (sourceXML) {
                root = document.createElement("div");
                document.body.appendChild(root);
                $root = jquery_1.default(root);
                var parser = new window.DOMParser();
                var xmlDoc = parser.parseFromString(sourceXML, "text/xml");
                var htmlTree = convert.toHTMLTree(window.document, xmlDoc.firstElementChild);
                root.appendChild(htmlTree);
                rootObj = new dloc_1.DLocRoot(root);
                encodedType = util_1.encodeAttrName("type");
            });
        });
        after(function () {
            document.body.removeChild(root);
        });
        afterEach(function () {
            // Some tests add elements with the class __test to the DOM tree.
            // Proactively delete them here.
            jquery_1.default(".__test").remove();
        });
        function makeAttributeNodeCase() {
            var a = defined(jquery_1.default(".quote")[0].getAttributeNode(encodedType));
            var b = defined(jquery_1.default(".body .p")[1]);
            var attrLoc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
            var loc = attrLoc.make(b, 1);
            return { attrLoc: attrLoc, loc: loc };
        }
        function makeInvalidCase() {
            $root.append("<div class='__test'></div>");
            var t = defined(jquery_1.default(".__test")[0]);
            assert.equal(t.nodeType, Node.ELEMENT_NODE);
            var b = defined(jquery_1.default(".body .p")[1]);
            var loc = defined(dloc_1.DLoc.makeDLoc(root, b, 1));
            var invalid = loc.make(t, 0);
            t.parentNode.removeChild(t);
            assert.isFalse(invalid.isValid());
            return { loc: loc, invalid: invalid };
        }
        describe("DLocRoot", function () {
            it("marks the root", function () {
                assert.equal(dloc_1.findRoot(root), rootObj);
            });
            it("fails if the node is already marked", function () {
                assert.throws(function () {
                    new dloc_1.DLocRoot(root);
                }, Error, "node already marked as root");
            });
            describe("nodeToPath", function () {
                it("returns an empty string on root", function () {
                    assert.equal(rootObj.nodeToPath(root), "");
                });
                it("returns a correct path on text node", function () {
                    var node = defined($root.find(".title")[0].childNodes[0]);
                    assert.equal(rootObj.nodeToPath(node), "0/0/0/0/0/0");
                });
                it("returns a correct path on later text node", function () {
                    var node = defined($root.find(".body>.p")[1].childNodes[2]);
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1/2");
                });
                it("returns a correct path on attribute", function () {
                    var node = defined($root.find(".body>.p")[1].attributes.getNamedItem("class"));
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1/@class");
                });
                it("fails on a node which is not a descendant of its root", function () {
                    var node = defined(jquery_1.default("body")[0]);
                    assert.throws(rootObj.nodeToPath.bind(rootObj, node), Error, "node is not a descendant of root");
                });
                it("fails on invalid node", function () {
                    assert.throws(rootObj.nodeToPath.bind(rootObj, null), Error, "invalid node parameter");
                    assert.throws(rootObj.nodeToPath.bind(rootObj, undefined), Error, "invalid node parameter");
                });
            });
            describe("pathToNode", function () {
                it("returns root when passed an empty string", function () {
                    assert.equal(rootObj.pathToNode(""), root);
                });
                it("returns a correct node on a text path", function () {
                    var node = defined($root.find(".title")[0].childNodes[0]);
                    assert.equal(rootObj.pathToNode("0/0/0/0/0/0"), node);
                });
                it("returns a correct node on a later text path", function () {
                    var node = defined($root.find(".body>.p")[1].childNodes[2]);
                    assert.equal(rootObj.pathToNode("0/1/0/1/2"), node);
                });
                it("returns a correct node on attribute path", function () {
                    var node = defined($root.find(".body>.p")[1].attributes.getNamedItem("class"));
                    assert.equal(rootObj.pathToNode("0/1/0/1/@class"), node);
                });
                it("accepts more than one digit per path step", function () {
                    // There was a stupid bug in an earlier version which would make this
                    // fail with an exception complaining that the path was malformed due to
                    // the presence of "10". The null return value is fine since there is no
                    // such element, but at least it should not generate an exception.
                    assert.equal(rootObj.pathToNode("0/10"), null);
                });
                it("fails on malformed path", function () {
                    assert.throws(rootObj.pathToNode.bind(rootObj, "+"), Error, "malformed path expression");
                });
            });
        });
        describe("findRoot", function () {
            it("finds the root", function () {
                assert.equal(dloc_1.findRoot(defined(jquery_1.default(".p")[0])), rootObj);
            });
            it("returns undefined if not in a root", function () {
                assert.isUndefined(dloc_1.findRoot(defined($root.parent()[0])));
            });
        });
        describe("getRoot", function () {
            it("gets the root", function () {
                assert.equal(dloc_1.getRoot(defined(jquery_1.default(".p")[0])), rootObj);
            });
            it("throws an exception if not in a root", function () {
                assert.throws(dloc_1.getRoot.bind(undefined, defined($root.parent()[0])), Error, "no root found");
            });
        });
        describe("makeDLoc", function () {
            it("returns undefined when called with undefined location", function () {
                assert.isUndefined(dloc_1.DLoc.makeDLoc(root, undefined));
            });
            it("returns a valid DLoc", function () {
                var a = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.makeDLoc(root, a, 0);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns a valid DLoc when the root is a DLocRoot", function () {
                var a = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.makeDLoc(rootObj, a, 0);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns a valid DLoc on an attribute node", function () {
                var a = defined(jquery_1.default(".quote")[0].getAttributeNode(encodedType));
                var loc = dloc_1.DLoc.makeDLoc(root, a, 0);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns a valid DLoc when called with an array", function () {
                var a = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.makeDLoc(root, [a, 0]);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns a valid DLoc when the offset is omitted", function () {
                var a = defined(jquery_1.default(".body .p")[1]);
                var loc = dloc_1.DLoc.makeDLoc(root, a);
                assert.equal(loc.node, a.parentNode);
                assert.equal(loc.offset, 1);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns undefined when called with an array that has an " +
                "undefined first member", function () {
                assert.isUndefined(dloc_1.DLoc.makeDLoc(root, [undefined, 0]));
            });
            it("throws an error when the node is not in the root", function () {
                var c = defined($root.parent()[0]);
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, root, c, 0), Error, "node not in root");
            });
            it("throws an error when the root is not marked", function () {
                var c = defined($root.parent()[0]);
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, c, c, 0), Error, /^root has not been marked as a root/);
            });
            it("throws an error when the offset is negative", function () {
                var c = defined($root.parent()[0]);
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, root, c, -1), Error, /^negative offsets are not allowed/);
            });
            it("throws an error when the offset is too large (element)", function () {
                var c = defined(jquery_1.default(".p")[0]);
                assert.equal(c.nodeType, Node.ELEMENT_NODE);
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, root, c, 100), Error, /^offset greater than allowable value/);
            });
            it("throws an error when the offset is too large (text)", function () {
                var c = defined(jquery_1.default(".body .p")[0].firstChild);
                assert.equal(c.nodeType, Node.TEXT_NODE);
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, root, c, 100), Error, /^offset greater than allowable value/);
            });
            it("throws an error when the offset is too large (attribute)", function () {
                var c = defined(jquery_1.default(".quote")[0].getAttributeNode(encodedType));
                assert.isTrue(domutil_1.isAttr(c));
                assert.throws(dloc_1.DLoc.makeDLoc.bind(undefined, root, c, 100), Error, /^offset greater than allowable value/);
            });
            it("normalizes a negative offset", function () {
                var c = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.makeDLoc(root, c, -1, true);
                assert.equal(loc.offset, 0);
            });
            it("normalizes an offset that is too large (element)", function () {
                var c = defined(jquery_1.default(".p")[0]);
                assert.equal(c.nodeType, Node.ELEMENT_NODE);
                var loc = dloc_1.DLoc.makeDLoc(root, c, 100, true);
                assert.equal(loc.offset, 0);
            });
            it("normalizes an offset that is too large (text)", function () {
                var c = defined(jquery_1.default(".body .p")[0].firstChild);
                assert.equal(c.nodeType, Node.TEXT_NODE);
                var loc = dloc_1.DLoc.makeDLoc(root, c, 100, true);
                assert.equal(loc.offset, c.data.length);
            });
            it("normalizes an offset that is too large (attribute)", function () {
                var c = defined(jquery_1.default(".quote")[0].getAttributeNode(encodedType));
                assert.isTrue(domutil_1.isAttr(c));
                var loc = dloc_1.DLoc.makeDLoc(root, c, 100, true);
                assert.equal(loc.offset, c.value.length);
            });
        });
        describe("mustMakeDLoc", function () {
            it("throws when called with undefined location", function () {
                assert.throws(dloc_1.DLoc.mustMakeDLoc.bind(undefined, root, undefined), Error, /^called mustMakeDLoc with an absent node$/);
            });
            it("returns a valid DLoc", function () {
                var a = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.mustMakeDLoc(root, a, 0);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("returns a valid DLoc when called with an array", function () {
                var a = defined(jquery_1.default(".p")[0]);
                var loc = dloc_1.DLoc.mustMakeDLoc(root, [a, 0]);
                assert.equal(loc.node, a);
                assert.equal(loc.offset, 0);
                assert.equal(loc.root, root);
                assert.isTrue(loc.isValid());
            });
            it("throws when called with an array that has an undefined first member", function () {
                assert.throws(dloc_1.DLoc.mustMakeDLoc.bind(undefined, root, [undefined, 0]), Error, /^called mustMakeDLoc with an absent node$/);
            });
        });
        describe("DLoc", function () {
            describe("clone", function () {
                it("clones", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 1));
                    assert.deepEqual(loc, loc.clone());
                });
            });
            describe("make", function () {
                it("makes a new location with the same root", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var b = defined(jquery_1.default(".body .p")[1]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 1));
                    var loc2 = loc.make(b, 0);
                    assert.equal(loc.root, loc2.root);
                    assert.equal(loc2.node, b);
                    assert.equal(loc2.offset, 0);
                });
            });
            describe("makeRange", function () {
                it("makes a range", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var b = defined(jquery_1.default(".body .p")[1]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
                    var loc2 = loc.make(b, 1);
                    var range = defined(loc.makeRange(loc2));
                    assert.equal(range.range.startContainer, a);
                    assert.equal(range.range.startOffset, 0);
                    assert.equal(range.range.endContainer, b);
                    assert.equal(range.range.endOffset, 1);
                    assert.isFalse(range.range.collapsed);
                    assert.isFalse(range.reversed);
                });
                it("makes a collapsed range", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
                    var range = defined(loc.makeRange());
                    assert.equal(range.startContainer, a);
                    assert.equal(range.startOffset, 0);
                    assert.equal(range.endContainer, a);
                    assert.equal(range.endOffset, 0);
                    assert.isTrue(range.collapsed);
                });
                it("makes a reversed range", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var b = defined(jquery_1.default(".body .p")[1]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, b, 1));
                    var loc2 = loc.make(a, 0);
                    var range = defined(loc.makeRange(loc2));
                    assert.equal(range.range.startContainer, a);
                    assert.equal(range.range.startOffset, 0);
                    assert.equal(range.range.endContainer, b);
                    assert.equal(range.range.endOffset, 1);
                    assert.isFalse(range.range.collapsed);
                    assert.isTrue(range.reversed);
                });
                it("fails on an attribute node", function () {
                    var _a = makeAttributeNodeCase(), attrLoc = _a.attrLoc, loc = _a.loc;
                    assert.throws(function () { return attrLoc.makeRange(loc); }, Error, "cannot make range from attribute node");
                });
                it("fails on an attribute node passed as other", function () {
                    var _a = makeAttributeNodeCase(), attrLoc = _a.attrLoc, loc = _a.loc;
                    assert.throws(function () { return loc.makeRange(attrLoc); }, Error, "cannot make range from attribute node");
                });
                it("returns undefined on invalid location", function () {
                    var invalid = makeInvalidCase().invalid;
                    var range = invalid.makeRange();
                    assert.isUndefined(range);
                });
                it("returns undefined on invalid other", function () {
                    var _a = makeInvalidCase(), loc = _a.loc, invalid = _a.invalid;
                    var range = loc.makeRange(invalid);
                    assert.isUndefined(range);
                });
            });
            describe("makeDLocRange", function () {
                it("makes a range", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var b = defined(jquery_1.default(".body .p")[1]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
                    var loc2 = loc.make(b, 1);
                    var range = defined(loc.makeDLocRange(loc2));
                    assert.equal(range.start, loc);
                    assert.equal(range.end, loc2);
                });
                it("makes a collapsed range", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
                    var range = defined(loc.makeDLocRange());
                    assert.equal(range.start, loc);
                    assert.equal(range.end, loc);
                    assert.isTrue(range.collapsed);
                });
                it("returns undefined on invalid location", function () {
                    var invalid = makeInvalidCase().invalid;
                    var range = invalid.makeDLocRange();
                    assert.isUndefined(range);
                });
                it("returns undefined on invalid other", function () {
                    var _a = makeInvalidCase(), loc = _a.loc, invalid = _a.invalid;
                    var range = loc.makeDLocRange(invalid);
                    assert.isUndefined(range);
                });
            });
            describe("mustMakeDLocRange", function () {
                it("throws on invalid location", function () {
                    var invalid = makeInvalidCase().invalid;
                    assert.throws(function () { return invalid.mustMakeDLocRange(); }, Error, "cannot make a range");
                });
                it("throws on invalid other", function () {
                    var _a = makeInvalidCase(), loc = _a.loc, invalid = _a.invalid;
                    assert.throws(function () { return loc.mustMakeDLocRange(invalid); }, Error, "cannot make a range");
                });
            });
            describe("toArray", function () {
                it("returns an array with the right values", function () {
                    var a = defined(jquery_1.default(".body .p")[0]);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 1));
                    assert.deepEqual(loc.toArray(), [a, 1]);
                });
            });
            describe("isValid", function () {
                it("returns true when the location is valid (element)", function () {
                    var p = defined(jquery_1.default(".p")[0]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                    assert.isTrue(loc.isValid());
                });
                it("returns true when the location is valid (text)", function () {
                    var t = defined(jquery_1.default(".body .p")[0].firstChild);
                    assert.equal(t.nodeType, Node.TEXT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 0));
                    assert.isTrue(loc.isValid());
                });
                it("returns true when the location is valid (attribute)", function () {
                    var a = defined(jquery_1.default(".quote")[0].getAttributeNode(encodedType));
                    assert.isTrue(domutil_1.isAttr(a));
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, a, 0));
                    assert.isTrue(loc.isValid());
                });
                it("returns false when the node is no longer in the document (element)", function () {
                    $root.append("<div class='__test'></div>");
                    var t = defined(jquery_1.default(".__test")[0]);
                    assert.equal(t.nodeType, Node.ELEMENT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 0));
                    t.parentNode.removeChild(t);
                    assert.isFalse(loc.isValid());
                });
                it("returns false when the node is no longer in the document (text)", function () {
                    $root.append("<div class='__test'>test</div>");
                    var t = defined(jquery_1.default(".__test")[0].firstChild);
                    assert.equal(t.nodeType, Node.TEXT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 0));
                    t.parentNode.removeChild(t);
                    assert.isFalse(loc.isValid());
                });
                it("returns false when the node is no longer in the document (attribute)", function () {
                    $root.append("<div class='__test' foo='bar'></div>");
                    var t = defined(jquery_1.default(".__test")[0].attributes.getNamedItem("foo"));
                    assert.isTrue(domutil_1.isAttr(t));
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 0));
                    t.ownerElement.removeAttribute("foo");
                    assert.isFalse(loc.isValid());
                });
                it("returns false when the offset is not longer valid (element)", function () {
                    $root.append("<div class='__test'>test</div>");
                    var t = defined(jquery_1.default(".__test")[0]);
                    assert.equal(t.nodeType, Node.ELEMENT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 1));
                    t.removeChild(t.firstChild);
                    assert.isFalse(loc.isValid());
                });
                it("returns false when the offset is no longer valid (text)", function () {
                    $root.append("<div class='__test'>test</div>");
                    var t = defined(jquery_1.default(".__test")[0].firstChild);
                    assert.equal(t.nodeType, Node.TEXT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 4));
                    t.textContent = "t";
                    assert.isFalse(loc.isValid());
                });
                it("returns false when the offset is no longer valid (attribute)", function () {
                    $root.append("<div class='__test' foo='bar'></div>");
                    var t = defined(jquery_1.default(".__test")[0].attributes.getNamedItem("foo"));
                    assert.isTrue(domutil_1.isAttr(t));
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 3));
                    t.value = "f";
                    assert.isFalse(loc.isValid());
                });
            });
            describe("normalizeOffset", function () {
                it("makes a new valid location (element)", function () {
                    $root.append("<div class='__test'>test</div>");
                    var t = defined(jquery_1.default(".__test")[0]);
                    assert.equal(t.nodeType, Node.ELEMENT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 1));
                    t.removeChild(t.firstChild);
                    assert.isFalse(loc.isValid());
                    var norm = loc.normalizeOffset();
                    assert.isTrue(norm.isValid());
                    assert.notEqual(loc, norm);
                    assert.equal(norm.normalizeOffset(), norm);
                });
                it("makes a new valid location (text)", function () {
                    $root.append("<div class='__test'>test</div>");
                    var t = defined(jquery_1.default(".__test")[0].firstChild);
                    assert.equal(t.nodeType, Node.TEXT_NODE);
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 4));
                    t.textContent = "t";
                    assert.isFalse(loc.isValid());
                    var norm = loc.normalizeOffset();
                    assert.isTrue(norm.isValid());
                    assert.notEqual(loc, norm);
                    assert.equal(norm.normalizeOffset(), norm);
                });
                it("makes a new valid location (attribute)", function () {
                    $root.append("<div class='__test' foo='bar'></div>");
                    var t = defined(jquery_1.default(".__test")[0].attributes.getNamedItem("foo"));
                    assert.isTrue(domutil_1.isAttr(t));
                    var loc = defined(dloc_1.DLoc.makeDLoc(root, t, 3));
                    t.value = "f";
                    assert.isFalse(loc.isValid());
                    var norm = loc.normalizeOffset();
                    assert.isTrue(norm.isValid());
                    assert.notEqual(loc, norm);
                    assert.equal(norm.normalizeOffset(), norm);
                });
            });
            describe("equals", function () {
                var p;
                var loc;
                before(function () {
                    p = defined(jquery_1.default(".body .p")[0]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                });
                it("returns true if it is the same object", function () {
                    assert.isTrue(loc.equals(loc));
                });
                it("returns true if the two locations are equal", function () {
                    var loc2 = dloc_1.DLoc.makeDLoc(root, p, 0);
                    assert.isTrue(loc.equals(loc2));
                });
                it("returns false if other is null", function () {
                    assert.isFalse(loc.equals(null));
                });
                it("returns false if other is undefined", function () {
                    assert.isFalse(loc.equals(undefined));
                });
                it("returns false if the two nodes are unequal", function () {
                    assert.isFalse(loc.equals(loc.make(p.parentNode, 0)));
                });
                it("returns false if the two offsets are unequal", function () {
                    assert.isFalse(loc.equals(loc.make(p, 1)));
                });
            });
            describe("compare", function () {
                var p;
                var loc;
                before(function () {
                    p = defined(jquery_1.default(".body .p")[0]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                });
                it("returns 0 if it is the same object", function () {
                    assert.equal(loc.compare(loc), 0);
                });
                it("returns 0 if the two locations are equal", function () {
                    var loc2 = dloc_1.DLoc.mustMakeDLoc(root, p, 0);
                    assert.equal(loc.compare(loc2), 0);
                });
                describe("(siblings)", function () {
                    var next;
                    before(function () {
                        next = dloc_1.DLoc.mustMakeDLoc(root, p.nextSibling, 0);
                    });
                    it("returns -1 if this precedes other", function () {
                        assert.equal(loc.compare(next), -1);
                    });
                    it("returns 1 if this follows other", function () {
                        assert.equal(next.compare(loc), 1);
                    });
                });
                describe("(attribute - element)", function () {
                    var quote;
                    var attr;
                    before(function () {
                        var quoteNode = root.querySelector(".quote");
                        quote = dloc_1.DLoc.mustMakeDLoc(root, quoteNode);
                        attr = dloc_1.DLoc.mustMakeDLoc(root, quoteNode.getAttributeNode(encodedType), 0);
                    });
                    it("returns -1 if other is an attribute of this", function () {
                        assert.equal(quote.compare(attr), -1);
                    });
                    it("returns 1 if this is an attribute of other", function () {
                        assert.equal(attr.compare(quote), 1);
                    });
                });
                describe("(two attributes)", function () {
                    var parent;
                    var attr1;
                    var attr2;
                    before(function () {
                        parent = document.createElement("div");
                        parent.setAttribute("b", "2");
                        parent.setAttribute("a", "1");
                        new dloc_1.DLocRoot(parent);
                        attr1 = dloc_1.DLoc.mustMakeDLoc(parent, parent.getAttributeNode("a"), 0);
                        attr2 = dloc_1.DLoc.mustMakeDLoc(parent, parent.getAttributeNode("b"), 0);
                    });
                    it("returns -1 if this is an attribute coming before other", function () {
                        assert.equal(attr1.compare(attr2), -1);
                    });
                    it("returns 1 if this is an attribute coming aftger other", function () {
                        assert.equal(attr2.compare(attr1), 1);
                    });
                });
                describe("(parent - child positions)", function () {
                    var parentBefore;
                    var parentAfter;
                    before(function () {
                        parentBefore = dloc_1.DLoc.mustMakeDLoc(root, p.parentNode, 0);
                        parentAfter = parentBefore.makeWithOffset(1);
                        // We want to check that we are looking at the p element we think
                        // we are looking at.
                        assert.equal(parentBefore.node.childNodes[0], p);
                    });
                    it("returns -1 if this is a parent position before other", function () {
                        assert.equal(parentBefore.compare(loc), -1);
                    });
                    it("returns 1 if this is a parent position after other", function () {
                        assert.equal(parentAfter.compare(loc), 1);
                    });
                    it("returns 1 if this is a child position after other", function () {
                        assert.equal(loc.compare(parentBefore), 1);
                    });
                    it("returns -1 if this is a child position before other", function () {
                        assert.equal(loc.compare(parentAfter), -1);
                    });
                });
            });
            describe("pointedNode", function () {
                var quoteNode;
                var attributeNode;
                var quote;
                var attr;
                before(function () {
                    quoteNode = root.querySelector(".quote");
                    attributeNode = quoteNode.getAttributeNode(encodedType);
                    quote = dloc_1.DLoc.mustMakeDLoc(root, quoteNode);
                    attr = dloc_1.DLoc.mustMakeDLoc(root, attributeNode, 0);
                });
                it("returns the child of an element node", function () {
                    assert.equal(quoteNode.parentNode, quote.node);
                    assert.equal(quote.pointedNode, quoteNode);
                });
                it("returns the text node itself", function () {
                    var text = quoteNode.firstChild;
                    assert.equal(text.nodeType, Node.TEXT_NODE);
                    var newLoc = quote.make(text, 0);
                    assert.equal(newLoc.pointedNode, text);
                });
                it("returns the attribute node itself", function () {
                    assert.equal(attr.pointedNode, attributeNode);
                });
                it("returns undefined if the offset is past all children", function () {
                    assert.isUndefined(quote.make(quoteNode, quoteNode.childNodes.length).pointedNode);
                });
            });
            describe("makeWithOffset", function () {
                var p;
                var loc;
                before(function () {
                    p = defined(jquery_1.default(".body .p")[0]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                });
                it("makes a new object with a new offset", function () {
                    var loc2 = loc.makeWithOffset(1);
                    assert.equal(loc2.offset, 1);
                    assert.notEqual(loc.offset, loc2.offset);
                    assert.notEqual(loc, loc2);
                });
                it("returns the same object if the offset is the same", function () {
                    var loc2 = loc.makeWithOffset(0);
                    assert.equal(loc, loc2);
                });
            });
            describe("getLocationInParent", function () {
                var p;
                var loc;
                before(function () {
                    p = defined(jquery_1.default(".body .p")[1]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                });
                it("gets a valid location", function () {
                    var loc2 = loc.getLocationInParent();
                    assert.equal(loc2.offset, 1);
                    assert.equal(loc2.node, loc.node.parentNode);
                });
                it("fails if we are already at the root", function () {
                    var loc2 = loc.make(root, 0);
                    assert.throws(loc2.getLocationInParent.bind(loc2), Error, "node not in root");
                });
            });
            describe("getLocationAfterInParent", function () {
                var p;
                var loc;
                before(function () {
                    p = defined(jquery_1.default(".body .p")[1]);
                    assert.equal(p.nodeType, Node.ELEMENT_NODE);
                    loc = defined(dloc_1.DLoc.makeDLoc(root, p, 0));
                });
                it("gets a valid location", function () {
                    var loc2 = loc.getLocationAfterInParent();
                    assert.equal(loc2.offset, 2);
                    assert.equal(loc2.node, loc.node.parentNode);
                });
                it("fails if we are already at the root", function () {
                    var loc2 = loc.make(root, 0);
                    assert.throws(loc2.getLocationAfterInParent.bind(loc2), Error, "node not in root");
                });
            });
        });
        describe("DLocRange", function () {
            var a;
            var loc;
            before(function () {
                a = defined(jquery_1.default(".body .p")[0].firstChild);
                loc = dloc_1.DLoc.mustMakeDLoc(root, a, 0);
            });
            describe("collapsed", function () {
                it("is true when a range is collapsed", function () {
                    assert.isTrue(new dloc_1.DLocRange(loc, loc).collapsed);
                });
                it("is false when a range is not collapsed", function () {
                    assert.isFalse(new dloc_1.DLocRange(loc, loc.makeWithOffset(1)).collapsed);
                });
            });
            describe("equals", function () {
                it("returns true when other is the same object as this", function () {
                    var range = new dloc_1.DLocRange(loc, loc);
                    assert.isTrue(range.equals(range));
                });
                it("returns true when the two ranges have the same start and end", function () {
                    var range = new dloc_1.DLocRange(loc, loc.makeWithOffset(1));
                    var range2 = new dloc_1.DLocRange(dloc_1.DLoc.mustMakeDLoc(root, a, 0), dloc_1.DLoc.mustMakeDLoc(root, a, 1));
                    assert.isTrue(range.equals(range2));
                });
                it("returns false when the two ranges differ in start positions", function () {
                    var range = new dloc_1.DLocRange(loc, loc.makeWithOffset(1));
                    var range2 = new dloc_1.DLocRange(dloc_1.DLoc.mustMakeDLoc(root, a, 1), dloc_1.DLoc.mustMakeDLoc(root, a, 1));
                    assert.isFalse(range.start.equals(range2.start));
                    assert.isTrue(range.end.equals(range2.end));
                    assert.isFalse(range.equals(range2));
                });
                it("returns false when the two ranges differ in end positions", function () {
                    var range = new dloc_1.DLocRange(loc, loc);
                    var range2 = new dloc_1.DLocRange(dloc_1.DLoc.mustMakeDLoc(root, a, 0), dloc_1.DLoc.mustMakeDLoc(root, a, 1));
                    assert.isTrue(range.start.equals(range2.start));
                    assert.isFalse(range.end.equals(range2.end));
                    assert.isFalse(range.equals(range2));
                });
            });
            describe("isValid", function () {
                it("returns true if both ends are valid", function () {
                    assert.isTrue(new dloc_1.DLocRange(loc, loc).isValid());
                });
                it("returns false if start is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    assert.isFalse(new dloc_1.DLocRange(invalid, loc).isValid());
                });
                it("returns false if end is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    assert.isFalse(new dloc_1.DLocRange(loc, invalid).isValid());
                });
            });
            describe("makeDOMRange", function () {
                it("makes a DOM range", function () {
                    var loc2 = loc.makeWithOffset(1);
                    var range = new dloc_1.DLocRange(loc, loc2).makeDOMRange();
                    assert.isDefined(range);
                    assert.equal(range.startContainer, loc.node);
                    assert.equal(range.startOffset, loc.offset);
                    assert.equal(range.endContainer, loc2.node);
                    assert.equal(range.endOffset, loc2.offset);
                });
                it("fails if start is an attribute node", function () {
                    var _a = makeAttributeNodeCase(), attrLoc = _a.attrLoc, loc2 = _a.loc;
                    assert.throws(function () { return new dloc_1.DLocRange(attrLoc, loc2).makeDOMRange(); }, Error, "cannot make range from attribute node");
                });
                it("fails if end is an attribute node", function () {
                    var _a = makeAttributeNodeCase(), attrLoc = _a.attrLoc, loc2 = _a.loc;
                    assert.throws(function () { return new dloc_1.DLocRange(loc2, attrLoc).makeDOMRange(); }, Error, "cannot make range from attribute node");
                });
                it("returns undefined if start is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    assert.isUndefined(new dloc_1.DLocRange(invalid, loc).makeDOMRange());
                });
                it("returns undefined if end is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    assert.isUndefined(new dloc_1.DLocRange(loc, invalid).makeDOMRange());
                });
            });
            describe("mustMakeDOMRange", function () {
                it("makes a DOM range", function () {
                    var loc2 = loc.makeWithOffset(1);
                    var range = new dloc_1.DLocRange(loc, loc2).mustMakeDOMRange();
                    assert.isDefined(range);
                    assert.equal(range.startContainer, loc.node);
                    assert.equal(range.startOffset, loc.offset);
                    assert.equal(range.endContainer, loc2.node);
                    assert.equal(range.endOffset, loc2.offset);
                });
                it("throws if start is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    var range = new dloc_1.DLocRange(invalid, loc);
                    assert.throws(function () { return range.mustMakeDOMRange(); }, Error, "cannot make a range");
                });
                it("throws if end is invalid", function () {
                    var invalid = makeInvalidCase().invalid;
                    var range = new dloc_1.DLocRange(loc, invalid);
                    assert.throws(function () { return range.mustMakeDOMRange(); }, Error, "cannot make a range");
                });
            });
            describe("contains", function () {
                var range;
                before(function () {
                    range = new dloc_1.DLocRange(loc, loc.makeWithOffset(2));
                });
                it("returns false if the location is before the range", function () {
                    assert.isFalse(range.contains(loc.make(loc.node.parentNode, 0)));
                });
                it("returns false if the location is after the range", function () {
                    assert.isFalse(range.contains(loc.makeWithOffset(3)));
                });
                it("returns true if the location is at start of the range", function () {
                    assert.isTrue(range.contains(loc.makeWithOffset(0)));
                });
                it("returns true if the location is at end of the range", function () {
                    assert.isTrue(range.contains(loc.makeWithOffset(2)));
                });
                it("returns true if the location is between the ends", function () {
                    assert.isTrue(range.contains(loc.makeWithOffset(1)));
                });
            });
        });
    });
});
//# sourceMappingURL=dloc-test.js.map