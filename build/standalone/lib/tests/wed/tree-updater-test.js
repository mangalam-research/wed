define(["require", "exports", "rxjs/operators/filter", "wed/convert", "wed/dloc", "wed/domutil", "wed/tree-updater", "../util"], function (require, exports, filter_1, convert, dloc_1, domutil_1, tree_updater_1, util_1) {
    /**
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    function filterSetTextNodeValue(ev) {
        return ev.name === "SetTextNodeValue";
    }
    function filterSetAttributeNS(ev) {
        return ev.name === "SetAttributeNS";
    }
    function filterInsertNodeAtAndBefore(ev) {
        return ev.name === "InsertNodeAt" || ev.name === "BeforeInsertNodeAt";
    }
    function filterBeforeDeleteNode(ev) {
        return ev.name === "BeforeDeleteNode";
    }
    function filterDeleteNode(ev) {
        return ev.name === "DeleteNode";
    }
    describe("TreeUpdater", function () {
        var root;
        var htmlTree;
        before(function () {
            return new util_1.DataProvider("/base/build/standalone/lib/tests/tree_updater_test_data/")
                .getText("source_converted.xml")
                .then(function (sourceXML) {
                root = document.createElement("div");
                document.body.appendChild(root);
                new dloc_1.DLocRoot(root);
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(sourceXML, "text/xml");
                htmlTree = convert.toHTMLTree(document, xmlDoc.firstElementChild);
            });
        });
        var tu;
        beforeEach(function () {
            root.appendChild(htmlTree.cloneNode(true));
            tu = new tree_updater_1.TreeUpdater(root);
        });
        afterEach(function () {
            while (root.lastChild !== null) {
                root.removeChild(root.lastChild);
            }
        });
        after(function () {
            document.body.removeChild(root);
        });
        // tslint:disable-next-line:completed-docs
        var Listener = /** @class */ (function () {
            function Listener(updater) {
                var _this = this;
                this.expected = {
                    BeforeInsertNodeAt: 0,
                    InsertNodeAt: 0,
                    SetTextNodeValue: 0,
                    BeforeDeleteNode: 0,
                    DeleteNode: 0,
                    SetAttributeNS: 0,
                    Changed: undefined,
                };
                this._events = Object.create(null);
                updater.events.subscribe(function (ev) {
                    var name = ev.name;
                    if (_this._events[name] === undefined) {
                        _this._events[name] = 0;
                    }
                    _this._events[name]++;
                });
            }
            Listener.prototype.check = function () {
                // The event "changed" is special. We should get one "changed" event per
                // other event.
                var keys = Object.keys(this.expected);
                if (this.expected.Changed === undefined) {
                    var total = 0;
                    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                        var k = keys_1[_i];
                        if (k === "Changed") {
                            continue;
                        }
                        total += this.expected[k];
                    }
                    this.expected.Changed = total;
                }
                for (var _a = 0, keys_2 = keys; _a < keys_2.length; _a++) {
                    var k = keys_2[_a];
                    var actual = this._events[k];
                    if (actual === undefined) {
                        actual = 0;
                    }
                    assert.equal(actual, this.expected[k], "number of events " + k);
                }
                for (var _b = 0, _c = Object.keys(this._events); _b < _c.length; _b++) {
                    var k = _c[_b];
                    assert.isDefined(this.expected[k], "unaccounted event " + k);
                }
            };
            return Listener;
        }());
        describe("insertNodeAt", function () {
            it("fails on fragments", function () {
                var top = root.querySelector(".p");
                var node = document.createDocumentFragment();
                assert.throws(tu.insertNodeAt.bind(tu, top, 0, node), Error, "document fragments cannot be passed to insertNodeAt");
            });
        });
        describe("splitAt", function () {
            it("fails on node which is not child of the top", function () {
                var top = root.querySelector(".p");
                var node = root.querySelector(".title");
                assert.throws(tu.splitAt.bind(tu, top, node, 0), Error, "split location is not inside top");
            });
            it("fails if splitting would denormalize an element", function () {
                var node = root.querySelector(".title");
                assert.throws(tu.splitAt.bind(tu, node.firstChild, node.firstChild, 2), Error, "splitAt called in a way that would result in " +
                    "two adjacent text nodes");
            });
            it("splitting recursively, one level of depth generates appropriate events", function () {
                var node = root.querySelector(".title");
                var parent = node.parentNode;
                var listener = new Listener(tu);
                var calls = [
                    // Insertion of a text node into <title>.
                    [parent, 0],
                    // Insertion of the completed 2nd half into the DOM tree.
                    [parent, 1],
                ];
                var callsIx = 0;
                tu.events.pipe(filter_1.filter(filterInsertNodeAtAndBefore))
                    .subscribe(function (ev) {
                    var call = calls[callsIx];
                    assert.equal(ev.parent, call[0]);
                    assert.equal(ev.index, call[1]);
                    if (ev.name === "InsertNodeAt") {
                        callsIx++;
                    }
                });
                listener.expected.InsertNodeAt = 2;
                listener.expected.BeforeInsertNodeAt = 2;
                var formerParent = node.parentNode;
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                    assert.equal(ev.formerParent, formerParent);
                });
                listener.expected.DeleteNode = 1;
                tu.splitAt(node, node.firstChild, 2);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.firstChild.outerHTML, "<div class=\"title _local_title _xmlns_http://www.tei-c.org/ns/1.0 _real\">ab</div>", "first half");
                assert.equal(parent.childNodes[1].outerHTML, "<div class=\"title _local_title _xmlns_http://www.tei-c.org/ns/1.0 _real\">cd</div>", "second half");
                listener.check();
            });
            it("spliting recursively, at multiple levels does the right work", function () {
                var node = root.querySelector(".quote").firstChild;
                var top = root.querySelector(".text");
                var body = top.querySelector(".body");
                // Drop the nodes from 3 onwards so that future additions don't change
                // this test.
                while (body.childNodes[3] !== undefined) {
                    body.removeChild(body.childNodes[3]);
                }
                var parent = top.parentNode;
                var pair = tu.splitAt(top, node, 3);
                var texts = domutil_1.childrenByClass(parent, "text");
                var firstText = texts[0];
                var nextText = texts[1];
                // Check that we're doing what we think we're doing.
                assert.equal(firstText.outerHTML, "<div class=\"text _local_text _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"body _local_body _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">blah</div><div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before <div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">quo</div></div></div></div>", "before");
                assert.equal(pair[0], firstText);
                assert.equal(pair[1], nextText);
                assert.equal(nextText.outerHTML, "<div class=\"text _local_text _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"body _local_body _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">ted</div> between <div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">quoted2</div> after</div><div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\"><div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">quoted</div><div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">quoted2</div><div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">quoted3</div></div></div></div>", "after");
            });
            it("does the right thing if spliting at end an element", function () {
                var top = root.querySelector(".body>.p");
                var node = top.firstChild;
                // Make sure we're looking at the right stuff.
                assert.equal(node.nodeValue.length, 4);
                var pair = tu.splitAt(top, node, 4);
                assert.equal(pair[0].outerHTML, "<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">blah</div>");
                assert.equal(pair[1].outerHTML, "<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\"></div>");
            });
        });
        describe("insertText", function () {
            it("generates appropriate events when it modifies a text node", function () {
                var node = root.querySelector(".title").firstChild;
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.value, "abQcd");
                });
                listener.expected.SetTextNodeValue = 1;
                var _a = tu.insertText(node, 2, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                // Check that we're doing what we think we're doing.
                assert.equal(textNode, node);
                assert.isFalse(isNew);
                assert.equal(textNode.nodeValue, "abQcd");
                assert.equal(caret.node, textNode);
                assert.equal(caret.offset, 3);
                listener.check();
            });
            function makeSeries(seriesTitle, caretAtEnd, adapter) {
                describe(seriesTitle, function () {
                    it("generates appropriate events when it uses the next text node", function () {
                        var node = root.querySelector(".title");
                        var listener = new Listener(tu);
                        tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                            assert.equal(ev.node, node.firstChild);
                            assert.equal(ev.value, "Qabcd");
                        });
                        listener.expected.SetTextNodeValue = 1;
                        var _a = adapter(node, 0, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        // Check that we're doing what we think we're doing.
                        assert.equal(textNode, node.firstChild);
                        assert.isFalse(isNew);
                        assert.equal(textNode.nodeValue, "Qabcd");
                        assert.equal(caret.node, textNode);
                        assert.equal(caret.offset, caretAtEnd ? 1 : 0);
                        listener.check();
                    });
                    it("generates appropriate events when it uses the previous text node", function () {
                        var node = root.querySelector(".title");
                        var listener = new Listener(tu);
                        tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                            assert.equal(ev.node, node.firstChild);
                            assert.equal(ev.value, "abcdQ");
                        });
                        listener.expected.SetTextNodeValue = 1;
                        var _a = adapter(node, 1, "Q"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        // Check that we're doing what we think we're doing.
                        assert.equal(textNode, node.firstChild);
                        assert.isFalse(isNew);
                        assert.equal(textNode.nodeValue, "abcdQ");
                        assert.equal(caret.node, textNode);
                        assert.equal(caret.offset, caretAtEnd ? 5 : 4);
                        listener.check();
                    });
                    it("generates appropriate events when it creates a text node", function () {
                        var node = root.querySelector(".title");
                        // tslint:disable-next-line:no-inner-html
                        node.innerHTML = "";
                        var listener = new Listener(tu);
                        tu.events.pipe(filter_1.filter(filterInsertNodeAtAndBefore))
                            .subscribe(function (ev) {
                            assert.equal(ev.parent, node);
                            assert.equal(ev.index, 0);
                            assert.equal(ev.node.nodeValue, "test");
                        });
                        listener.expected.InsertNodeAt = 1;
                        listener.expected.BeforeInsertNodeAt = 1;
                        var _a = adapter(node, 0, "test"), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        // Check that we're doing what we think we're doing.
                        assert.equal(textNode, node.firstChild);
                        assert.equal(textNode.nodeValue, "test");
                        assert.isTrue(isNew);
                        assert.equal(caret.node, textNode);
                        assert.equal(caret.offset, caretAtEnd ? 4 : 0);
                        listener.check();
                    });
                    it("does nothing if passed an empty string", function () {
                        var node = root.querySelector(".title");
                        var listener = new Listener(tu);
                        assert.equal(node.firstChild.nodeValue, "abcd");
                        var _a = adapter(node, 1, ""), textNode = _a.node, isNew = _a.isNew, caret = _a.caret;
                        // Check that we're doing what we think we're doing.
                        assert.equal(node.firstChild.nodeValue, "abcd");
                        assert.isUndefined(textNode);
                        assert.isFalse(isNew);
                        assert.equal(caret.node, node);
                        assert.equal(caret.offset, 1);
                        listener.check();
                    });
                });
            }
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries("(caretAtEnd unspecified)", true, function (node, offset, text) { return tu.insertText(node, offset, text); });
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries("(caretAtEnd true)", true, function (node, offset, text) { return tu.insertText(node, offset, text, true); });
            // tslint:disable-next-line:mocha-no-side-effect-code
            makeSeries("(caretAtEnd false)", false, function (node, offset, text) {
                return tu.insertText(node, offset, text, false);
            });
        });
        describe("deleteText", function () {
            it("fails on non-text node", function () {
                var node = root.querySelector(".title");
                assert.throws(tu.deleteText.bind(tu, node, 0, "t"), Error, "deleteText called on non-text");
            });
            it("generates appropriate events when it modifies a text node", function () {
                var node = root.querySelector(".title").firstChild;
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.value, "ab");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.deleteText(node, 2, 2);
                // Check that we're doing what we think we're doing.
                assert.equal(node.nodeValue, "ab");
                listener.check();
            });
            it("generates appropriate events when it deletes an empty text node", function () {
                var node = root.querySelector(".title").firstChild;
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                tu.deleteText(node, 0, 4);
                // Check that we're doing what we think we're doing.
                assert.isNull(node.parentNode);
                listener.check();
            });
        });
        describe("setAttribute", function () {
            it("fails on non-element node", function () {
                var node = root.querySelector(".title").firstChild;
                assert.throws(tu.setAttribute.bind(tu, node, "q", "ab"), Error, "setAttribute called on non-element");
            });
            it("generates appropriate events when changing an attribute", function () {
                var node = root.querySelector(".title");
                // Check that the attribute is not set yet.
                assert.equal(node.getAttribute("q"), undefined);
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterSetAttributeNS)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.ns, "");
                    assert.equal(ev.attribute, "q");
                    assert.equal(ev.oldValue, undefined);
                    assert.equal(ev.newValue, "ab");
                });
                listener.expected.SetAttributeNS = 1;
                tu.setAttribute(node, "q", "ab");
                // Check that we're doing what we think we're doing.
                assert.equal(node.getAttribute("q"), "ab");
                listener.check();
            });
            it("generates appropriate events when removing an attribute", function () {
                var node = root.querySelector(".title");
                // Set the attribute
                node.setAttribute("q", "ab");
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterSetAttributeNS)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.ns, "");
                    assert.equal(ev.attribute, "q");
                    assert.equal(ev.oldValue, "ab");
                    assert.equal(ev.newValue, null);
                });
                listener.expected.SetAttributeNS = 1;
                tu.setAttribute(node, "q", null);
                assert.equal(node.getAttribute("q"), undefined, "value after");
                listener.check();
            });
        });
        describe("insertIntoText", function () {
            it("fails on non-text node", function () {
                var node = root.querySelector(".title");
                assert.throws(tu.insertIntoText.bind(tu, node, 0, node), Error, "insertIntoText called on non-text");
            });
            it("fails on undefined node to insert", function () {
                var node = root.querySelector(".title").firstChild;
                assert.throws(tu.insertIntoText.bind(tu, node, 0, undefined), Error, "must pass an actual node to insert");
            });
            it("generates appropriate events when inserting a new element", function () {
                var parent = root.querySelector(".title");
                var node = parent.firstChild;
                var el = document.createElement("span");
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                var inaCalls = [
                    [parent, 0],
                    [parent, 1],
                    [parent, 2],
                ];
                var inaCallIx = 0;
                tu.events.pipe(filter_1.filter(filterInsertNodeAtAndBefore))
                    .subscribe(function (ev) {
                    var call = inaCalls[inaCallIx];
                    assert.equal(ev.parent, call[0]);
                    assert.equal(ev.index, call[1]);
                    // We don't check ev.node here.
                    if (ev.name === "InsertNodeAt") {
                        inaCallIx++;
                    }
                });
                listener.expected.InsertNodeAt = 3;
                listener.expected.BeforeInsertNodeAt = 3;
                var pair = tu.insertIntoText(node, 2, el);
                // Check that we're doing what we think we're doing.
                assert.equal(pair[0].node.nodeValue, "ab");
                assert.equal(pair[0].node.nextSibling, el);
                assert.equal(pair[0].offset, 2);
                assert.equal(pair[1].node.nodeValue, "cd");
                assert.equal(pair[1].node.previousSibling, el);
                assert.equal(pair[1].offset, 0);
                assert.equal(root.querySelector(".title").childNodes.length, 3);
                assert.equal(root.querySelector(".title").childNodes[1], el);
                listener.check();
            });
            it("works fine with negative offset", function () {
                var node = root.querySelector(".title").firstChild;
                var parent = node.parentNode;
                var el = document.createElement("span");
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                var inaCalls = [
                    [parent, 0],
                    [parent, 1],
                ];
                var inaCallIx = 0;
                tu.events.pipe(filter_1.filter(filterInsertNodeAtAndBefore))
                    .subscribe(function (ev) {
                    var call = inaCalls[inaCallIx];
                    assert.equal(ev.parent, call[0]);
                    assert.equal(ev.index, call[1]);
                    // We don't check ev.node here.
                    if (ev.name === "InsertNodeAt") {
                        inaCallIx++;
                    }
                });
                listener.expected.InsertNodeAt = 2;
                listener.expected.BeforeInsertNodeAt = 2;
                var pair = tu.insertIntoText(node, -1, el);
                // Check that we're doing what we think we're doing.
                assert.equal(pair[0].node, parent);
                assert.equal(pair[0].offset, 0);
                assert.equal(pair[1].node.nodeValue, "abcd");
                assert.equal(pair[1].node.previousSibling, el);
                assert.equal(root.querySelector(".title").childNodes.length, 2);
                listener.check();
            });
            it("works fine with offset beyond text length", function () {
                var node = root.querySelector(".title").firstChild;
                var parent = node.parentNode;
                var el = document.createElement("span");
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                var inaCalls = [
                    [parent, 0],
                    [parent, 1],
                ];
                var inaCallIx = 0;
                tu.events.pipe(filter_1.filter(filterInsertNodeAtAndBefore))
                    .subscribe(function (ev) {
                    var call = inaCalls[inaCallIx];
                    assert.equal(ev.parent, call[0]);
                    assert.equal(ev.index, call[1]);
                    // We don't check ev.node here.
                    if (ev.name === "InsertNodeAt") {
                        inaCallIx++;
                    }
                });
                listener.expected.InsertNodeAt = 2;
                listener.expected.BeforeInsertNodeAt = 2;
                var pair = tu.insertIntoText(node, node.nodeValue.length, el);
                // Check that we're doing what we think we're doing.
                assert.equal(pair[0].node.nodeValue, "abcd");
                assert.equal(pair[0].node.nextSibling, el);
                assert.equal(pair[1].node, parent);
                assert.equal(pair[1].offset, 2);
                assert.equal(root.querySelector(".title").childNodes.length, 2);
                listener.check();
            });
        });
        describe("setTextNodeValue", function () {
            it("fails on non-text node", function () {
                var node = root.querySelector(".title");
                assert.throws(tu.setTextNode.bind(tu, node, "test"), Error, "setTextNode called on non-text");
            });
            it("generates appropriate events when setting text", function () {
                var node = root.querySelector(".title").firstChild;
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.value, node.nodeValue);
                });
                listener.expected.SetTextNodeValue = 1;
                assert.equal(node.nodeValue, "abcd");
                tu.setTextNode(node, "test");
                // Check that we're doing what we think we're doing.
                assert.equal(node.nodeValue, "test");
                listener.check();
            });
            it("generates appropriate events when setting text to an empty string", function () {
                var node = root.querySelector(".title").firstChild;
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                assert.equal(node.nodeValue, "abcd");
                tu.setTextNode(node, "");
                // Check that we're doing what we think we're doing.
                assert.isNull(node.parentNode);
                listener.check();
            });
        });
        describe("removeNode", function () {
            it("generates appropriate events when removing a node", function () {
                var node = root.querySelectorAll(".body>.p")[2]
                    .querySelectorAll(".quote")[1];
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 3);
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                tu.removeNode(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.outerHTML, ("\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div>\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted3</div></div>"));
                assert.equal(parent.childNodes.length, 2);
                listener.check();
            });
            it("generates appropriate events when merging text", function () {
                var node = root.querySelectorAll(".body>.p")[1]
                    .querySelector(".quote");
                var parent = node.parentNode;
                var prev = node.previousSibling;
                var next = node.nextSibling;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                var firstBefore = true;
                var first = true;
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    // beforeDeleteNode will be emitted twice. Once to
                    // remove the node itself, and second to merge the
                    // text nodes.
                    if (firstBefore) {
                        assert.equal(ev.node, node);
                    }
                    else {
                        assert.equal(ev.node, next);
                    }
                    assert.isNotNull(ev.node.parentNode);
                    firstBefore = false;
                });
                listener.expected.BeforeDeleteNode = 2;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    // deleteNode will be emitted twice. Once to
                    // remove the node itself, and second to merge the
                    // text nodes.
                    if (first) {
                        assert.equal(ev.node, node);
                    }
                    else {
                        assert.equal(ev.node, next);
                    }
                    assert.isNull(ev.node.parentNode);
                    first = false;
                });
                listener.expected.DeleteNode = 2;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, prev);
                    assert.equal(ev.value, "before  between ");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.removeNode(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("does not bork on missing previous text", function () {
                // An earlier bug would cause an unhandled exception on this test.
                var node = root.querySelectorAll(".body>.p")[2].querySelector(".quote");
                var parent = node.parentNode;
                var ret = tu.removeNode(node);
                assert.equal(ret.node, parent);
                assert.equal(ret.offset, 0);
            });
        });
        describe("removeNodeNF", function () {
            it("generates appropriate events when removing a node", function () {
                var node = root.querySelectorAll(".body>.p")[2]
                    .querySelectorAll(".quote")[1];
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 3);
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                tu.removeNodeNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div>\
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted3</div></div>");
                assert.equal(parent.childNodes.length, 2);
                listener.check();
            });
            it("generates appropriate events when merging text", function () {
                var node = root.querySelectorAll(".body>.p")[1]
                    .querySelector(".quote");
                var parent = node.parentNode;
                var prev = node.previousSibling;
                var next = node.nextSibling;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                var firstBefore = true;
                var first = true;
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    // beforeDeleteNode will be emitted twice. Once to
                    // remove the node itself, and second to merge the
                    // text nodes.
                    if (firstBefore) {
                        assert.equal(ev.node, node);
                    }
                    else {
                        assert.equal(ev.node, next);
                    }
                    assert.isNotNull(ev.node.parentNode);
                    firstBefore = false;
                });
                listener.expected.BeforeDeleteNode = 2;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    // deleteNode will be emitted twice. Once to
                    // remove the node itself, and second to merge the
                    // text nodes.
                    if (first) {
                        assert.equal(ev.node, node);
                    }
                    else {
                        assert.equal(ev.node, next);
                    }
                    assert.isNull(ev.node.parentNode);
                    first = false;
                });
                listener.expected.DeleteNode = 2;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, prev);
                    assert.equal(ev.value, "before  between ");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.removeNodeNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("does not bork on missing previous text", function () {
                // An earlier bug would cause an unhandled exception on this
                // test.
                var node = root.querySelectorAll(".body>.p")[2]
                    .querySelector(".quote");
                var parent = node.parentNode;
                var ret = tu.removeNodeNF(node);
                assert.equal(ret.node, parent);
                assert.equal(ret.offset, 0);
            });
            it("generates no events if the node is undefined", function () {
                var listener = new Listener(tu);
                var initialHTML = root.outerHTML;
                assert.isUndefined(tu.removeNodeNF(undefined));
                // Check that nothing changed.
                assert.equal(root.outerHTML, initialHTML);
                listener.check();
            });
            it("generates no events if the node is null", function () {
                var listener = new Listener(tu);
                var initialHTML = root.outerHTML;
                assert.isUndefined(tu.removeNodeNF(null));
                // Check that nothing changed.
                assert.equal(root.outerHTML, initialHTML);
                listener.check();
            });
        });
        describe("removeNodes", function () {
            it("fails on nodes of different parents", function () {
                // An earlier bug would cause an unhandled exception on this
                // test.
                var node = root.querySelectorAll(".body>.p")[2]
                    .querySelector(".quote");
                assert.throws(tu.removeNodes.bind(tu, [node, node.parentNode]), Error, "nodes are not immediately contiguous in document order");
            });
            it("generates appropriate events when merging text", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var quotes = domutil_1.childrenByClass(p, "quote");
                var firstNode = quotes[0];
                var lastNode = quotes[quotes.length - 1];
                var nodes = Array.prototype.slice.call(p.childNodes, domutil_1.indexOf(p.childNodes, firstNode), domutil_1.indexOf(p.childNodes, lastNode) + 1);
                var parent = firstNode.parentNode;
                var prev = firstNode.previousSibling;
                var next = lastNode.nextSibling;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                var calls = nodes.concat([next]);
                var callsIx = 0;
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    var call = calls[callsIx];
                    assert.equal(ev.node, call, "beforeDeleteNode call " + callsIx);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 4;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    var call = calls[callsIx];
                    assert.equal(ev.node, call, "beforeDeleteNode call " + callsIx);
                    assert.isNull(ev.node.parentNode);
                    callsIx++;
                });
                listener.expected.DeleteNode = 4;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, prev, "setTextNodeValue node");
                    assert.equal(ev.value, "before  after", "setTextNodeValue value");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.removeNodes(nodes);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 1);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
