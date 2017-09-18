/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
const assert = chai.assert;

// tslint:disable:no-any completed-docs

// tslint:disable-next-line:no-void-expression max-func-body-length
(function (): void {
  //
  // Mock the DOM Range and Selection objects. We're doing only just enough to
  // prevent Rangy from going nuts. Note that this is not enough to be able to
  // use Rangy for general Range and Selection manipulations.
  //

  // If createRange is already existing, assume we don't need to fake Range
  // and Selection.
  if (document.createRange != null) {
    return;
  }

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

  document.createRange = function createRange(): Range {
    const range = new Range();
    range.setStart(document.body, 0);
    range.setEnd(document.body, 0);
    return range;
  } as any;

  // Mock window.getSelection for rangy.
  window.getSelection = function getSelection(): Selection {
    return new Selection();
  } as any;

  // Check that rangy loaded properly...
  (window as any).require(["rangy"], (rangy: any) => {
    assert.isTrue(rangy.initialized, "rangy initialized.");
    assert.isTrue(rangy.supported, "rangy supports our environment");
  });
}());
