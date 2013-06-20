define(["mocha/mocha", "chai", "jquery", "wed/domlistener"],
function (mocha, chai, $, domlistener) {
    //
    // (The method processImmediately did not exist when this test
    // suite was first created. At any rate testing the asynchronous
    // execution of the functions is a good deal.)
    //
    // Listener is based on MutationObserver, which operates
    // asynchronously. This complicates things a bit. However,
    // Listener works in such a way that all events triggered by a
    // given mutation are processed together before the events
    // triggered by the next muation are processed, etc. Consequently,
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
        this._counts = {};
        this._total_expected = total_expected;
        this._$root = $root;

        var markHadler = (function () {
            assert.equal(this._count, this._total_expected);
            Object.keys(this._counts_expected).forEach(function (k) {
                assert.equal(this._counts[k],
                             this._counts_expected[k]);
            }.bind(this));
            Object.keys(this._counts).forEach(function (k) {
                assert.equal(this._counts[k],
                             this._counts_expected[k]);
            }.bind(this));


            assert.equal(listener._observer.takeRecords().length, 0);
            done();
        }).bind(this);
        listener.addHandler("added-element", "._marker", markHadler);
    }

    Mark.prototype.mark = function (label) {
        if (this._counts[label] === undefined)
            this._counts[label] = 0;

        this._counts[label]++;

        this._count++;
        // Trigger the handler only once.
        if (this._count === 1)
            this._$root.append($marker);
    };

    var assert = chai.assert;
    var Listener = domlistener.Listener;
    describe("domlistener", function () {
        var $root = $("#domroot");
        var $fragment_to_add;
        var listener;
        var mark;
        beforeEach(function () {
            // Create a new fragment each time.
            $fragment_to_add =
                $("<div class='_real ul'>"+
                  "<div class='_real li'>A</div>"+
                  "<div class='_real li'>B</div></div>");
            $root.empty();
            listener = new Listener($root.get(0));
        });
        afterEach(function () {
            listener.stopListening();
        });

        function makeIncludedHandler(name) {
            return function ($this_root,
                             $element) {
                assert.equal($this_root.get(0), $root.get(0));
                assert.equal($element.get(0).className,
                             "_real " + name);
                assert.equal($element.length, 1);
                mark.mark("included " + name);
            };
        }

        function makeExcludedHandler(name) {
            return function ($this_root,
                             $element) {
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
                               listener, $root, done);
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
               $root.append($fragment_to_add);
           });

        it("generates added-element with the right previous and next siblings",
           function (done) {
               mark = new Mark(2,
                               {"added li": 2},
                               listener, $root, done);
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
               $root.find(".ul").append($li);
           });

        it("generates removed-element with the right previous and " +
           "next siblings",
           function (done) {
               mark = new Mark(2,
                               {"removed li": 2},
                               listener, $root, done);
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
                       // By the time B is removed, it has no siblings
                       // anymore.
                       assert.equal($previous_sibling.get(0),
                                    $li.get(0),
                                    "previous sibling of B");
                       assert.isUndefined($next_sibling.get(0),
                                    "next sibling of B");
                   }
                   mark.mark("removed li");
               }
               listener.addHandler("removed-element", "._real.li",
                                   removedHandler);
               $root.append($fragment_to_add);
               listener.startListening($root);
               var $li = $root.find("._real.li");
               var $ul = $root.find("._real.ul");
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
                               listener, $root, done);
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
               $fragment_to_add.remove();
           });

        it("trigger triggered twice, invoked once", function (done) {
            var mark = new Mark(3,
                                {"triggered test": 1,
                                 "included li": 2},
                                listener, $root, done);
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
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.length, 1);
                    assert.equal($element.get(0).className,
                                 "_real li");
                    listener.trigger("test");
                    mark.mark("included li");
                });
            listener.startListening($root);
            $root.append($fragment_to_add);
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
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.length, 1);
                    assert.equal($element.get(0).className,
                                 "_real li");
                    listener.trigger("test");
                    mark.mark("included li");
                });
            listener.startListening($root);
            $root.append($fragment_to_add);
        });

        it("fires text-changed when changing a text node",
           function (done) {
               mark = new Mark(1, {"text-changed": 1},
                               listener, $root, done);
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
               listener.startListening($root);
               $root.append($fragment_to_add);
               $root.find("._real.li").get(0).
                   childNodes[0].nodeValue = "Q";
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
               listener.startListening($root);
               $root.append($fragment_to_add);
               $li = $root.find("._real.li").first();
               $li.text("Q");
           });

        it("generates children-changed with the right previous and " +
           "next siblings",
           function (done) {
               mark = new Mark(1, {"children ul": 1},
                               listener, $root, done);
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
               $li.first().after("<li>Q</li>");
           });

        it("processImmediately processes immediately",
           function () {
               var marked = false;
               mark = new Mark(1, {"children root": 1},
                               listener, $root, function () { marked = true; });
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
               $root.append($fragment_to_add);
               listener.processImmediately();
               assert.isTrue(marked);
           });

    });
});
