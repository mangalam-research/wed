/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(function () {

// This is not as generic as it could be but this will do for now.
return function (mocha, chai, $, domlistener, class_name, tree_updater_class) {
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

    function Mark(total_expected, counts, listener, tree_updater, $root, done) {
        this._count = 0;
        this._counts_expected = counts;
        this._counts = {};
        this._total_expected = total_expected;
        this._$root = $root;
        this._tree_updater = tree_updater;
        this._listener = listener;
        this._done = done;

        // If we use a tree_updater changes are synchronous so we should
        // invoke the check manually.
        if (!tree_updater)
            listener.addHandler("added-element", "._marker",
                                this.check.bind(this));
    }

    Mark.prototype.check = function () {
        Object.keys(this._counts_expected).forEach(function (k) {
            assert.equal(this._counts[k],
                         this._counts_expected[k], "count for " + k);
        }.bind(this));
        Object.keys(this._counts).forEach(function (k) {
            assert.equal(this._counts[k],
                         this._counts_expected[k]);
        }.bind(this));

        assert.equal(this._count, this._total_expected, "total mark count");
        if (!this._tree_updater)
            assert.equal(this._listener._observer.takeRecords().length, 0);
        this._done();
    };

    Mark.prototype.mark = function (label) {
        if (this._counts[label] === undefined)
            this._counts[label] = 0;

        this._counts[label]++;

        this._count++;
        // Trigger the handler only once.
        if (this._count === 1 && !this._tree_updater)
            this._$root.append($marker);
    };

    var assert = chai.assert;
    var Listener = domlistener.Listener;
    describe(class_name, function () {
        var $root = $("#domroot");
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
                tree_updater = new tree_updater_class($root.get(0));
                listener = new Listener(
                    $root.get(0), tree_updater);
            }
            else
                listener = new Listener($root.get(0));
        });
        afterEach(function () {
            listener.stopListening();
        });

        function makeIncludedHandler(name) {
            return function ($this_root, $tree, $parent, $previous_sibling,
                             $next_sibling, $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.get(0).className,
                             "_real " + name);
                assert.equal($element.length, 1);
                mark.mark("included " + name);
            };
        }

        function makeExcludedHandler(name) {
            return function ($this_root, $tree, $parent, $previous_sibling,
                             $next_sibling, $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.get(0).className,
                             "_real " + name);
                assert.equal($element.length, 1);
                mark.mark("excluded " + name);
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
                            listener, tree_updater, $root, done);
            listener.addHandler("included-element", "._real.ul",
                                makeIncludedHandler("ul"));
            listener.addHandler("included-element", "._real.li",
                                makeIncludedHandler("li"));
            function addedHandler($this_root, $parent,
                                  $previous_sibling,
                                  $next_sibling, $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($this_root.get(0), $parent.get(0));
                assert.equal($element.get(0),
                             $fragment_to_add.get(0));
                mark.mark("added ul");
            }
            listener.addHandler("added-element", "._real.ul",
                                addedHandler);
            function changedHandler($this_root, $added, $removed,
                                    $previous_sibling, $next_sibling,
                                    $element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if ($added.get(0) === $marker.get(0))
                    return;
                assert.equal($this_root.get(0), $element.get(0));
                assert.equal($removed.length, 0);
                assert.equal($added.length, 1);
                assert.equal($added.get(0),
                             $fragment_to_add.get(0));
                assert.isUndefined($previous_sibling.get(0));
                assert.isUndefined($next_sibling.get(0));
                mark.mark("children root");
            }
            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.insertNodeAt($root.get(0),
                                          $root.get(0).childNodes.length,
                                          $fragment_to_add.get(0));
                mark.check();
            }
            else
                $root.append($fragment_to_add);
        });

        it("generates added-element with the right previous and next siblings",
           function (done) {
            mark = new Mark(2,
                            {"added li": 2},
                            listener, tree_updater, $root, done);
            function addedHandler($this_root, $parent,
                                  $previous_sibling,
                                  $next_sibling, $element) {
                assert.equal($previous_sibling.get(0),
                             $element.get(0).previousSibling);
                assert.equal($next_sibling.get(0),
                             $element.get(0).nextSibling);
                mark.mark("added li");
            }
            listener.addHandler("added-element", "._real.li",
                                addedHandler);
            $root.append($fragment_to_add);
            var $li = $root.find("._real.li");
            $li.remove();
            listener.startListening($root);
            if (tree_updater) {
                var parent = $root.find(".ul").get(0);
                $li.each(function () {
                    tree_updater.insertNodeAt(parent,
                                              parent.childNodes.length,
                                              this);
                });
                mark.check();
            }
            else
                $root.find(".ul").append($li);
        });

        it("generates removed-element with the right previous and " +
           "next siblings",
           function (done) {
            mark = new Mark(2,
                            {"removed li": 2},
                            listener, tree_updater, $root, done);
            function removedHandler($this_root, $parent,
                                    $previous_sibling,
                                    $next_sibling, $element) {
                var text = $element.get(0).childNodes[0].nodeValue;
                if (text === "A") {
                    assert.isUndefined($previous_sibling.get(0),
                                       "previous sibling of A");
                    assert.equal($next_sibling.get(0), $li.get(1),
                                 "next sibling of A");
                }
                else {
                    if (tree_updater)
                        // By the time we get here, B is alone.
                        assert.isUndefined($previous_sibling.get(0),
                                           "previous sibling of B");
                    else {
                        assert.equal($previous_sibling.get(0),
                                     $li.get(0),
                                     "previous sibling of B");
                        assert.isUndefined($next_sibling.get(0),
                                           "next sibling of B");
                    }
                }
                mark.mark("removed li");
            }
            listener.addHandler("removed-element", "._real.li",
                                removedHandler);
            $root.append($fragment_to_add);
            listener.startListening($root);
            var $li = $root.find("._real.li");
            var $ul = $root.find("._real.ul");
            if (tree_updater) {
                $li.each(function () {
                    tree_updater.deleteNode(this);
                });
                mark.check();
            }
            else
                $ul.get(0).innerHTML = '';
        });

        it("fires excluded-element, removed-element and " +
           "children-changed when removing a fragment",
           function (done) {
            $root.append($fragment_to_add);
            mark = new Mark(5,
                            {"excluded ul": 1,
                             "removed ul": 1,
                             "children root": 1,
                             "excluded li": 2},
                            listener, tree_updater, $root, done);
            listener.addHandler("excluded-element", "._real.ul",
                                makeExcludedHandler("ul"));
            listener.addHandler("excluded-element", "._real.li",
                                makeExcludedHandler("li"));

            function removedHandler($this_root, $parent,
                                    $previous_sibling,
                                    $next_sibling,
                                    $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($this_root.get(0), $parent.get(0));
                assert.equal($element.get(0),
                             $fragment_to_add.get(0));
                mark.mark("removed ul");
            }
            listener.addHandler("removed-element", "._real.ul",
                                removedHandler);
            function changedHandler($this_root, $added,
                                    $removed, $previous_sibling,
                                    $next_sibling, $element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if ($added.get(0) === $marker.get(0))
                    return;
                assert.equal($this_root.get(0), $element.get(0));
                assert.equal($added.length, 0);
                assert.equal($removed.length, 1);
                assert.equal($removed.get(0),
                             $fragment_to_add.get(0));
                assert.isUndefined($previous_sibling.get(0));
                assert.isUndefined($next_sibling.get(0));
                mark.mark("children root");
            }
            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.deleteNode($fragment_to_add.get(0));
                mark.check();
            }
            else
                $fragment_to_add.remove();
        });

        it("trigger triggered twice, invoked once", function (done) {
            var mark = new Mark(3,
                                {"triggered test": 1,
                                 "included li": 2},
                                listener, tree_updater, $root, done);
            listener.addHandler(
                "trigger",
                "test",
                function ($this_root) {
                assert.equal($this_root.get(0), $root.get(0));
                mark.mark("triggered test");
            });
            listener.addHandler(
                "included-element",
                "._real.li",
                function ($this_root, $tree, $parent, $previous_sibling,
                          $next_sibling, $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.length, 1);
                assert.equal($element.get(0).className,
                             "_real li");
                listener.trigger("test");
                mark.mark("included li");
            });
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.insertNodeAt($root.get(0),
                                          $root.get(0).childNodes.length,
                                          $fragment_to_add.get(0));
                // We have to allow for triggers to run.
                window.setTimeout(function () {
                    mark.check();
                }, 0);
            }
            else
                $root.append($fragment_to_add);
        });

        it("trigger triggering a trigger", function (done) {
            var mark = new Mark(4,
                                {"triggered test": 1,
                                 "triggered test2": 1,
                                 "included li": 2},
                                listener, tree_updater, $root, done);
            listener.addHandler(
                "trigger",
                "test",
                function ($this_root) {
                assert.equal($this_root.get(0), $root.get(0));
                listener.trigger("test2");
                mark.mark("triggered test");
            });
            listener.addHandler(
                "trigger",
                "test2",
                function ($this_root) {
                assert.equal($this_root.get(0), $root.get(0));
                mark.mark("triggered test2");
            });

            listener.addHandler(
                "included-element",
                "._real.li",
                function ($this_root, $tree, $parent, $previous_sibling,
                          $next_sibling, $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.length, 1);
                assert.equal($element.get(0).className,
                             "_real li");
                listener.trigger("test");
                mark.mark("included li");
            });
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.insertNodeAt($root.get(0),
                                          $root.get(0).childNodes.length,
                                          $fragment_to_add.get(0));
                // We have to allow for triggers to run.
                window.setTimeout(function () {
                    mark.check();
                }, 0);
            }
            else
                $root.append($fragment_to_add);
        });

        it("fires text-changed when changing a text node",
           function (done) {
            mark = new Mark(1, {"text-changed": 1},
                            listener, tree_updater, $root, done);
            function textChanged($this_root, $element, old_value) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.length, 1);
                assert.equal($element.parent().get(0).className,
                             "_real li");
                assert.equal($element.get(0).nodeValue, "Q");
                assert.equal(old_value, "A");
                mark.mark("text-changed");
            }
            listener.addHandler("text-changed", "._real.li",
                                textChanged);
            $root.append($fragment_to_add);
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.setTextNodeValue(
                    $root.find("._real.li").get(0).childNodes[0], "Q");
                mark.check();
            }
            else
                $root.find("._real.li").get(0).childNodes[0].nodeValue = "Q";
        });

        it("fires children-changed when adding a text node",
           function (done) {
            // The handler is called twice. Once when the single
            // text node which was already there is removed. Once
            // when the new text node is added.

            mark = new Mark(2, {"children li": 2},
                            listener, tree_updater, $root, done);
            var $li;
            var change_no = 0;
            function changedHandler($this_root, $added, $removed,
                                    $previous_sibling, $next_sibling,
                                    $element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if ($added.get(0) === $marker.get(0))
                    return;
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.get(0), $li.get(0));
                assert.equal($added.length, change_no === 0 ? 0 : 1,
                             "added elements");
                assert.equal($removed.length, change_no === 0 ? 1 : 0,
                             "removed elements");
                assert.isUndefined($previous_sibling.get(0));
                assert.isUndefined($next_sibling.get(0));
                if (change_no === 0)
                    assert.equal($removed.get(0).nodeValue, "A");
                else
                    assert.equal($added.get(0).nodeValue, "Q");
                change_no++;
                mark.mark("children li");
            }
            listener.addHandler("children-changed", "._real.li",
                                changedHandler);
            $root.append($fragment_to_add);
            listener.startListening($root);
            $li = $root.find("._real.li").first();
            if (tree_updater) {
                // We'll simulate what jQuery does:
                // remove the text node and add a new one.
                tree_updater.deleteNode($li.get(0).firstChild);
                tree_updater.insertText($li.get(0), 0, "Q");
                mark.check();
            }
            else {
                $li.text("Q");
            }
        });

        it("generates children-changed with the right previous and " +
           "next siblings",
           function (done) {
            mark = new Mark(1, {"children ul": 1},
                            listener, tree_updater, $root, done);
            function changedHandler($this_root, $added, $removed,
                                    $previous_sibling, $next_sibling,
                                    $element) {
                // The marker will also trigger this
                // handler. Ignore it.
                if ($added.get(0) === $marker.get(0))
                    return;
                assert.equal($previous_sibling.get(0), $li.get(0));
                assert.equal($next_sibling.get(0), $li.get(1));
                mark.mark("children ul");
            }
            listener.addHandler("children-changed", "._real.ul",
                                changedHandler);
            $root.append($fragment_to_add);
            listener.startListening($root);
            var $li = $root.find("._real.li");
            if (tree_updater) {
                var li = $li.get(0);
                var $new = $("<li>Q</li>");
                tree_updater.insertNodeAt(li.parentNode,
                                          Array.prototype.indexOf.call(
                                              li.parentNode.childNodes, li) + 1,
                                          $new.get(0));
                mark.check();
            }
            else
                $li.first().after("<li>Q</li>");
        });


        it("generates included-element with the right tree, and previous and " +
           "next siblings",
           function (done) {
            var mark = new Mark(8,
                                {"included li at root": 2,
                                 "included li at ul": 2,
                                 "excluded li at ul": 2,
                                 "excluded li at root": 2
                                },
                                listener, tree_updater, $root, done);
            function addHandler(incex) {
                listener.addHandler(
                    incex + "-element",
                    "._real.li",
                    function ($this_root, $tree, $parent, $previous_sibling,
                              $next_sibling, $element) {
                    assert.equal($this_root.get(0), $root.get(0), "root");
                    assert.equal($element.length, 1, "element length");
                    assert.equal($element.get(0).className,
                                 "_real li", "element class");
                    assert.equal($tree.length, 1, "tree length");
                    // The following tests are against
                    // $fragment rather than $root or
                    // $this_root because by the time the
                    // handler is called, the $root could be
                    // empty!

                    assert.equal($parent.length, 1, "parent length");
                    if ($tree.get(0) === $fragment.get(0)) {
                        mark.mark(incex + " li at root");
                        assert.equal($parent.get(0), $root.get(0),
                                     "parent value");
                        assert.isUndefined($previous_sibling.get(0),
                                           "previous sibling");
                        assert.isUndefined($next_sibling.get(0),
                                           "next sibling");
                    }
                    else {
                        assert.equal($tree.get(0),
                                     $fragment.find(".ul").get(0),
                                    "tree value");
                        assert.equal($parent.get(0), $fragment.get(0));
                        assert.equal($previous_sibling.get(0),
                                     $fragment.find("p").get(0));
                        assert.equal($next_sibling.get(0),
                                     $fragment.find("p").get(1));
                        assert.equal($previous_sibling.length, 1);
                        assert.equal($next_sibling.length, 1);
                        mark.mark(incex + " li at ul");
                    }
                });
            }
            addHandler("included");
            addHandler("excluded");
            listener.startListening($root);
            var $fragment =
                $("<div><p>before</p><div class='_real ul'>"+
                  "<div class='_real li'>A</div>"+
                  "<div class='_real li'>B</div></div>"+
                  "<p>after</p></div>");
            var $ul;
            if (tree_updater) {
                tree_updater.insertNodeAt($root.get(0),
                                          $root.get(0).childNodes.length,
                                          $fragment.get(0));
                $ul = $root.find(".ul");
                tree_updater.deleteNode($ul.get(0));
                var p = $root.find("p").first().get(0);
                var p_parent = p.parentNode;
                tree_updater.insertNodeAt(p_parent,
                                          Array.prototype.indexOf.call(
                                              p_parent.childNodes, p) + 1,
                                          $ul.get(0));
                $root.contents().each(function () {
                    tree_updater.deleteNode(this);
                });
                mark.check();
            }
            else {
                $root.append($fragment);
                $ul = $root.find(".ul");
                $ul.remove();
                $root.find("p").first().after($ul);
                $root.empty();
            }
        });

        it("processImmediately processes immediately",
           function () {
            var marked = false;
            mark = new Mark(1, {"children root": 1},
                            listener, tree_updater, $root,
                            function () { marked = true; });
            function changedHandler($this_root, $added, $removed,
                                    $previous_sibling, $next_sibling,
                                    $element) {
                if ($added.get(0) === $marker.get(0))
                    return;
                mark.mark("children root");
            }
            listener.addHandler("children-changed", "*",
                                changedHandler);
            listener.startListening($root);
            if (tree_updater) {
                tree_updater.insertNodeAt($root.get(0),
                                          $root.get(0).childNodes.length,
                                          $fragment_to_add.get(0));
                mark.check();
            }
            else
                $root.append($fragment_to_add);
            listener.processImmediately();
            assert.isTrue(marked);
        });

    });
};

});
