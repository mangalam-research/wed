/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as keyMod from "wed/key";

const assert = chai.assert;

describe("key", () => {
  let key: typeof keyMod;
  let frame: HTMLIFrameElement;
  let frameWindow: Window;

  const browsers = {
    CHROME_31: false,
    MISE: false,
    OSX: false,
  };

  before((done) => {
    frame = document.createElement("iframe");
    document.body.appendChild(frame);
    frameWindow = frame.contentWindow;
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
      // tslint:disable-next-line:no-any
      const requirejs = (frameWindow as any).requirejs;
      // This will be loaded instead of the real module.
      // tslint:disable-next-line:no-any
      (frameWindow as any).define("wed/browsers", browsers);
      requirejs.config({
        baseUrl: "/base/build/standalone/lib/",
      });
      requirejs(["wed/key"],
                (_key: typeof keyMod) => {
                  key = _key;
                  done();
                });
    });
    frame.src = URL.createObjectURL(new Blob([frameSrc],
                                             { type: "text/html" }));
  });

  after(() => {
    document.body.removeChild(frame);
  });

  describe("makeKey", () => {
    it("makes a key", () => {
      const k = key.makeKey(1, true, 2, 3, true, false, true);
      assert.equal(k.which, 1);
      assert.equal(k.keyCode, 2);
      assert.equal(k.charCode, 3);
      assert.equal(k.ctrlKey, true);
      assert.equal(k.altKey, false);
      assert.equal(k.metaKey, true);
      assert.equal(k.keypress, true);
    });

    it("sets sensible defaults", () => {
      const k = key.makeKey(1);
      assert.equal(k.which, 1);
      assert.equal(k.keyCode, 1);
      assert.equal(k.charCode, 1);
      assert.equal(k.ctrlKey, false);
      assert.equal(k.altKey, false);
      assert.equal(k.metaKey, false);
      assert.equal(k.keypress, true);
    });

    it("returns the same value for same parameters", () => {
      const k1 = key.makeKey(1, true, 2, 3, true, false, true);
      const k2 = key.makeKey(1, true, 2, 3, true, false, true);
      assert.equal(k1, k2);
    });
  });

  describe("makeCtrlKey", () => {
    it("makes a control key", () => {
      const k = key.makeCtrlKey(1);
      assert.equal(k.which, 1);
      assert.equal(k.keyCode, 1);
      assert.equal(k.charCode, 0);
      assert.equal(k.ctrlKey, true);
      assert.equal(k.altKey, false);
      assert.equal(k.metaKey, false);
      assert.equal(k.keypress, false);
    });
  });

  describe("makeMetaKey", () => {
    it("makes a meta key", () => {
      const k = key.makeMetaKey(1);
      assert.equal(k.which, 1);
      assert.equal(k.keyCode, 1);
      assert.equal(k.charCode, 0);
      assert.equal(k.ctrlKey, false);
      assert.equal(k.altKey, false);
      assert.equal(k.metaKey, true);
      assert.equal(k.keypress, false);
    });
  });

  describe("makeCtrlEqKey", () => {
    it("makes a control key on non-OSX platforms", () => {
      const k = key.makeCtrlEqKey(1);
      assert.equal(k, key.makeCtrlKey(1));
    });

    it("makes a meta key on OSX platforms", () => {
      browsers.OSX = true;
      const k = key.makeCtrlEqKey(1);
      assert.equal(k, key.makeMetaKey(1));
    });

    afterEach(() => {
      browsers.OSX = false;
    });
  });

  describe("Key", () => {
    describe("anyModifier", () => {
      it("returns true if any modifier is set", () => {
        let k = key.makeCtrlKey(1);
        assert.isTrue(k.anyModifier());

        k = key.makeKey(1, false, 2, 3, false, true, false);
        assert.isTrue(k.anyModifier());

        k = key.makeKey(1, false, 2, 3, false, false, true);
        assert.isTrue(k.anyModifier());
      });
    });

    describe("matchesEvent", () => {
      it("matches keydown/keyup keys", () => {
        const k = key.makeCtrlKey(1);
        assert.isTrue(k.matchesEvent({
          which: 1,
          keyCode: 1,
          charCode: 0,
          ctrlKey: true,
          altKey: false,
          metaKey: false,
          type: "keydown",
        } as KeyboardEvent));
        assert.isTrue(k.matchesEvent({
          which: 1,
          keyCode: 1,
          charCode: 0,
          ctrlKey: true,
          altKey: false,
          metaKey: false,
          type: "keyup",
        } as KeyboardEvent));
      });

      it("matches a keypress key", () => {
        const k = key.makeKey(1);
        assert.isTrue(k.matchesEvent({
          which: 1,
          keyCode: 1,
          charCode: 1,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          type: "keypress",
        } as KeyboardEvent));
      });

      it("returns false when not matching an event", () => {
        const k = key.makeCtrlKey(1);
        assert.isFalse(k.matchesEvent({
          which: 1,
          keyCode: 1,
          charCode: 1,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
        } as KeyboardEvent));
      });
    });

    describe("setEventToMatch", () => {
      it("sets an event to match a ctrl key", () => {
        const event = {} as KeyboardEvent;
        const k = key.makeCtrlKey(1);
        k.setEventToMatch(event);
        assert.isTrue(k.matchesEvent(event));
        // Biased towards keydown
        assert.equal(event.type, "keydown");
      });

      it("sets an event to match a keypress", () => {
        const event = {} as KeyboardEvent;
        const k = key.makeKey(1);
        k.setEventToMatch(event);
        assert.isTrue(k.matchesEvent(event));
      });
    });
  });
});

//  LocalWords:  RequireJS Ctrl Mangalam MPL Dubeau requirejs chai
//  LocalWords:  makeKey makeCtrlKey anyModifier keyup matchesEvent
//  LocalWords:  keydown keypress setEventToMatch ctrl
