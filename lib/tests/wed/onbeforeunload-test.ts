/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
import * as sinon from "sinon";
import * as onbeforeunloadMod from "wed/onbeforeunload";

const assert = chai.assert;

// We need any in a bunch of places here.
// tslint:disable:no-any

describe("onbeforeunload", () => {
  let onbeforeunload: typeof onbeforeunloadMod;
  let frame: HTMLIFrameElement;
  let frameWindow: Window;

  beforeEach((done) => {
    frame = document.createElement("iframe");
    document.body.appendChild(frame);
    frameWindow = frame.contentWindow!;
    // We need <base> in the following code so that the proper protocol
    // is set when resolving the relative paths.
    const frameSrc = `
<html>
  <base href="${window.location.origin}"></base>
  <head>
    <script src="/base/node_modules/requirejs/require.js"></script>
    <script src="/base/build/standalone/requirejs-config.js"></script>
  </head>
  <body>
  </body>
</html>`;

    frame.addEventListener("load", () => {
      const requirejs = (frameWindow as any).requirejs;
      requirejs.config({
        baseUrl: "/base/build/standalone/lib/",
      });
      requirejs(["wed/onbeforeunload"],
                (_onbeforeunload: typeof onbeforeunloadMod) => {
                  onbeforeunload = _onbeforeunload;
                  done();
                });
    });
    frame.src = URL.createObjectURL(new Blob([frameSrc],
                                             { type: "text/html" }));
  });

  afterEach(() => {
    document.body.removeChild(frame);
  });

  it("does not automatically install itself on window", () => {
    assert.isNull(frameWindow.onbeforeunload);
  });

  describe("install", () => {
    it("fails when already set and force is not set", () => {
      onbeforeunload.install(frameWindow);
      assert.throws(onbeforeunload.install.bind(undefined, frameWindow),
                    (frameWindow as any).Error,
                    "reregistering window with `force` false");
    });

    it("works when force is set", () => {
      onbeforeunload.install(frameWindow);
      onbeforeunload.install(frameWindow, undefined, true);
      assert.isTrue(frameWindow.onbeforeunload!.call(frameWindow,
                                                     undefined as any));
    });

    it("a true check results in a prompt", () => {
      const check = sinon.stub();
      check.returns(true);

      onbeforeunload.install(frameWindow, check, true);
      assert.isTrue(frameWindow.onbeforeunload!.call(frameWindow,
                                                     undefined as any));
      assert.isTrue(check.calledOnce);
    });

    it("a false check does not result in a prompt", () => {
      const check = sinon.stub();
      check.returns(false);

      onbeforeunload.install(frameWindow, check, true);
      assert.isUndefined(frameWindow.onbeforeunload!.call(frameWindow,
                                                          undefined as any));
      assert.isTrue(check.calledOnce);
    });
  });
});

//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
