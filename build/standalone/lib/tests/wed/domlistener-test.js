define(["require", "exports", "module", "jquery", "wed/dloc", "wed/domlistener", "wed/domutil", "wed/tree-updater"], function (require, exports, module, $, dloc, domlistener_1, domutil_1, tree_updater_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    // tslint:disable-next-line:completed-docs
    var Mark = /** @class */ (function () {
        function Mark(totalExpected, countsExpected, listener, done) {
            this.totalExpected = totalExpected;
            this.countsExpected = countsExpected;
            this.listener = listener;
            this.done = done;
            this.count = 0;
            this.counts = Object.create(null);
        }
        Mark.prototype.check = function () {
            // We iterate so that we can get a precise error message.
            for (var _i = 0, _a = Object.keys(this.countsExpected); _i < _a.length; _i++) {
                var k = _a[_i];
                assert.equal(this.counts[k], this.countsExpected[k], "count for " + k);
            }
            for (var _b = 0, _c = Object.keys(this.counts); _b < _c.length; _b++) {
                var k = _c[_b];
                assert.equal(this.counts[k], this.countsExpected[k]);
            }
            assert.equal(this.count, this.totalExpected, "total mark count");
            this.done();
        };
        Mark.prototype.mark = function (label) {
            if (this.counts[label] === undefined) {
                this.counts[label] = 0;
            }
            this.counts[label]++;
            this.count++;
        };
        return Mark;
    }());
    describe("domlistener", function () {
        var domroot;
        var root;
        var $root;
        var fragmentToAdd;
        var listener;
        var treeUpdater;
        var mark;
        var marker;
        before(function () {
            // This is a fake element we add to the root to know when we've seen
            // everything we care about.
            marker = document.createElement("div");
            marker.className = "_real _marker";
            domroot = document.createElement("div");
            document.body.appendChild(domroot);
        });
        after(function () {
            document.body.removeChild(domroot);
        });
        beforeEach(function () {
            // Create a new fragment each time.
            // tslint:disable-next-line:no-jquery-raw-elements
            fragmentToAdd = $("<div class='_real ul'><div class='_real li'>A</div>\
<div class='_real li'>B</div></div>")[0];
            // tslint:disable-next-line:no-inner-html
            domroot.innerHTML = "";
            root = document.createElement("div");
            domroot.appendChild(root);
            new dloc.DLocRoot(root);
            $root = $(root);
            treeUpdater = new tree_updater_1.TreeUpdater(root);
            listener = new domlistener_1.Listener(root, treeUpdater);
        });
        afterEach(function () {
            listener.stopListening();
        });
        function makeIncludedHandler(name) {
            return (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real " + name);
                mark.mark("included " + name);
            });
        }
        function makeExcludedHandler(name) {
            return (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real " + name);
                mark.mark("excluded " + name);
            });
        }
        function makeExcludingHandler(name) {
            return (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real " + name);
                mark.mark("excluding " + name);
            });
        }
        it("fires included-element, added-element and children-changed when " +
            "adding a fragment", function (done) {
            mark = new Mark(5, {
                "included ul": 1,
                "added ul": 1,
                "children root": 1,
                "included li": 2,
            }, listener, done);
            listener.addHandler("included-element", "._real.ul", makeIncludedHandler("ul"));
            listener.addHandler("included-element", "._real.li", makeIncludedHandler("li"));
            listener.addHandler("added-element", "._real.ul", (function (thisRoot, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(thisRoot, parent);
                assert.equal(element, fragmentToAdd);
                mark.mark("added ul");
            }));
            listener.addHandler("children-changed", "*", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(thisRoot, element);
                assert.equal(removed.length, 0);
                assert.equal(added.length, 1);
                assert.equal(added[0], fragmentToAdd);
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                mark.mark("children root");
            }));
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
            mark.check();
        });
        it("generates added-element with the right previous and next siblings", function (done) {
            mark = new Mark(2, { "added li": 2 }, listener, done);
            listener.addHandler("added-element", "._real.li", (function (thisRoot, parent_, previousSibling, nextSibling, element) {
                assert.equal(previousSibling, element.previousSibling);
                assert.equal(nextSibling, element.nextSibling);
                mark.mark("added li");
            }));
            root.appendChild(fragmentToAdd);
            var $li = $root.find("._real.li");
            $li.remove();
            listener.startListening();
            var parent = root.querySelector(".ul");
            $li.each(function each() {
                // tslint:disable-next-line:no-invalid-this
                treeUpdater.insertNodeAt(parent, parent.childNodes.length, this);
            });
            mark.check();
        });
        it("generates removing-element and removed-element with " +
            "the right previous and next siblings", function (done) {
            mark = new Mark(4, {
                "removing li": 2,
                "removed li": 2,
            }, listener, done);
            root.appendChild(fragmentToAdd);
            var $li = $root.find("._real.li");
            listener.addHandler("removing-element", "._real.li", (function (thisRoot, parent, previousSibling, nextSibling, element) {
                var text = element.firstChild.nodeValue;
                if (text === "A") {
                    assert.isNull(previousSibling, "previous sibling of A");
                    assert.equal(nextSibling, $li[1], "next sibling of A");
                }
                else {
                    // By the time we get here, B is alone.
                    assert.isNull(previousSibling, "previous sibling of B");
                }
                mark.mark("removing li");
            }));
            var ul = root.querySelector("._real.ul");
            listener.addHandler("removed-element", "._real.li", (function (thisRoot, parent, previousSibling, nextSibling) {
                assert.isNull(previousSibling, "previous sibling of A");
                assert.isNull(nextSibling, "next sibling of B");
                assert.equal(parent, ul);
                mark.mark("removed li");
            }));
            listener.startListening();
            $li.each(function each() {
                // tslint:disable-next-line:no-invalid-this
                treeUpdater.deleteNode(this);
            });
            mark.check();
        });
        it("fires excluding-element, excluded-element, removing-element, " +
            "removed-element, children-changing and children-changed when " +
            "removing a fragment", function (done) {
            root.appendChild(fragmentToAdd);
            mark = new Mark(10, {
                "excluding ul": 1,
                "excluded ul": 1,
                "removing ul": 1,
                "removed ul": 1,
                "children-changing root": 1,
                "children-changed root": 1,
                "excluding li": 2,
                "excluded li": 2,
            }, listener, done);
            listener.addHandler("excluding-element", "._real.ul", makeExcludingHandler("ul"));
            listener.addHandler("excluded-element", "._real.ul", makeExcludedHandler("ul"));
            listener.addHandler("excluding-element", "._real.li", makeExcludingHandler("li"));
            listener.addHandler("excluded-element", "._real.li", makeExcludedHandler("li"));
            listener.addHandler("removing-element", "._real.ul", (function (thisRoot, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(thisRoot, parent);
                assert.equal(element, fragmentToAdd);
                mark.mark("removing ul");
            }));
            listener.addHandler("removed-element", "._real.ul", (function (thisRoot, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(thisRoot, parent);
                assert.equal(element, fragmentToAdd);
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                mark.mark("removed ul");
            }));
            listener.addHandler("children-changing", "*", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(thisRoot, element);
                assert.equal(added.length, 0);
                assert.equal(removed.length, 1);
                assert.equal(removed[0], fragmentToAdd);
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                mark.mark("children-changing root");
            }));
            listener.addHandler("children-changed", "*", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(thisRoot, element);
                assert.equal(added.length, 0);
                assert.equal(removed.length, 1);
                assert.equal(removed[0], fragmentToAdd);
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                mark.mark("children-changed root");
            }));
            listener.startListening();
            treeUpdater.deleteNode(fragmentToAdd);
            mark.check();
        });
        it("trigger triggered twice, invoked once", function (done) {
            mark = new Mark(3, { "triggered test": 1, "included li": 2 }, listener, done);
            listener.addHandler("trigger", "test", function (thisRoot) {
                assert.equal(thisRoot, root);
                mark.mark("triggered test");
            });
            listener.addHandler("included-element", "._real.li", (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real li");
                listener.trigger("test");
                mark.mark("included li");
            }));
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
            // We have to allow for triggers to run.
            window.setTimeout(function () {
                mark.check();
            }, 0);
        });
        it("trigger triggering a trigger", function (done) {
            mark = new Mark(4, {
                "triggered test": 1,
                "triggered test2": 1,
                "included li": 2,
            }, listener, done);
            listener.addHandler("trigger", "test", function (thisRoot) {
                assert.equal(thisRoot, root);
                listener.trigger("test2");
                mark.mark("triggered test");
            });
            listener.addHandler("trigger", "test2", function (thisRoot) {
                assert.equal(thisRoot, root);
                mark.mark("triggered test2");
            });
            listener.addHandler("included-element", "._real.li", (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real li");
                listener.trigger("test");
                mark.mark("included li");
            }));
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
            // We have to allow for triggers to run.
            window.setTimeout(function () {
                mark.check();
            }, 0);
        });
        it("fires text-changed when changing a text node", function (done) {
            mark = new Mark(1, { "text-changed": 1 }, listener, done);
            listener.addHandler("text-changed", "._real.li", (function (thisRoot, element, oldValue) {
                assert.equal(thisRoot, root);
                assert.equal(element.parentNode.className, "_real li");
                assert.equal(element.nodeValue, "Q");
                assert.equal(oldValue, "A");
                mark.mark("text-changed");
            }));
            root.appendChild(fragmentToAdd);
            listener.startListening();
            treeUpdater
                .setTextNodeValue(root.querySelector("._real.li").firstChild, "Q");
            mark.check();
        });
        it("fires children-changed when adding a text node", function (done) {
            // The handler is called twice. Once when the single text node which was
            // already there is removed. Once when the new text node is added.
            mark = new Mark(2, { "children li": 2 }, listener, done);
            var li;
            var changeNo = 0;
            listener.addHandler("children-changed", "._real.li", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(thisRoot, root);
                assert.equal(element, li);
                assert.equal(added.length, changeNo === 0 ? 0 : 1, "added elements");
                assert.equal(removed.length, changeNo === 0 ? 1 : 0, "removed elements");
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                if (changeNo === 0) {
                    assert.equal(removed[0].nodeValue, "A");
                }
                else {
                    assert.equal(added[0].nodeValue, "Q");
                }
                changeNo++;
                mark.mark("children li");
            }));
            root.appendChild(fragmentToAdd);
            listener.startListening();
            li = root.querySelector("._real.li");
            // We'll simulate what jQuery does: remove the text node and add a new one.
            treeUpdater.deleteNode(li.firstChild);
            treeUpdater.insertText(li, 0, "Q");
            mark.check();
        });
        it("fires attribute-changed when changing an attribute", function (done) {
            mark = new Mark(1, { "attribute-changed": 1 }, listener, done);
            listener.addHandler("attribute-changed", "._real.li", (function (thisRoot, element, ns, name, oldValue) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real li");
                // tslint:disable-next-line:no-http-string
                assert.equal(ns, "http://foo.foo/foo");
                assert.equal(name, "X");
                assert.equal(oldValue, null);
                mark.mark("attribute-changed");
            }));
            root.appendChild(fragmentToAdd);
            listener.startListening();
            treeUpdater.setAttributeNS(
            // tslint:disable-next-line:no-http-string
            root.querySelector("._real.li"), "http://foo.foo/foo", "X", "ttt");
            mark.check();
        });
        it("fires attribute-changed when deleting an attribute", function (done) {
            mark = new Mark(1, { "attribute-changed": 1 }, listener, done);
            listener.addHandler("attribute-changed", "._real.li", (function (thisRoot, element, ns, name, oldValue) {
                assert.equal(thisRoot, root);
                assert.equal(element.className, "_real li");
                // tslint:disable-next-line:no-http-string
                assert.equal(ns, "http://foo.foo/foo");
                assert.equal(name, "X");
                assert.equal(oldValue, "ttt");
                mark.mark("attribute-changed");
            }));
            root.appendChild(fragmentToAdd);
            var li = root.querySelector("._real.li");
            // tslint:disable-next-line:no-http-string
            li.setAttributeNS("http://foo.foo/foo", "X", "ttt");
            listener.startListening();
            // tslint:disable-next-line:no-http-string
            treeUpdater.setAttributeNS(li, "http://foo.foo/foo", "X", null);
            mark.check();
        });
        it("generates children-changed with the right previous and " +
            "next siblings when adding", function (done) {
            mark = new Mark(1, { "children ul": 1 }, listener, done);
            root.appendChild(fragmentToAdd);
            var li = root.querySelectorAll("._real.li");
            listener.addHandler("children-changed", "._real.ul", (function (thisRoot, added, removed, previousSibling, nextSibling) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(previousSibling, li[0]);
                assert.equal(nextSibling, li[1]);
                mark.mark("children ul");
            }));
            listener.startListening();
            var $new = $("<li>Q</li>");
            treeUpdater
                .insertNodeAt(li[0].parentNode, domutil_1.indexOf(li[0].parentNode.childNodes, li[0]) + 1, $new[0]);
            mark.check();
        });
        it("generates children-changing and children-changed with " +
            "the right previous and next siblings when removing", function (done) {
            fragmentToAdd = $("<div class='_real ul'><div class='_real li'>A</div><div class='_real li'>B</div><div class='_real li'>C</div></div>")[0];
            mark = new Mark(2, {
                "children-changed ul": 1,
                "children-changing ul": 1,
            }, listener, done);
            root.appendChild(fragmentToAdd);
            var $li = $root.find("._real.li");
            var parent = $li[0].parentNode;
            listener.addHandler("children-changing", "._real.ul", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.equal(previousSibling, $li[0]);
                assert.equal(nextSibling, $li[2]);
                assert.equal(element, parent);
                mark.mark("children-changing ul");
            }));
            listener.addHandler("children-changed", "._real.ul", (function (thisRoot, added, removed, previousSibling, nextSibling, element) {
                // The marker will also trigger this handler. Ignore it.
                if (added[0] === marker) {
                    return;
                }
                assert.isNull(previousSibling);
                assert.isNull(nextSibling);
                assert.equal(element, parent);
                mark.mark("children-changed ul");
            }));
            listener.startListening();
            treeUpdater.deleteNode($li[1]);
            mark.check();
        });
        it("generates included-element with the right tree, previous, next siblings", function (done) {
            mark = new Mark(8, {
                "included li at root": 2,
                "included li at ul": 2,
                "excluding li at ul": 2,
                "excluding li at root": 2,
            }, listener, done);
            var $fragment = $("<div><p>before</p><div class='_real ul'><div class='_real li'>A</div><div class='_real li'>B</div></div><p>after</p></div>");
            function addHandler(incex) {
                listener.addHandler(incex + "-element", "._real.li", (function (thisRoot, tree, parent, previousSibling, nextSibling, element) {
                    assert.equal(thisRoot, root, "root");
                    assert.equal(element.className, "_real li", "element class");
                    // The following tests are against $fragment rather than $root
                    // or $thisRoot because by the time the handler is called, the
                    // $root could be empty!
                    if (tree === $fragment[0]) {
                        mark.mark(incex + " li at root");
                        assert.equal(parent, root, "parent value");
                        assert.isNull(previousSibling, "previous sibling");
                        assert.isNull(nextSibling, "next sibling");
                    }
                    else {
                        assert.equal(tree, $fragment.find(".ul")[0], "tree value");
                        assert.equal(parent, $fragment[0]);
                        assert.equal(previousSibling, $fragment.find("p")[0]);
                        assert.equal(nextSibling, $fragment.find("p")[1]);
                        mark.mark(incex + " li at ul");
                    }
                }));
            }
            addHandler("included");
            addHandler("excluding");
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, $fragment[0]);
            var $ul = $root.find(".ul");
            treeUpdater.deleteNode($ul[0]);
            var p = $root.find("p")[0];
            var pParent = p.parentNode;
            treeUpdater.insertNodeAt(pParent, domutil_1.indexOf(pParent.childNodes, p) + 1, $ul[0]);
            $root.contents().each(function each() {
                // tslint:disable-next-line:no-invalid-this
                treeUpdater.deleteNode(this);
            });
            mark.check();
        });
        it("processImmediately processes immediately", function () {
            var marked = false;
            mark = new Mark(2, { "children root": 1, trigger: 1 }, listener, function () {
                marked = true;
            });
            listener.addHandler("children-changed", "*", (function (thisRoot, added) {
                if (added[0] === marker) {
                    return;
                }
                listener.trigger("t");
                mark.mark("children root");
            }));
            listener.addHandler("trigger", "t", function () {
                mark.mark("trigger");
            });
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
            listener.processImmediately();
            mark.check();
            assert.isTrue(marked);
        });
        it("clearPending clears pending operations", function () {
            var marked = false;
            mark = new Mark(1, { "children root": 1 }, listener, function () {
                marked = true;
            });
            listener.addHandler("children-changed", "*", (function (thisRoot, added) {
                if (added[0] === marker) {
                    return;
                }
                listener.trigger("t");
                mark.mark("children root");
            }));
            listener.addHandler("trigger", "t", function () {
                mark.mark("trigger");
            });
            listener.startListening();
            treeUpdater.insertNodeAt(root, root.childNodes.length, fragmentToAdd);
            listener.clearPending();
            mark.check();
            assert.isTrue(marked);
        });
    });
});
//  LocalWords:  domlistener Dubeau MPL Mangalam jsdom TreeUpdater
//  LocalWords:  MutationObserver

//# sourceMappingURL=domlistener-test.js.map
