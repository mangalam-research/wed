define(["mocha/mocha", "chai", "jquery", "wed/domlistener"], 
function (mocha, chai, $, domlistener) {
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
        
        listener.addHandler("added-element", "._marker", 
                            (function () {
                                assert.equal(this._count, this._total_expected);
                                Object.keys(this._counts_expected).forEach(function (k) {
                                    assert.equal(this._counts[k], this._counts_expected[k]);
                                }.bind(this));
                                Object.keys(this._counts).forEach(function (k) {
                                    assert.equal(this._counts[k], this._counts_expected[k]);
                                }.bind(this));


                                assert.equal(listener._observer.takeRecords().length, 0);
                                done();
                            }).bind(this));
        
    }
    
    (function () {
        this.mark = function (label) {
            if (this._counts[label] === undefined)
                this._counts[label] = 0;

            this._counts[label]++;

            this._count++;
            // Trigger the handler only once.
            if (this._count === 1)
                this._$root.append($marker);
        };
        
    }).call(Mark.prototype);

    var assert = chai.assert;
    var Listener = domlistener.Listener;
    describe("domlistener", function () {
        var $root = $("#domroot");
        var $fragment_to_add = $("<div class='_real ul'><div class='_real li'>A</div><div class='_real li'>B</div></div>");
        var listener;
        beforeEach(function () {
            $root.empty();
            listener = new Listener($root.get(0));
        });
        afterEach(function () {
            listener.stopListening();
        });

        it("adding a fragment", function (done) {
            var mark = new Mark(5, 
                                {"included ul": 1, 
                                 "added ul": 1, 
                                 "children root": 1,
                                 "included li": 2}, listener, $root, done);
            listener.addHandler(
                "included-element", 
                "._real.ul",
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.get(0).className, "_real ul");
                    assert.equal($element.length, 1);
                    mark.mark("included ul");
                });
            listener.addHandler(
                "included-element", 
                "._real.li",
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.length, 1);
                    assert.equal($element.get(0).className, "_real li");
                    mark.mark("included li");
                });
            listener.addHandler(
                "added-element", 
                "._real.ul",
                function ($this_root, $parent, $previous_sibling, $next_sibling, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($this_root.get(0), $parent.get(0));
                    assert.equal($element.get(0), $fragment_to_add.get(0));
                    mark.mark("added ul");
                });
            listener.addHandler(
                "children-changed",
                "*",
                function ($this_root, $added, $removed, $element) {
                    // The marker will also trigger this
                    // handler. Ignore it.
                    if ($added.get(0) === $marker.get(0))
                        return;
                    assert.equal($this_root.get(0), $element.get(0));
                    assert.equal($removed.length, 0);
                    assert.equal($added.length, 1);
                    assert.equal($added.get(0), $fragment_to_add.get(0));
                    mark.mark("children root");
                });
            listener.startListening($root);
            $root.append($fragment_to_add);
        });

        it("removing a fragment", function (done) {
            $root.append($fragment_to_add);
            var mark = new Mark(5, 
                                {"excluded ul": 1,
                                 "removed ul": 1,
                                 "children root": 1,
                                 "excluded li": 2},
                                listener, $root, done);
            listener.addHandler(
                "excluded-element", 
                "._real.ul",
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.length, 1);
                    assert.equal($element.get(0).className, "_real ul");
                    mark.mark("excluded ul");
                });
            listener.addHandler(
                "excluded-element", 
                "._real.li",
                function ($this_root, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($element.length, 1);
                    assert.equal($element.get(0).className, "_real li");
                    mark.mark("excluded li");
                });
            listener.addHandler(
                "removed-element", 
                "._real.ul",
                function ($this_root, $parent, $previous_sibling, $next_sibling, $element) {
                    assert.equal($this_root.get(0), $root.get(0));
                    assert.equal($this_root.get(0), $parent.get(0));
                    assert.equal($element.get(0), $fragment_to_add.get(0));
                    mark.mark("removed ul");
                });
            listener.addHandler(
                "children-changed",
                "*",
                function ($this_root, $added, $removed, $element) {
                    // The marker will also trigger this
                    // handler. Ignore it.
                    if ($added.get(0) === $marker.get(0))
                        return;
                    assert.equal($this_root.get(0), $element.get(0));
                    assert.equal($added.length, 0);
                    assert.equal($removed.length, 1);
                    assert.equal($removed.get(0), $fragment_to_add.get(0));
                    mark.mark("children root");
                });
            listener.startListening($root);
            $fragment_to_add.remove();
        });

        it("trigger triggered twice, invoked once", function (done) {
            var mark = new Mark(3, 
                                {"triggered test": 1, 
                                 "included li": 2}, listener, $root, done);
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
                    assert.equal($element.get(0).className, "_real li");
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
                                 "included li": 2}, listener, $root, done);
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
                    assert.equal($element.get(0).className, "_real li");
                    listener.trigger("test");
                    mark.mark("included li");
                });
            listener.startListening($root);
            $root.append($fragment_to_add);
        });



    });
});
