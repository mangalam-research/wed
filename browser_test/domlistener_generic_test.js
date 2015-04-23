/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

//
// Cannot be moved to jsdom because mutation_domlistener needs a
// MutationObserver and jsdom does not support it yet.
//
define(function (require) {
'use strict';
require("mocha/mocha");
var chai = require("chai");
var $ = require("jquery");

// This is not as generic as it could be but this will do for now.
return function (domlistener, class_name, tree_updater_class) {
    //
    // (The method processImmediately did not exist when this test
    // suite was first created. At any rate testing the asynchronous
    // execution of the functions is a good deal.)
    //
    // Listener is based on MutationObserver, which operates
    // asynchronously. This complicates things a bit. However,
    // Listener works in such a way that all events triggered by a
    // given mutation are processed together before the events
    // triggered by the next mutation are processed, etc. Consequently,
    // we can mark the stream of events by making a change that uses a
    // marking element. When the handler for this marking element is
    // called, we can be sure that the Listener has called all the
    // handlers it meant to call for the previous mutations. By this
    // point, if a handler we expected to be called was not called, it
    // will never be called.
    //


    // This is a fake element we add to the root to know when
    // we've seen everything we care about.
    var $marker = $("<div class='_real _marker'>");

    function Mark(total_expected, counts, listener, $root, done) {
        this._count = 0;
        this._counts_expected = counts;
        this._counts = Object.create(null);
        this._total_expected = total_expected;
        this._$root = $root;
        this._listener = listener;
        this._done = done;
    }

    Mark.prototype.check = function () {
        Object.keys(this._counts_expected).forEach(function (k) {
            assert.equal(this._counts[k],
                         this._counts_expected[k], "count for " + k);
        }.bind(this));
        Object.keys(this._counts).forEach(function (k) {
            assert.equal(this._counts[k], this._counts_expected[k]);
        }.bind(this));

        assert.equal(this._count, this._total_expected, "total mark count");
        this._done();
    };

    Mark.prototype.mark = function (label) {
        if (this._counts[label] === undefined)
            this._counts[label] = 0;

        this._counts[label]++;

        this._count++;
    };

    var assert = chai.assert;
    var Listener = domlistener.Listener;
    describe(class_name, function () {
        var $root = $(window.parent.document.getElementById("domroot"));
        var $fragment_to_add;
        var listener;
        var tree_updater;
        var mark;
        beforeEach(function () {
            // Create a new fragment each time.
            $fragment_to_add =
                $("<div class='_real ul'>"+
                  "<div class='_real li'>A</div>"+
                  "<div class='_real li'>B</div></div>");
            $root.empty();
            if (tree_updater_class) {
                tree_updater = new tree_updater_class($root[0]);
                listener = new Listener($root[0], tree_updater);
            }
            else
                throw new Error(
                    "if you want these tests to work without a " +
                        "tree updater, you need to change the test " +
                        "file.")
        });
        afterEach(function () {
            listener.stopListening();
        });

        function makeIncludedHandler(name) {
            return function (this_root, tree, parent, previous_sibling,
                             next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real " + name);
                mark.mark("included " + name);
            };
        }

        function makeExcludedHandler(name) {
            return function (this_root, tree, parent, previous_sibling,
                             next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real " + name);
                mark.mark("excluded " + name);
            };
        }

        function makeExcludingHandler(name) {
            return function (this_root, tree, parent, previous_sibling,
                             next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real " + name);
                mark.mark("excluding " + name);
            };
        }


        it("fires included-element, added-element and " +
           "children-changed when adding a fragment",
           function (done) {
            mark = new Mark(5,
                            {"included ul": 1,
                             "added ul": 1,
                             "children root": 1,
                             "included li": 2},
                            listener, $root, done);
            listener.addHandler("included-element", "._real.ul",
                                makeIncludedHandler("ul"));
            listener.addHandler("included-element", "._real.li",
                                makeIncludedHandler("li"));
            function addedHandler(this_root, parent,
                                  previous_sibling,
                                  next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(this_root, parent);
                assert.equal(element, $fragment_to_add[0]);
                mark.mark("added ul");
            }
            listener.addHandler("added-element", "._real.ul",
                                addedHandler);
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(this_root, element);
                assert.equal(removed.length, 0);
                assert.equal(added.length, 1);
                assert.equal(added[0], $fragment_to_add[0]);
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                mark.mark("children root");
            }
            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.startListening($root);
            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment_to_add[0]);
            mark.check();
        });

        it("generates added-element with the right previous and " +
           "next siblings",
           function (done) {
            mark = new Mark(2, {"added li": 2},
                            listener, $root, done);
            function addedHandler(this_root, parent,
                                  previous_sibling,
                                  next_sibling, element) {
                assert.equal(previous_sibling, element.previousSibling);
                assert.equal(next_sibling, element.nextSibling);
                mark.mark("added li");
            }
            listener.addHandler("added-element", "._real.li",
                                addedHandler);
            $root.append($fragment_to_add);
            var $li = $root.find("._real.li");
            $li.remove();
            listener.startListening($root);
            var parent = $root.find(".ul")[0];
            $li.each(function () {
                tree_updater.insertNodeAt(parent,
                                          parent.childNodes.length,
                                          this);
            });
            mark.check();
        });

        it("generates removing-element and removed-element with " +
           "the right previous and next siblings",
           function (done) {
            mark = new Mark(4,
                            {
                                "removing li": 2,
                                "removed li": 2
                            },
                            listener, $root, done);
            function removingHandler(this_root, parent,
                                    previous_sibling,
                                    next_sibling, element) {
                var text = element.firstChild.nodeValue;
                if (text === "A") {
                    assert.isNull(previous_sibling, "previous sibling of A");
                    assert.equal(next_sibling, $li[1],
                                 "next sibling of A");
                }
                else {
                    // By the time we get here, B is alone.
                    assert.isNull(previous_sibling,
                                  "previous sibling of B");
                }
                mark.mark("removing li");
            }


            listener.addHandler("removing-element", "._real.li",
                                removingHandler);

            function removedHandler(this_root, parent,
                                    previous_sibling,
                                    next_sibling, element) {
                var text = element.firstChild.nodeValue;
                assert.isNull(previous_sibling,
                              "previous sibling of A");
                assert.isNull(next_sibling,
                              "next sibling of B");
                assert.equal(parent, $ul[0]);
                mark.mark("removed li");
            }
            listener.addHandler("removed-element", "._real.li",
                                removedHandler);

            $root.append($fragment_to_add);
            listener.startListening($root);
            var $li = $root.find("._real.li");
            var $ul = $root.find("._real.ul");
            $li.each(function () {
                tree_updater.deleteNode(this);
            });
            mark.check();
        });

        it("fires excluding-element, excluded-element, " +
           "removing-element, removed-element, children-changing " +
           "and children-changed when removing a fragment",
           function (done) {
            $root.append($fragment_to_add);
            mark = new Mark(10,
                            {"excluding ul": 1,
                             "excluded ul": 1,
                             "removing ul": 1,
                             "removed ul": 1,
                             "children-changing root": 1,
                             "children-changed root": 1,
                             "excluding li": 2,
                             "excluded li": 2},
                            listener, $root, done);
            listener.addHandler("excluding-element", "._real.ul",
                                makeExcludingHandler("ul"));
            listener.addHandler("excluded-element", "._real.ul",
                                makeExcludedHandler("ul"));
            listener.addHandler("excluding-element", "._real.li",
                                makeExcludingHandler("li"));
            listener.addHandler("excluded-element", "._real.li",
                                makeExcludedHandler("li"));

            function removingHandler(this_root, parent,
                                    previous_sibling,
                                    next_sibling,
                                    element) {
                assert.equal(this_root, $root[0]);
                assert.equal(this_root, parent);
                assert.equal(element, $fragment_to_add[0]);
                mark.mark("removing ul");
            }
            listener.addHandler("removing-element", "._real.ul",
                                removingHandler);
            function removedHandler(this_root, parent,
                                    previous_sibling,
                                    next_sibling,
                                    element) {
                assert.equal(this_root, $root[0]);
                assert.equal(this_root, parent);
                assert.equal(element, $fragment_to_add[0]);
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                mark.mark("removed ul");
            }
            listener.addHandler("removed-element", "._real.ul",
                                removedHandler);

            function changingHandler(this_root, added,
                                    removed, previous_sibling,
                                    next_sibling, element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(this_root, element);
                assert.equal(added.length, 0);
                assert.equal(removed.length, 1);
                assert.equal(removed[0], $fragment_to_add[0]);
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                mark.mark("children-changing root");
            }
            listener.addHandler("children-changing", "*",
                                changingHandler);

            function changedHandler(this_root, added,
                                    removed, previous_sibling,
                                    next_sibling, element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(this_root, element);
                assert.equal(added.length, 0);
                assert.equal(removed.length, 1);
                assert.equal(removed[0], $fragment_to_add[0]);
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                mark.mark("children-changed root");
            }
            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.startListening($root);
            tree_updater.deleteNode($fragment_to_add[0]);
            mark.check();
        });

        it("trigger triggered twice, invoked once", function (done) {
            var mark = new Mark(3,
                                {"triggered test": 1,
                                 "included li": 2},
                                listener, $root, done);
            listener.addHandler(
                "trigger",
                "test",
                function (this_root) {
                assert.equal(this_root, $root[0]);
                mark.mark("triggered test");
            });
            listener.addHandler(
                "included-element",
                "._real.li",
                function (this_root, tree, parent, previous_sibling,
                          next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real li");
                listener.trigger("test");
                mark.mark("included li");
            });
            listener.startListening($root);
            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment_to_add[0]);
            // We have to allow for triggers to run.
            window.setTimeout(function () {
                mark.check();
            }, 0);
        });

        it("trigger triggering a trigger", function (done) {
            var mark = new Mark(4,
                                {"triggered test": 1,
                                 "triggered test2": 1,
                                 "included li": 2},
                                listener, $root, done);
            listener.addHandler(
                "trigger",
                "test",
                function (this_root) {
                assert.equal(this_root, $root[0]);
                listener.trigger("test2");
                mark.mark("triggered test");
            });
            listener.addHandler(
                "trigger",
                "test2",
                function (this_root) {
                assert.equal(this_root, $root[0]);
                mark.mark("triggered test2");
            });

            listener.addHandler(
                "included-element",
                "._real.li",
                function (this_root, tree, parent, previous_sibling,
                          next_sibling, element) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real li");
                listener.trigger("test");
                mark.mark("included li");
            });
            listener.startListening($root);
            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment_to_add[0]);
            // We have to allow for triggers to run.
            window.setTimeout(function () {
                mark.check();
            }, 0);
        });

        it("fires text-changed when changing a text node",
           function (done) {
            mark = new Mark(1, {"text-changed": 1},
                            listener, $root, done);
            function textChanged(this_root, element, old_value) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.parentNode.className, "_real li");
                assert.equal(element.nodeValue, "Q");
                assert.equal(old_value, "A");
                mark.mark("text-changed");
            }
            listener.addHandler("text-changed", "._real.li",
                                textChanged);
            $root.append($fragment_to_add);
            listener.startListening($root);
            tree_updater.setTextNodeValue(
                $root.find("._real.li")[0].firstChild, "Q");
            mark.check();
        });

        it("fires children-changed when adding a text node",
           function (done) {
            // The handler is called twice. Once when the single
            // text node which was already there is removed. Once
            // when the new text node is added.

            mark = new Mark(2, {"children li": 2},
                            listener, $root, done);
            var $li;
            var change_no = 0;
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(this_root, $root[0]);
                assert.equal(element, $li[0]);
                assert.equal(added.length, change_no === 0 ? 0 : 1,
                             "added elements");
                assert.equal(removed.length, change_no === 0 ? 1 : 0,
                             "removed elements");
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                if (change_no === 0)
                    assert.equal(removed[0].nodeValue, "A");
                else
                    assert.equal(added[0].nodeValue, "Q");
                change_no++;
                mark.mark("children li");
            }
            listener.addHandler("children-changed", "._real.li",
                                changedHandler);
            $root.append($fragment_to_add);
            listener.startListening($root);
            $li = $root.find("._real.li").first();
            // We'll simulate what jQuery does:
            // remove the text node and add a new one.
            tree_updater.deleteNode($li[0].firstChild);
            tree_updater.insertText($li[0], 0, "Q");
            mark.check();
        });

        it("fires attribute-changed when changing an attribute",
           function (done) {
            mark = new Mark(1, {"attribute-changed": 1},
                            listener, $root, done);
            function attributeChanged(this_root, element, ns, name,
                                      old_value) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real li");
                assert.equal(ns, "http://foo.foo/foo");
                assert.equal(name, "X");
                assert.equal(old_value, null);
                mark.mark("attribute-changed");
            }
            listener.addHandler("attribute-changed", "._real.li",
                                attributeChanged);
            $root.append($fragment_to_add);
            listener.startListening($root);
            tree_updater.setAttributeNS(
                $root.find("._real.li")[0], "http://foo.foo/foo", "X",
                "ttt");
            mark.check();
        });

        it("fires attribute-changed when deleting an attribute",
           function (done) {
            mark = new Mark(1, {"attribute-changed": 1},
                            listener, $root, done);
            function attributeChanged(this_root, element, ns, name,
                                      old_value) {
                assert.equal(this_root, $root[0]);
                assert.equal(element.className, "_real li");
                assert.equal(ns, "http://foo.foo/foo");
                assert.equal(name, "X");
                assert.equal(old_value, "ttt");
                mark.mark("attribute-changed");
            }
            listener.addHandler("attribute-changed", "._real.li",
                                attributeChanged);
            $root.append($fragment_to_add);
            $root.find("._real.li")[0].setAttributeNS("http://foo.foo/foo",
                                                      "X", "ttt");
            listener.startListening($root);
            tree_updater.setAttributeNS(
                $root.find("._real.li")[0], "http://foo.foo/foo", "X",
                null);
            mark.check();
        });

        it("generates children-changed with the right previous and " +
           "next siblings when adding",
           function (done) {
            mark = new Mark(1, {"children ul": 1},
                            listener, $root, done);
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(previous_sibling, $li[0]);
                assert.equal(next_sibling, $li[1]);
                mark.mark("children ul");
            }
            listener.addHandler("children-changed", "._real.ul",
                                changedHandler);
            $root.append($fragment_to_add);
            listener.startListening($root);
            var $li = $root.find("._real.li");
            var li = $li[0];
            var $new = $("<li>Q</li>");
            tree_updater.insertNodeAt(li.parentNode,
                                      Array.prototype.indexOf.call(
                                          li.parentNode.childNodes, li) + 1,
                                      $new[0]);
            mark.check();
        });


        it("generates children-changing and children-changed with " +
           "the right previous and next siblings when removing",
           function (done) {
            $fragment_to_add =
                $("<div class='_real ul'>"+
                  "<div class='_real li'>A</div>"+
                  "<div class='_real li'>B</div>" +
                  "<div class='_real li'>C</div>" +
                  "</div>");

            mark = new Mark(2, {
                "children-changed ul": 1,
                "children-changing ul": 1
            },
                            listener, $root, done);
            function changingHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.equal(previous_sibling, $li[0]);
                assert.equal(next_sibling, $li[2]);
                assert.equal(element, parent);
                mark.mark("children-changing ul");
            }
            listener.addHandler("children-changing", "._real.ul",
                                changingHandler);
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if (added[0] === $marker[0])
                    return;
                assert.isNull(previous_sibling);
                assert.isNull(next_sibling);
                assert.equal(element, parent);
                mark.mark("children-changed ul");
            }
            listener.addHandler("children-changed", "._real.ul",
                                changedHandler);

            $root.append($fragment_to_add);
            listener.startListening($root);
            var $li = $root.find("._real.li");
            var parent = $li[0].parentNode;
            var li = $li[1];
            tree_updater.deleteNode(li);
            mark.check();
        });


        it("generates included-element with the right tree, and " +
           "previous and next siblings",
           function (done) {
            var mark = new Mark(8,
                                {"included li at root": 2,
                                 "included li at ul": 2,
                                 "excluding li at ul": 2,
                                 "excluding li at root": 2
                                },
                                listener, $root, done);
            function addHandler(incex) {
                listener.addHandler(
                    incex + "-element",
                    "._real.li",
                    function (this_root, tree, parent, previous_sibling,
                              next_sibling, element) {
                    assert.equal(this_root, $root[0], "root");
                    assert.equal(element.className,
                                 "_real li", "element class");
                    // The following tests are against
                    // $fragment rather than $root or
                    // $this_root because by the time the
                    // handler is called, the $root could be
                    // empty!

                    if (tree === $fragment[0]) {
                        mark.mark(incex + " li at root");
                        assert.equal(parent, $root[0], "parent value");
                        assert.isNull(previous_sibling, "previous sibling");
                        assert.isNull(next_sibling, "next sibling");
                    }
                    else {
                        assert.equal(tree, $fragment.find(".ul")[0],
                                     "tree value");
                        assert.equal(parent, $fragment[0]);
                        assert.equal(previous_sibling, $fragment.find("p")[0]);
                        assert.equal(next_sibling, $fragment.find("p")[1]);
                        mark.mark(incex + " li at ul");
                    }
                });
            }
            addHandler("included");
            addHandler("excluding");
            listener.startListening($root);
            var $fragment =
                $("<div><p>before</p><div class='_real ul'>"+
                  "<div class='_real li'>A</div>"+
                  "<div class='_real li'>B</div></div>"+
                  "<p>after</p></div>");
            var $ul;
            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment[0]);
            $ul = $root.find(".ul");
            tree_updater.deleteNode($ul[0]);
            var p = $root.find("p")[0];
            var p_parent = p.parentNode;
            tree_updater.insertNodeAt(p_parent,
                                      Array.prototype.indexOf.call(
                                          p_parent.childNodes, p) + 1,
                                      $ul[0]);
            $root.contents().each(function () {
                tree_updater.deleteNode(this);
            });
            mark.check();
        });

        it("processImmediately processes immediately",
           function () {
            var marked = false;
            mark = new Mark(2, {"children root": 1,
                                "trigger": 1},
                            listener, $root,
                            function () { marked = true; });
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                if (added[0] === $marker[0])
                    return;
                listener.trigger("t");
                mark.mark("children root");
            }

            function triggerHandler() {
                mark.mark("trigger");
            }

            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.addHandler("trigger", "t",
                                triggerHandler);
            listener.startListening($root);

            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment_to_add[0]);
            listener.processImmediately();
            mark.check();
            assert.isTrue(marked);
        });

        it("clearPending clears pending operations",
           function () {
            var marked = false;
            mark = new Mark(1, {"children root": 1},
                            listener, $root,
                            function () { marked = true; });
            function changedHandler(this_root, added, removed,
                                    previous_sibling, next_sibling,
                                    element) {
                if (added[0] === $marker[0])
                    return;
                listener.trigger("t");
                mark.mark("children root");
            }

            function triggerHandler() {
                mark.mark("trigger");
            }

            listener.addHandler("children-changed", "*", changedHandler);
            listener.addHandler("trigger", "t", triggerHandler);
            listener.startListening($root);

            tree_updater.insertNodeAt($root[0], $root[0].childNodes.length,
                                      $fragment_to_add[0]);
            listener.clearPending();
            mark.check();
            assert.isTrue(marked);
        });

    });
};

});

//  LocalWords:  domlistener processImmediately MutationObserver chai
//  LocalWords:  jQuery jquery insertNodeAt ul li nextSibling Dubeau
//  LocalWords:  previousSibling MPL Mangalam setTextNodeValue
//  LocalWords:  domroot
