/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var jsdomfw = require("./jsdomfw");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");
var fs = require("fs");

function defined(x) {
    assert.isDefined(x[0]);
    return x;
}

describe("TreeUpdater", function () {
    var window;
    var document;
    var fw;
    var $root;
    var dloc;
    var $;
    var TreeUpdater;
    var makeDLoc;

    before(function (done) {
        fw = new jsdomfw.FW();
        fw.create(function () {
            window = fw.window;
            document = window.document;
            window.require(["wed/dloc", "jquery", "wed/tree_updater"],
                           function (_dloc, _$, tree_updater) {
                try {
                    assert.isUndefined(window.document.errors);
                    dloc = _dloc;
                    $ = _$;
                    $root = defined($("#root"));
                    new dloc.DLocRoot($root[0]);
                    TreeUpdater = tree_updater.TreeUpdater;
                    makeDLoc = dloc.makeDLoc;
                    done();
                }
                catch (e) {
                    done(e);
                    throw e;
                }
            }, done);
        });
    });


    // This path must be relative to the top dir of wed.
    var source =
        "build/test-files/tree_updater_test_data/source_converted.xml";
    var tu;
    var data = fs.readFileSync(source).toString();

    beforeEach(function () {
        $root.empty();
        $root.html(data);
        tu = new TreeUpdater($root[0]);
    });

    afterEach(function () {
        $root.empty();
    });

    function Listener(tu) {
        this.expected = {
            insertNodeAt: 0,
            setTextNodeValue: 0,
            deleteNode: 0,
            setAttributeNS: 0
        };
        this._events = {};
        tu.addEventListener("*", function (name, ev) {
            if (this._events[name] === undefined)
                this._events[name] = 0;

            this._events[name]++;
        }.bind(this));
    }

    Listener.prototype.check = function () {
        var keys = Object.keys(this.expected);
        var i, k;
        for(i = 0, k; (k = keys[i]) !== undefined; ++i) {
            var actual = this._events[k];
            if (actual === undefined)
                actual = 0;
            assert.equal(actual, this.expected[k], "number of events " + k);
        }

        keys = Object.keys(this._events);
        for(i = 0, k; (k = keys[i]) !== undefined; ++i) {
            assert.isDefined(this.expected[k], "unaccounted event " + k);
        }
    };

    describe("insertNodeAt", function () {
        it("fails on fragments", function () {
            var top = $root.find(".p")[0];
            var node = document.createDocumentFragment();
            assert.Throw(
                tu.insertNodeAt.bind(tu, top, 0, node),
                window.Error,
                "document fragments cannot be passed to insertNodeAt");
        });
    });

    describe("splitAt", function () {
        it("fails on node which is not child of the top", function () {
            var top = $root.find(".p")[0];
            var node = $root.find(".title")[0];
            assert.Throw(
                tu.splitAt.bind(tu, top, node, 0),
                window.Error,
                "split location is not inside top");
        });

        it("fails if splitting would denormalize an element", function () {
            var node = $root.find(".title")[0];
            assert.Throw(
                tu.splitAt.bind(tu, node.firstChild, node.firstChild, 2),
                window.Error,
                "splitAt called in a way that would result in " +
                    "two adjacent text nodes");
        });

        it("splitting recursively, one level of depth generates "+
           "appropriate events", function () {
            var node = $root.find(".title")[0];
            var parent = node.parentNode;

            var listener = new Listener(tu);
            var calls = [
                // Insertion of a text node into <title>.
                [parent, 0, null],
                // Insertion of the completed 2nd half into the DOM tree.
                [parent, 1, null]
            ];
            var calls_ix = 0;
            tu.addEventListener("insertNodeAt", function (ev) {
                var call = calls[calls_ix++];
                assert.equal(ev.parent, call[0]);
                assert.equal(ev.index, call[1]);
                if (call[2] !== null)
                    assert.equal(ev.node.nodeValue, call[2]);
            });
            listener.expected.insertNodeAt = 2;

            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;

            tu.splitAt(node, node.firstChild, 2);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.firstChild.outerHTML,
                         '<div class="title _real">ab</div>', "first half");
            var next = node.nextSibling;
            assert.equal(parent.childNodes[1].outerHTML,
                             '<div class="title _real">cd</div>',
                             "second half");
            listener.check();
        });

        it("spliting recursively, at multiple levels does the right work",
           function () {
            var node = $root.find(".quote")[0].firstChild;
            var top = $root.find(".text")[0];
            var body = $(top).find(".body")[0];
            // Drop the nodes from 3 onwards so that future additions don't
            // change this test.
            while(body.childNodes[3])
                body.removeChild(body.childNodes[3]);
            var parent = top.parentNode;

            var pair = tu.splitAt(top, node, 3);

            var first_text = $(parent).children('.text')[0];
            var next_text = $(parent).children('.text')[1];
            // Check that we're doing what we think we're doing.
            assert.equal(
                first_text.outerHTML,
                ('<div class="text _real"><div class="body _real">' +
                 '<div class="p _real">blah</div><div class="p _real">' +
                 'before <div class="quote _real">quo</div></div></div>' +
                 '</div>'), "before");
            assert.equal(pair[0], first_text);
            assert.equal(pair[1], next_text);
            assert.equal(
                next_text.outerHTML,
                ('<div class="text _real"><div class="body _real">' +
                 '<div class="p _real"><div class="quote _real">ted</div>' +
                 ' between <div class="quote _real">quoted2</div>' +
                 ' after</div>'+
                 '<div class="p _real"><div class="quote _real">quoted</div>' +
                 '<div class="quote _real">quoted2</div>' +
                 '<div class="quote _real">quoted3</div></div>' +
                 '</div></div>'), "after");
        });

        it("does the right thing if spliting at end an element",
           function () {
            var top = $root.find(".body>.p")[0];
            var node = top.firstChild;
            // Make sure we're looking at the right stuff.
            assert.equal(node.nodeValue.length, 4);
            var pair = tu.splitAt(top, node, 4);
            assert.equal(pair[0].outerHTML, '<div class="p _real">blah</div>');
            assert.equal(pair[1].outerHTML, '<div class="p _real"></div>');
        });
    });

    describe("insertText", function () {
        it("generates appropriate events when it modifies a text node",
           function () {
            var node = $root.find(".title")[0].firstChild;
            var listener = new Listener(tu);
            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.value, "abQcd");
            });
            listener.expected.setTextNodeValue = 1;
            var pair = tu.insertText(node, 2, "Q");

            // Check that we're doing what we think we're doing.
            assert.equal(pair[0], node);
            assert.equal(pair[1], node);
            assert.equal(pair[0].nodeValue, "abQcd");
            listener.check();
        });

        it("generates appropriate events when it uses the next text node",
           function () {
            var node = $root.find(".title")[0];
            var listener = new Listener(tu);
            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node.firstChild);
                assert.equal(ev.value, "Qabcd");
            });
            listener.expected.setTextNodeValue = 1;

            var pair = tu.insertText(node, 0, "Q");

            // Check that we're doing what we think we're doing.
            assert.equal(pair[0], node.firstChild);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[0].nodeValue, "Qabcd");

            listener.check();
        });

        it("generates appropriate events when it uses the previous text " +
           "node",
           function () {
            var node = $root.find(".title")[0];

            var listener = new Listener(tu);
            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node.firstChild);
                assert.equal(ev.value, "abcdQ");
            });
            listener.expected.setTextNodeValue = 1;

            var pair = tu.insertText(node, 1, "Q");

            // Check that we're doing what we think we're doing.
            assert.equal(pair[0], node.firstChild);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[0].nodeValue, "abcdQ");

            listener.check();
        });

        it("generates appropriate events when it creates a text node",
           function () {
            var node = $root.find(".title")[0];
            $(node).empty();

            var listener = new Listener(tu);
            tu.addEventListener("insertNodeAt", function (ev) {
                assert.equal(ev.parent, node);
                assert.equal(ev.index, 0);
                assert.equal(ev.node.nodeValue, "test");
            });
            listener.expected.insertNodeAt = 1;

            var pair = tu.insertText(node, 0, "test");

            // Check that we're doing what we think we're doing.
            assert.isUndefined(pair[0]);
            assert.equal(pair[1], node.firstChild);
            assert.equal(pair[1].nodeValue, "test");

            listener.check();
        });

        it("does nothing if passed an empty string", function () {
            var node = $root.find(".title")[0];
            var listener = new Listener(tu);

            assert.equal(node.firstChild.nodeValue, "abcd");
            var pair = tu.insertText(node, 1, "");

            // Check that we're doing what we think we're doing.
            assert.equal(node.firstChild.nodeValue, "abcd");
            assert.isUndefined(pair[0]);
            assert.isUndefined(pair[1]);

            listener.check();
        });

    });

    describe("deleteText", function () {
        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(tu.deleteText.bind(tu, node, 0, "t"),
                         window.Error,
                         "deleteText called on non-text");
        });

        it("generates appropriate events when it modifies a text node",
           function () {
            var node = $root.find(".title")[0].firstChild;
            var listener = new Listener(tu);
            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.value, "ab");
            });
            listener.expected.setTextNodeValue = 1;

            tu.deleteText(node, 2, 2);

            // Check that we're doing what we think we're doing.
            assert.equal(node.nodeValue, "ab");
            listener.check();
        });

        it("generates appropriate events when it deletes an empty text " +
           "node", function () {
            var node = $root.find(".title")[0].firstChild;
            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });

            listener.expected.deleteNode = 1;

            tu.deleteText(node, 0, 4);
            // Check that we're doing what we think we're doing.
            assert.isNull(node.parentNode);
            listener.check();
        });

    });

    describe("setAttribute", function () {
        it("fails on non-element node", function () {
            var node = $root.find(".title")[0].firstChild;
            assert.Throw(tu.setAttribute.bind(tu, node, "q", "ab"),
                         window.Error,
                         "setAttribute called on non-element");
        });

        it("generates appropriate events when changing an attribute",
           function () {
            var node = $root.find(".title")[0];

            // Check that the attribute is not set yet.
            assert.equal($(node).attr("q"), undefined);

            var listener = new Listener(tu);
            tu.addEventListener("setAttributeNS", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.ns, "");
                assert.equal(ev.attribute, "q");
                assert.equal(ev.old_value, undefined);
                assert.equal(ev.new_value, "ab");
            });
            listener.expected.setAttributeNS = 1;

            tu.setAttribute(node, "q", "ab");

            // Check that we're doing what we think we're doing.
            assert.equal($(node).attr("q"), "ab");
            listener.check();
        });

        it("generates appropriate events when removing an attribute",
           function () {
            var node = $root.find(".title")[0];

            // Set the attribute
            $(node).attr("q", "ab");

            var listener = new Listener(tu);
            tu.addEventListener("setAttributeNS", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.ns, "");
                assert.equal(ev.attribute, "q");
                assert.equal(ev.old_value, "ab");
                assert.equal(ev.new_value, null);
            });
            listener.expected.setAttributeNS = 1;

            tu.setAttribute(node, "q", null);

            assert.equal($(node).attr("q"), undefined, "value after");
            listener.check();
        });
    });

    describe("insertIntoText", function () {
        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(tu.insertIntoText.bind(tu, node, 0, node),
                         window.Error,
                         "insertIntoText called on non-text");
        });

        it("fails on undefined node to insert", function () {
            var node = $root.find(".title")[0].firstChild;
            assert.Throw(tu.insertIntoText.bind(tu, node, 0, undefined),
                         window.Error,
                         "must pass an actual node to insert");
        });


        it("generates appropriate events when inserting a new element",
           function () {
            var parent = $root.find(".title")[0];
            var node = parent.firstChild;
            var $el = $("<span>");
            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;
            var ina_calls = [
                [parent, 0],
                [parent, 1],
                [parent, 2]
            ];
            var ina_call_ix = 0;
            tu.addEventListener("insertNodeAt", function (ev) {
                var call = ina_calls[ina_call_ix++];
                assert.equal(ev.parent, call[0]);
                assert.equal(ev.index, call[1]);
                // We don't check ev.node here.
            });
            listener.expected.insertNodeAt = 3;


            var pair = tu.insertIntoText(node, 2, $el[0]);

            // Check that we're doing what we think we're doing.
            assert.equal(pair[0].node.nodeValue, "ab");
            assert.equal(pair[0].node.nextSibling, $el[0]);
            assert.equal(pair[0].offset, 2);
            assert.equal(pair[1].node.nodeValue, "cd");
            assert.equal(pair[1].node.previousSibling, $el[0]);
            assert.equal(pair[1].offset, 0);
            assert.equal($root.find(".title")[0].childNodes.length, 3);
            assert.equal($root.find(".title")[0].childNodes[1], $el[0]);

            listener.check();
        });

        it("works fine with negative offset", function () {
            var node = $root.find(".title")[0].firstChild;
            var parent = node.parentNode;
            var $el = $("<span>");

            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;
            var ina_calls = [
                [parent, 0],
                [parent, 1]
            ];
            var ina_call_ix = 0;
            tu.addEventListener("insertNodeAt", function (ev) {
                var call = ina_calls[ina_call_ix++];
                assert.equal(ev.parent, call[0]);
                assert.equal(ev.index, call[1]);
                // We don't check ev.node here.
            });
            listener.expected.insertNodeAt = 2;

            var pair = tu.insertIntoText(node, -1, $el[0]);

            // Check that we're doing what we think we're doing.
            assert.equal(pair[0].node, parent);
            assert.equal(pair[0].offset, 0);
            assert.equal(pair[1].node.nodeValue, "abcd");
            assert.equal(pair[1].node.previousSibling, $el[0]);
            assert.equal($root.find(".title")[0].childNodes.length, 2);

            listener.check();
        });

        it("works fine with offset beyond text length",
           function () {
            var node = $root.find(".title")[0].firstChild;
            var parent = node.parentNode;
            var $el = $("<span>");

            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;
            var ina_calls = [
                [parent, 0],
                [parent, 1]
            ];
            var ina_call_ix = 0;
            tu.addEventListener("insertNodeAt", function (ev) {
                var call = ina_calls[ina_call_ix++];
                assert.equal(ev.parent, call[0]);
                assert.equal(ev.index, call[1]);
                // We don't check ev.node here.
            });
            listener.expected.insertNodeAt = 2;

            var pair = tu.insertIntoText(node, node.nodeValue.length,
                                         $el[0]);

                // Check that we're doing what we think we're doing.
            assert.equal(pair[0].node.nodeValue, "abcd");
            assert.equal(pair[0].node.nextSibling, $el[0]);
            assert.equal(pair[1].node, parent);
            assert.equal(pair[1].offset, 2);
            assert.equal($root.find(".title")[0].childNodes.length, 2);
            listener.check();

        });
    });

    describe("setTextNodeValue", function () {
        it("fails on non-text node", function () {
            var node = $root.find(".title")[0];
            assert.Throw(tu.setTextNode.bind(tu, node, "test"),
                         window.Error,
                         "setTextNode called on non-text");
        });

        it("generates appropriate events when setting text",
           function () {
            var node = $root.find(".title")[0].firstChild;
            var listener = new Listener(tu);
            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.value, node.nodeValue);
            });
            listener.expected.setTextNodeValue = 1;

            assert.equal(node.nodeValue, "abcd");
            tu.setTextNode(node, "test");

            // Check that we're doing what we think we're doing.
            assert.equal(node.nodeValue, "test");
            listener.check();
        });

        it("generates appropriate events when setting text to an empty string",
           function () {
            var node = $root.find(".title")[0].firstChild;
            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;

            assert.equal(node.nodeValue, "abcd");
            tu.setTextNode(node, "");

            // Check that we're doing what we think we're doing.
            assert.isNull(node.parentNode);
            listener.check();
        });
    });

    describe("removeNode", function () {
        it("generates appropriate events when removing a node",
           function () {
            var node = $root.find(".body>.p").eq(2).children(".quote")[1];
            var parent = node.parentNode;
            assert.equal(parent.childNodes.length, 3);
            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, node);
            });
            listener.expected.deleteNode = 1;

            tu.removeNode(node);

            // Check that we're doing what we think we're doing.
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real"><div class="quote _real">quoted'+
                 '</div><div class="quote _real">quoted3</div></div>'));

            assert.equal(parent.childNodes.length, 2);
            listener.check();
        });

        it("generates appropriate events when merging text", function () {
            var node = $root.find(".body>.p").eq(1).children(".quote")[0];
            var parent = node.parentNode;
            var prev = node.previousSibling;
            var next = node.nextSibling;
            assert.equal(parent.childNodes.length, 5);
            var listener = new Listener(tu);
            var first = true;
            tu.addEventListener("deleteNode", function (ev) {
                // Remove node will be emitted twice. Once to
                // remove the node itself, and second to merge the
                // text nodes.
                if (first)
                    assert.equal(ev.node, node);
                else
                    assert.equal(ev.node, next);
                first = false;
            });
            listener.expected.deleteNode = 2;

            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, prev);
                assert.equal(ev.value, "before  between ");
            });
            listener.expected.setTextNodeValue = 1;

            tu.removeNode(node);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 3);
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real">before  between ' +
                 '<div class="quote _real">quoted2</div> after</div>'));
            listener.check();
        });

        it("does not bork on missing previous text", function () {
            // An earlier bug would cause an unhandled exception on this
            // test.
            var node = $root.find(".body>.p").eq(2).children(".quote")[0];
            var parent = node.parentNode;
            var ret = tu.removeNode(node);
            assert.equal(ret.node, parent);
            assert.equal(ret.offset, 0);
        });
    });

    describe("removeNodes", function () {
        it("fails on nodes of different parents", function () {
            // An earlier bug would cause an unhandled exception on this
            // test.
            var node = $root.find(".body>.p").eq(2).children(".quote")[0];
            var parent = node.parentNode;
            assert.Throw(tu.removeNodes.bind(tu, [node, node.parentNode]),
                         window.Error,
                         "nodes are not immediately contiguous in " +
                         "document order");
        });

        it("generates appropriate events when merging text", function () {
            var p = $root.find(".body>.p")[1];
            var $p = $(p);
            var first_node = $p.children(".quote")[0];
            var last_node = $p.children(".quote").last()[0];
            var nodes = Array.prototype.slice.call(
                p.childNodes,
                Array.prototype.indexOf.call(p.childNodes, first_node),
                Array.prototype.indexOf.call(p.childNodes, last_node) + 1);
            var parent = first_node.parentNode;
            var prev = first_node.previousSibling;
            var next = last_node.nextSibling;
            assert.equal(parent.childNodes.length, 5);

            var listener = new Listener(tu);
            var calls = nodes.concat([next]);
            var calls_ix = 0;
            tu.addEventListener("deleteNode", function (ev) {
                var call = calls[calls_ix++];
                assert.equal(ev.node, call, "deleteNode call " + calls_ix);
            });
            listener.expected.deleteNode = 4;

            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, prev,
                             "setTextNodeValue node");
                assert.equal(ev.value, "before  after",
                             "setTextNodeValue value");
            });
            listener.expected.setTextNodeValue = 1;

            tu.removeNodes(nodes);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 1);
            assert.equal(
                    parent.outerHTML,
                ('<div class="p _real">before  after</div>'));
            listener.check();
        });

        it("does not bork on missing previous text", function () {
            // An earlier bug would cause an unhandled exception on this
            // test.
            var node = $root.find(".body>.p").eq(2).children(".quote")[0];
            var parent = node.parentNode;
            var ret = tu.removeNodes([node]);
            assert.equal(ret.node, parent);
            assert.equal(ret.offset, 0);
        });

    });

    describe("mergeTextNodes", function () {
        it("generates appropriate events when merging text", function () {
            var $p = $root.find(".body>.p").eq(1);
            // Remove the first quote so that we have two text
            // nodes adjacent.
            $p.children('.quote').first().remove();
            var node = $p[0].firstChild;
            var parent = node.parentNode;
            var next = node.nextSibling;
            assert.equal(parent.childNodes.length, 4);
            var listener = new Listener(tu);
            tu.addEventListener("deleteNode", function (ev) {
                assert.equal(ev.node, next);
            });
            listener.expected.deleteNode = 1;

            tu.addEventListener("setTextNodeValue", function (ev) {
                assert.equal(ev.node, node);
                assert.equal(ev.value, "before  between ");
            });
            listener.expected.setTextNodeValue = 1;

            tu.mergeTextNodes(node);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 3);
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real">before  between ' +
                 '<div class="quote _real">quoted2</div> after</div>'));
            listener.check();
        });

        it("does nothing if there is nothing to do", function () {
            var $p = $root.find(".body>.p").eq(1);
            var node = $p[0].firstChild;
            var parent = node.parentNode;
            var next = node.nextSibling;
            assert.equal(parent.childNodes.length, 5);

            var listener = new Listener(tu);
            tu.mergeTextNodes(node);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 5);
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real">before '+
                 '<div class="quote _real">quoted</div> between ' +
                 '<div class="quote _real">quoted2</div> after</div>'));
            listener.check();
        });

        it("returns a proper caret value when it merges", function () {
            var $p = $root.find(".body>.p").eq(1);
            // Remove the first quote so that we have two text
            // nodes adjacent.
            $p.children('.quote').first().remove();
            var node = $p[0].firstChild;
            var parent = node.parentNode;
            var next = node.nextSibling;
            assert.equal(parent.childNodes.length, 4);
            var ret = tu.mergeTextNodes(node);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 3);
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real">before  between ' +
                 '<div class="quote _real">quoted2</div> after</div>'));

            // Check return value.
            assert.equal(ret.node, node);
            assert.equal(ret.offset, 7);
        });

        it("returns a proper caret value when it does nothing",
           function () {
            var $p = $root.find(".body>.p").eq(1);
            var node = $p[0].firstChild;
            var parent = node.parentNode;
            var next = node.nextSibling;
            assert.equal(parent.childNodes.length, 5);

            var listener = new Listener(tu);
            var ret = tu.mergeTextNodes(node);

            // Check that we're doing what we think we're doing.
            assert.equal(parent.childNodes.length, 5);
            assert.equal(
                parent.outerHTML,
                ('<div class="p _real">before '+
                 '<div class="quote _real">quoted</div> between ' +
                 '<div class="quote _real">quoted2</div> after</div>'));
            listener.check();

            // Check the return value.
            assert.equal(ret.node, parent);
            assert.equal(ret.offset,
                         Array.prototype.indexOf.call(parent.childNodes,
                                                      node) + 1);
        });
    });

    describe("cut", function () {
        function checkNodes (ret, nodes) {
            assert.equal(ret.length, nodes.length, "result length");
            for(var i = 0; i < nodes.length; ++i) {
                assert.equal(ret[i].nodeType, nodes[i].nodeType);
                assert.isTrue(ret[i].nodeType === window.Node.TEXT_NODE ||
                              ret[i].nodeType === window.Node.ELEMENT_NODE,
                              "node type");
                switch(ret.nodeType) {
                case window.Node.TEXT_NODE:
                    assert(ret[i].nodeValue, nodes[i].nodeValue,
                           "text node at " + i);
                    break;
                case window.Node.ELEMENT_NODE:
                    assert(ret[i].outerHTML, nodes[i].outerHTML,
                           "element node at " + i);
                    break;
                }
            }
        }
        it("generates appropriate events when merging text", function () {
            var p = $root.find(".body>.p")[1];
            var start = makeDLoc($root[0], p.firstChild, 4);
            var end = makeDLoc($root[0], p.childNodes[4], 3);
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(
                p.childNodes,
                Array.prototype.indexOf.call(p.childNodes,
                                             start.node.nextSibling),
                Array.prototype.indexOf.call(p.childNodes,
                                             end.node.previousSibling) + 1);
            var listener = new Listener(tu);
            nodes = nodes.reverse();
            var calls = nodes.concat([end.node]);
            var calls_ix = 0;
            tu.addEventListener("deleteNode", function (ev) {
                var call = calls[calls_ix++];
                assert.equal(ev.node, call, "deleteNode call " + calls_ix);
            });
            listener.expected.deleteNode = calls.length;

            var stnv_calls = [
                [start.node, "befo"],
                [end.node, "ter"],
                [start.node, "befoter"]
            ];
            var stnv_calls_ix = 0;
            tu.addEventListener("setTextNodeValue", function (ev) {
                var call = stnv_calls[stnv_calls_ix];
                assert.equal(ev.node, call[0],
                             "setTextNodeValue node, call " + stnv_calls_ix);
                assert.equal(ev.value, call[1],
                             "setTextNodeValue value, call " + stnv_calls_ix);
                stnv_calls_ix++;
            });
            listener.expected.setTextNodeValue = 3;

            var ret = tu.cut(start, end);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 1);
            assert.equal(
                p.outerHTML,
                ('<div class="p _real">befoter</div>'));
            listener.check();
        });

        it("returns proper nodes when merging a single node", function () {
            var p = $root.find(".body>.p")[1];
            var start = makeDLoc($root[0], p.firstChild, 4);
            var end = makeDLoc($root[0], p.firstChild, 6);
            assert.equal(p.childNodes.length, 5);

            var nodes = [p.ownerDocument.createTextNode("re")];
            var ret = tu.cut(start, end);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 5);
            assert.equal(p.firstChild.nodeValue, 'befo ');

            assert.isTrue(ret.length > 0);
            checkNodes(ret[1], nodes);
            assert.equal(ret[0].node, p.firstChild);
            assert.equal(ret[0].offset, 4);
        });

        it("returns proper nodes when merging text", function () {
            var p = $root.find(".body>.p")[1];
            var start = makeDLoc($root[0], p.firstChild, 4);
            var end = makeDLoc($root[0], p.childNodes[4], 3);
            assert.equal(p.childNodes.length, 5);

            var nodes = Array.prototype.slice.call(
                p.childNodes,
                Array.prototype.indexOf.call(p.childNodes,
                                             start.node.nextSibling),
                Array.prototype.indexOf.call(p.childNodes,
                                             end.node.previousSibling) + 1);
            var listener = new Listener(tu);
            nodes.unshift(p.ownerDocument.createTextNode("re "));
            nodes.push(p.ownerDocument.createTextNode(" af"));

            var ret = tu.cut(start, end);

            // Check that we're doing what we think we're doing.
            assert.equal(p.childNodes.length, 1);
            assert.equal(
                p.outerHTML,
                ('<div class="p _real">befoter</div>'));

            assert.isTrue(ret.length > 0);
            checkNodes(ret[1], nodes);
            assert.equal(ret[0].node, p.firstChild);
            assert.equal(ret[0].offset, 4);
        });

        it("empties an element without problem", function () {
            var p = $root.find(".body>.p")[1];
            var start = makeDLoc($root[0], p, 0);
            var end = makeDLoc($root[0], p, p.childNodes.length);
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

//  LocalWords:  domroot concat DOM html previousSibling nextSibling
//  LocalWords:  prev abcd jQuery cd Dubeau MPL Mangalam RequireJS
//  LocalWords:  mergeTextNodes removeNodes unhandled removeNode chai
//  LocalWords:  insertIntoText deleteText setTextNodeValue onwards
//  LocalWords:  insertText deleteNode denormalize splitAt jquery
//  LocalWords:  insertNodeAt TreeUpdater
