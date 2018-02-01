define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("key", function () {
        var key;
        var frame;
        var frameWindow;
        var browsers = {
            CHROME_31: false,
            MISE: false,
            OSX: false,
        };
        // We load the module into a frame so that we can give it a fake ``browsers``
        // module.
        before(function (done) {
            frame = document.createElement("iframe");
            document.body.appendChild(frame);
            frameWindow = frame.contentWindow;
            // We need <base> in the following code so that the proper protocol
            // is set when resolving the relative paths.
            var frameSrc = "\n<html>\n  <base href=\"" + window.location.origin + "\"></base>\n  <head>\n    <script src=\"/base/node_modules/requirejs/require.js\"></script>\n    <script src=\"/base/build/standalone/requirejs-config.js\"></script>\n  </head>\n  <body>\n  </body>\n</html>";
            frame.addEventListener("load", function () {
                // tslint:disable-next-line:no-any
                var requirejs = frameWindow.requirejs;
                // This will be loaded instead of the real module.
                // tslint:disable-next-line:no-any
                frameWindow.define("wed/browsers", browsers);
                requirejs.config({
                    baseUrl: "/base/build/standalone/lib/",
                });
                requirejs(["wed/key"], function (_key) {
                    key = _key;
                    done();
                });
            });
            frame.src = URL.createObjectURL(new Blob([frameSrc], { type: "text/html" }));
        });
        after(function () {
            document.body.removeChild(frame);
        });
        describe("makeKey", function () {
            it("makes a key", function () {
                var k = key.makeKey(1, true, 2, 3, true, false, true, key.EITHER);
                assert.equal(k.which, 1);
                assert.equal(k.keyCode, 2);
                assert.equal(k.charCode, 3);
                assert.equal(k.ctrlKey, true);
                assert.equal(k.altKey, false);
                assert.equal(k.metaKey, true);
                assert.equal(k.shiftKey, key.EITHER);
                assert.equal(k.keypress, true);
            });
            it("sets sensible defaults", function () {
                var k = key.makeKey(1);
                assert.equal(k.which, 1);
                assert.equal(k.keyCode, 1);
                assert.equal(k.charCode, 1);
                assert.equal(k.ctrlKey, false);
                assert.equal(k.altKey, false);
                assert.equal(k.metaKey, false);
                assert.equal(k.shiftKey, key.EITHER);
                assert.equal(k.keypress, true);
            });
            it("returns the same value for same parameters", function () {
                var k1 = key.makeKey(1, true, 2, 3, true, false, true);
                var k2 = key.makeKey(1, true, 2, 3, true, false, true);
                assert.equal(k1, k2);
                var k3 = key.makeKey(1, true, 2, 3, true, false, true, key.EITHER);
                assert.equal(k1, k3);
            });
        });
        describe("makeCtrlKey", function () {
            it("makes a control key", function () {
                var k = key.makeCtrlKey(1);
                assert.equal(k.which, 1);
                assert.equal(k.keyCode, 1);
                assert.equal(k.charCode, 0);
                assert.equal(k.ctrlKey, true);
                assert.equal(k.altKey, false);
                assert.equal(k.metaKey, false);
                assert.equal(k.shiftKey, key.EITHER);
                assert.equal(k.keypress, false);
            });
        });
        describe("makeMetaKey", function () {
            it("makes a meta key", function () {
                var k = key.makeMetaKey(1);
                assert.equal(k.which, 1);
                assert.equal(k.keyCode, 1);
                assert.equal(k.charCode, 0);
                assert.equal(k.ctrlKey, false);
                assert.equal(k.altKey, false);
                assert.equal(k.metaKey, true);
                assert.equal(k.shiftKey, key.EITHER);
                assert.equal(k.keypress, false);
            });
        });
        describe("makeCtrlEqKey", function () {
            it("makes a control key on non-OSX platforms", function () {
                var k = key.makeCtrlEqKey(1);
                assert.equal(k, key.makeCtrlKey(1));
            });
            it("makes a meta key on OSX platforms", function () {
                browsers.OSX = true;
                var k = key.makeCtrlEqKey(1);
                assert.equal(k, key.makeMetaKey(1));
            });
            afterEach(function () {
                browsers.OSX = false;
            });
        });
        describe("Key", function () {
            describe("anyModifier", function () {
                it("returns true if any modifier is set", function () {
                    // We set shift true here to show it does not impact anyModifier.
                    var k = key.makeCtrlKey(1, true);
                    assert.isTrue(k.anyModifier());
                    k = key.makeKey(1, false, 2, 3, false, true, false);
                    assert.isTrue(k.anyModifier());
                    k = key.makeKey(1, false, 2, 3, false, false, true);
                    assert.isTrue(k.anyModifier());
                });
            });
            describe("matchesEvent", function () {
                it("matches keydown/keyup keys, with unspecified shift", function () {
                    var k = key.makeCtrlKey(1);
                    var event = {
                        which: 1,
                        keyCode: 1,
                        charCode: 0,
                        ctrlKey: true,
                        altKey: false,
                        metaKey: false,
                        shiftKey: false,
                        type: "keydown",
                    };
                    assert.isTrue(k.matchesEvent(event));
                    // Matches keyup too.
                    // tslint:disable-next-line:no-any
                    event.type = "keyup";
                    assert.isTrue(k.matchesEvent(event));
                    // Shift state does not matter.
                    // tslint:disable-next-line:no-any
                    event.shiftKey = true;
                    assert.isTrue(k.matchesEvent(event));
                });
                it("matches keydown/keyup keys, with specified shift", function () {
                    var k = key.makeCtrlKey(1, true);
                    var event = {
                        which: 1,
                        keyCode: 1,
                        charCode: 0,
                        ctrlKey: true,
                        altKey: false,
                        metaKey: false,
                        shiftKey: true,
                        type: "keydown",
                    };
                    assert.isTrue(k.matchesEvent(event));
                    // Matches keyup too.
                    // tslint:disable-next-line:no-any
                    event.type = "keyup";
                    assert.isTrue(k.matchesEvent(event));
                    // Shift state matters.
                    // tslint:disable-next-line:no-any
                    event.shiftKey = false;
                    assert.isFalse(k.matchesEvent(event));
                });
                it("matches a keypress key", function () {
                    var k = key.makeKey(1);
                    var event = {
                        which: 1,
                        keyCode: 1,
                        charCode: 1,
                        ctrlKey: false,
                        altKey: false,
                        metaKey: false,
                        shiftKey: false,
                        type: "keypress",
                    };
                    assert.isTrue(k.matchesEvent(event));
                    // Shift state does not matter.
                    // tslint:disable-next-line:no-any
                    event.shiftKey = true;
                    assert.isTrue(k.matchesEvent(event));
                });
                it("returns false when not matching an event", function () {
                    var k = key.makeCtrlKey(1);
                    assert.isFalse(k.matchesEvent({
                        which: 1,
                        keyCode: 1,
                        charCode: 1,
                        ctrlKey: false,
                        altKey: false,
                        metaKey: false,
                        shiftKey: false,
                    }));
                });
            });
            describe("setEventToMatch", function () {
                it("sets an event to match a ctrl key, with unspecified shift", function () {
                    var event = {};
                    var k = key.makeCtrlKey(1);
                    k.setEventToMatch(event);
                    assert.isTrue(k.matchesEvent(event));
                    // Biased towards keydown
                    assert.equal(event.type, "keydown");
                    assert.isUndefined(event.shiftKey);
                });
                it("sets an event to match a ctrl key, with specified shift", function () {
                    var event = {};
                    var k = key.makeCtrlKey(1, true);
                    k.setEventToMatch(event);
                    assert.isTrue(k.matchesEvent(event));
                    // Biased towards keydown
                    assert.equal(event.type, "keydown");
                    assert.equal(event.shiftKey, true);
                });
                it("sets an event to match a keypress", function () {
                    var event = {};
                    var k = key.makeKey(1);
                    k.setEventToMatch(event);
                    assert.isTrue(k.matchesEvent(event));
                    assert.isUndefined(event.shiftKey);
                });
            });
        });
    });
});
//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
//# sourceMappingURL=key-test.js.map