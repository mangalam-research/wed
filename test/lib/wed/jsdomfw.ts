/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { assert } from "chai";
import { JSDOM, VirtualConsole } from "jsdom";
import * as path from "path";

const basePath =
  `file://${path.join(__dirname, "/../../../build/standalone/")}`;

const html = `<html>
  <head>
    <base href="${basePath}"></base>
    <meta http-equiv="Content-Type" content="text/xhtml; charset=utf-8"/>
    <script type="text/javascript" src="lib/requirejs/require.js"></script>
    <script type="text/javascript" src="requirejs-config.js"></script>
    <link rel="stylesheet"
          href="lib/external/bootstrap/css/bootstrap.min.css"></link>
    <link href="lib/wed/wed.css" type="text/css" media="screen"
          rel="stylesheet"></link>
  </head>
  <body>
    <div id="root">
       <div id="a"><p>A</p></div>
       <div id="b"><p>B</p></div>
    </div>
    <div id="c">C</div>
  </body>
</html>`;

// tslint:disable:no-any completed-docs

//
// Mock the DOM Range and Selection objects. We're doing only just enough to
// prevent Rangy from going nuts. Note that this is not enough to be able to use
// Rangy for general Range and Selection manipulations.
//

class Range {
  startContainer: any;
  startOffset: any;
  endContainer: any;
  endOffset: any;
  collapsed: boolean = true;
  commonAncestorContainer: string = "FAKE";

  // Set what we use.
  setStart(node: any, offset: any): void {
    this.startContainer = node;
    this.startOffset = offset;
    if (this.collapsed) {
      this.setEnd(node, offset);
    }
    else {
      this._setCollapsed();
    }
  }

  setEnd(node: any, offset: any): void {
    this.endContainer = node;
    this.endOffset = offset;
    this._setCollapsed();
  }

  _setCollapsed(): void {
    this.collapsed = !this.endContainer ||
      (this.startContainer === this.endContainer &&
       this.startOffset === this.endOffset);
  }
}

// These must all be set to make rangy happy. We set them to nothing useful
// because we won't actually use them.
[
  "setStartBefore", "setStartAfter", "setEndBefore",
  "setEndAfter", "collapse", "selectNode", "selectNodeContents",
  "compareBoundaryPoints", "deleteContents", "extractContents",
  "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString",
  "detach",
].forEach((x) => {
  // tslint:disable-next-line:no-empty
  (Range.prototype as any)[x] = () => {};
});

class Selection {
  anchorNode: any = null;
  anchorOffset: any = null;
  baseNode: any = null;
  baseOffset: any = null;
  extentNode: any = null;
  extentOffset: any = null;
  focusNode: any = null;
  focusOffset: any = null;
  isCollapsed: any = true;
  _ranges: any[] = [];
  // tslint:disable-next-line:no-reserved-keywords
  type: string = "Range";

  addRange(r: any): void {
    this._ranges.push(r);
  }

  removeAllRanges(): void {
    this._ranges = [];
  }

  get rangeCount(): number {
    return this._ranges.length;
  }
}

export class FW {
  private _window: Window;
  readonly logBuffer: any[] = [];

  get window(): Window {
    return this._window;
  }

  create(done: () => void): void {
    const vc = new VirtualConsole();
    vc.on("log", (...args: any[]) => {
      this.logBuffer.push(args);
    });

    vc.on("jsdomError", (er) => {
      throw er;
    });

    const dom = new JSDOM(html, {
      url: basePath,
      runScripts: "dangerously",
      resources: "usable",
      virtualConsole: vc,
    });

    const w = this._window = dom.window;

    w.addEventListener("load", () => {
      // Mock createRange for rangy.
      w.document.createRange = function createRange(): Range {
        const range = new Range();
        range.setStart(w.document.body, 0);
        range.setEnd(w.document.body, 0);
        return range;
      } as any;

      // Mock window.getSelection for rangy.
      w.getSelection = function getSelection(): Selection {
        return new Selection();
      } as any;

      // Check that rangy loaded properly...
      (w as any).require(["rangy"], (rangy: any) => {
        assert.isTrue(rangy.initialized, "rangy initialized.");
        assert.isTrue(rangy.supported, "rangy supports our environment");

        // There should not be any errors.
        assert.equal(this.logBuffer.length, 0);
        done();
      });
    });
  }
}
