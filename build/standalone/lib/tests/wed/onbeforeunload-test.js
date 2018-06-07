var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "sinon"], function (require, exports, sinon) {
    /**
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    sinon = __importStar(sinon);
    var assert = chai.assert;
    // We need any in a bunch of places here.
    // tslint:disable:no-any
    describe("onbeforeunload", function () {
        var onbeforeunload;
        var frame;
        var frameWindow;
        beforeEach(function (done) {
            frame = document.createElement("iframe");
            document.body.appendChild(frame);
            frameWindow = frame.contentWindow;
            // We need <base> in the following code so that the proper protocol
            // is set when resolving the relative paths.
            var frameSrc = "\n<html>\n  <base href=\"" + window.location.origin + "\"></base>\n  <head>\n    <script src=\"/base/node_modules/requirejs/require.js\"></script>\n    <script src=\"/base/build/standalone/requirejs-config.js\"></script>\n  </head>\n  <body>\n  </body>\n</html>";
            frame.addEventListener("load", function () {
                var requirejs = frameWindow.requirejs;
                requirejs.config({
                    baseUrl: "/base/build/standalone/lib/",
                });
                requirejs(["wed/onbeforeunload"], function (_onbeforeunload) {
                    onbeforeunload = _onbeforeunload;
                    done();
                });
            });
            frame.src = URL.createObjectURL(new Blob([frameSrc], { type: "text/html" }));
        });
        afterEach(function () {
            document.body.removeChild(frame);
        });
        it("does not automatically install itself on window", function () {
            assert.isNull(frameWindow.onbeforeunload);
        });
        describe("install", function () {
            it("fails when already set and force is not set", function () {
                onbeforeunload.install(frameWindow);
                // Upon upgrading from Chai 3.5.0 to 4.1.2 this fails. The problem is that
                // isCompatibleConstructor in check-error is too strict. It checks whether
                // the parameter passed to throws is an instance of Error, which fails due
                // to the error being raised in a frame.
                //
                // assert.throws(onbeforeunload.install.bind(undefined, frameWindow),
                //               (frameWindow as any).Error,
                //               /^reregistering window with `force` false$/);
                var e;
                try {
                    onbeforeunload.install(frameWindow);
                }
                catch (_e) {
                    e = _e;
                }
                assert.instanceOf(e, frameWindow.Error);
                assert.equal(e.message, "reregistering window with `force` false");
            });
            it("works when force is set", function () {
                onbeforeunload.install(frameWindow);
                onbeforeunload.install(frameWindow, undefined, true);
                assert.isTrue(frameWindow.onbeforeunload.call(frameWindow, undefined));
            });
            it("a true check results in a prompt", function () {
                var check = sinon.stub();
                check.returns(true);
                onbeforeunload.install(frameWindow, check, true);
                assert.isTrue(frameWindow.onbeforeunload.call(frameWindow, undefined));
                assert.isTrue(check.calledOnce);
            });
            it("a false check does not result in a prompt", function () {
                var check = sinon.stub();
                check.returns(false);
                onbeforeunload.install(frameWindow, check, true);
                assert.isUndefined(frameWindow.onbeforeunload.call(frameWindow, undefined));
                assert.isTrue(check.calledOnce);
            });
        });
    });
});
//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
//# sourceMappingURL=onbeforeunload-test.js.map