before  after</div>");
                listener.check();
            });
            it("does not bork on missing previous text", function () {
                // An earlier bug would cause an unhandled exception on this
                // test.
                var node = root.querySelectorAll(".body>.p")[2]
                    .querySelector(".quote");
                var parent = node.parentNode;
                var ret = tu.removeNodes([node]);
                assert.equal(ret.node, parent);
                assert.equal(ret.offset, 0);
            });
        });
        describe("mergeTextNodes", function () {
            it("generates appropriate events when merging text", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                // Remove the first quote so that we have two text nodes adjacent.
                var quote = domutil_1.childByClass(p, "quote");
                p.removeChild(quote);
                var node = p.firstChild;
                var parent = node.parentNode;
                var next = node.nextSibling;
                assert.equal(parent.childNodes.length, 4);
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, next);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, next);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.value, "before  between ");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.mergeTextNodes(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("does nothing if there is nothing to do", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                tu.mergeTextNodes(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 5);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("returns a proper caret value when it merges", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                // Remove the first quote so that we have two text nodes adjacent.
                var quote = domutil_1.childByClass(p, "quote");
                p.removeChild(quote);
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 4);
                var ret = tu.mergeTextNodes(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
before  between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                // Check return value.
                assert.equal(ret.node, node);
                assert.equal(ret.offset, 7);
            });
            it("returns a proper caret value when it does nothing", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                var ret = tu.mergeTextNodes(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 5);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
                // Check the return value.
                assert.equal(ret.node, parent);
                assert.equal(ret.offset, domutil_1.indexOf(parent.childNodes, node) + 1);
            });
        });
        describe("mergeTextNodesNF", function () {
            it("generates appropriate events when merging text", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                // Remove the first quote so that we have two text nodes adjacent.
                var quote = domutil_1.childByClass(p, "quote");
                p.removeChild(quote);
                var node = p.firstChild;
                var parent = node.parentNode;
                var next = node.nextSibling;
                assert.equal(parent.childNodes.length, 4);
                var listener = new Listener(tu);
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, next);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    assert.equal(ev.node, next);
                    assert.isNull(ev.node.parentNode);
                });
                listener.expected.DeleteNode = 1;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    assert.equal(ev.node, node);
                    assert.equal(ev.value, "before  between ");
                });
                listener.expected.SetTextNodeValue = 1;
                tu.mergeTextNodesNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("does nothing if there is nothing to do", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                tu.mergeTextNodesNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 5);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
            });
            it("returns a proper caret value when it merges", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                // Remove the first quote so that we have two text nodes adjacent.
                var quote = domutil_1.childByClass(p, "quote");
                p.removeChild(quote);
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 4);
                var ret = tu.mergeTextNodesNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 3);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before  \
between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                // Check return value.
                assert.equal(ret.node, node);
                assert.equal(ret.offset, 7);
            });
            it("returns a proper caret value when it does nothing", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var node = p.firstChild;
                var parent = node.parentNode;
                assert.equal(parent.childNodes.length, 5);
                var listener = new Listener(tu);
                var ret = tu.mergeTextNodesNF(node);
                // Check that we're doing what we think we're doing.
                assert.equal(parent.childNodes.length, 5);
                assert.equal(parent.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">before \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted</div> between \
<div class=\"quote _local_quote _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
quoted2</div> after</div>");
                listener.check();
                // Check the return value.
                assert.equal(ret.node, parent);
                assert.equal(ret.offset, domutil_1.indexOf(parent.childNodes, node) + 1);
            });
            it("generates no events if the node is undefined", function () {
                var listener = new Listener(tu);
                var initialHTML = root.outerHTML;
                assert.isUndefined(tu.removeNodeNF(undefined));
                // Check that nothing changed.
                assert.equal(root.outerHTML, initialHTML);
                listener.check();
            });
            it("generates no events if the node is null", function () {
                var listener = new Listener(tu);
                var initialHTML = root.outerHTML;
                assert.isUndefined(tu.mergeTextNodesNF(null));
                // Check that nothing changed.
                assert.equal(root.outerHTML, initialHTML);
                listener.check();
            });
        });
        describe("cut", function () {
            function checkNodes(ret, nodes) {
                assert.equal(ret.length, nodes.length, "result length");
                for (var i = 0; i < nodes.length; ++i) {
                    assert.equal(ret[i].nodeType, nodes[i].nodeType);
                    assert.isTrue(ret[i].nodeType === Node.TEXT_NODE ||
                        ret[i].nodeType === Node.ELEMENT_NODE, "node type");
                    switch (ret[i].nodeType) {
                        case Node.TEXT_NODE:
                            assert.equal(ret[i].nodeValue, nodes[i].nodeValue, "text node at " + i);
                            break;
                        case Node.ELEMENT_NODE:
                            assert.equal(ret[i].outerHTML, nodes[i].outerHTML, "element node at " + i);
                            break;
                        default:
                            break;
                    }
                }
            }
            it("generates appropriate events when merging text", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var start = dloc_1.DLoc.mustMakeDLoc(root, p.firstChild, 4);
                var end = dloc_1.DLoc.mustMakeDLoc(root, p.childNodes[4], 3);
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.childNodes, domutil_1.indexOf(p.childNodes, start.node.nextSibling), domutil_1.indexOf(p.childNodes, end.node.previousSibling) + 1);
                var listener = new Listener(tu);
                nodes = nodes.reverse();
                var calls = nodes.concat([end.node]);
                var callsIx = 0;
                tu.events.pipe(filter_1.filter(filterBeforeDeleteNode)).subscribe(function (ev) {
                    var call = calls[callsIx];
                    assert.equal(ev.node, call, "beforeDeleteNode call " + callsIx);
                    assert.isNotNull(ev.node.parentNode);
                });
                listener.expected.BeforeDeleteNode = calls.length;
                tu.events.pipe(filter_1.filter(filterDeleteNode)).subscribe(function (ev) {
                    var call = calls[callsIx];
                    assert.equal(ev.node, call, "beforeDeleteNode call " + callsIx);
                    assert.isNull(ev.node.parentNode);
                    callsIx++;
                });
                listener.expected.DeleteNode = calls.length;
                var stnvCalls = [
                    [start.node, "befo"],
                    [end.node, "ter"],
                    [start.node, "befoter"],
                ];
                var stnvCallsIx = 0;
                tu.events.pipe(filter_1.filter(filterSetTextNodeValue)).subscribe(function (ev) {
                    var call = stnvCalls[stnvCallsIx];
                    assert.equal(ev.node, call[0], "setTextNodeValue node, call " + stnvCallsIx);
                    assert.equal(ev.value, call[1], "setTextNodeValue value, call " + stnvCallsIx);
                    stnvCallsIx++;
                });
                listener.expected.SetTextNodeValue = 3;
                tu.cut(start, end);
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 1);
                assert.equal(p.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
befoter</div>");
                listener.check();
            });
            it("returns proper nodes when merging a single node", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var start = dloc_1.DLoc.mustMakeDLoc(root, p.firstChild, 4);
                var end = dloc_1.DLoc.mustMakeDLoc(root, p.firstChild, 6);
                assert.equal(p.childNodes.length, 5);
                var nodes = [p.ownerDocument.createTextNode("re")];
                var ret = tu.cut(start, end);
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 5);
                assert.equal(p.firstChild.nodeValue, "befo ");
                assert.isTrue(ret.length > 0);
                checkNodes(ret[1], nodes);
                assert.equal(ret[0].node, p.firstChild);
                assert.equal(ret[0].offset, 4);
            });
            it("returns proper nodes when merging text", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var start = dloc_1.DLoc.mustMakeDLoc(root, p.firstChild, 4);
                var end = dloc_1.DLoc.mustMakeDLoc(root, p.childNodes[4], 3);
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.childNodes, domutil_1.indexOf(p.childNodes, start.node.nextSibling), domutil_1.indexOf(p.childNodes, end.node.previousSibling) + 1);
                new Listener(tu); // eslint-disable-line no-new
                nodes.unshift(p.ownerDocument.createTextNode("re "));
                nodes.push(p.ownerDocument.createTextNode(" af"));
                var ret = tu.cut(start, end);
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 1);
                assert.equal(p.outerHTML, "\
<div class=\"p _local_p _xmlns_http://www.tei-c.org/ns/1.0 _real\">\
befoter</div>");
                assert.isTrue(ret.length > 0);
                checkNodes(ret[1], nodes);
                assert.equal(ret[0].node, p.firstChild);
                assert.equal(ret[0].offset, 4);
            });
            it("empties an element without problem", function () {
                var p = root.querySelectorAll(".body>.p")[1];
                var start = dloc_1.DLoc.mustMakeDLoc(root, p, 0);
                var end = dloc_1.DLoc.mustMakeDLoc(root, p, p.childNodes.length);
                assert.equal(p.childNodes.length, 5);
                var nodes = Array.prototype.slice.call(p.childNodes);
                var ret = tu.cut(start, end);
                // Check that we're doing what we think we're doing.
                assert.equal(p.childNodes.length, 0);
                assert.isTrue(ret.length > 0);
                // Check the caret position.
                assert.equal(ret[0].node, p);
                assert.equal(ret[0].offset, 0);
                // Check that the nodes are those we expected.
                checkNodes(ret[1], nodes);
            });
        });
    });
});
//  LocalWords:  domroot concat DOM html previousSibling nextSibling
//  LocalWords:  prev abcd jQuery cd Dubeau MPL Mangalam RequireJS
//  LocalWords:  mergeTextNodes removeNodes unhandled removeNode chai
//  LocalWords:  insertIntoText deleteText setTextNodeValue onwards
//  LocalWords:  insertText deleteNode denormalize splitAt jquery
//  LocalWords:  insertNodeAt TreeUpdater
//# sourceMappingURL=tree-updater-test.js.map