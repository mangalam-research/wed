/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as browsers from "wed/browsers";
import { CaretManager } from "wed/caret-manager";
import { isAttr } from "wed/domtypeguards";
import { Editor } from "wed/editor";
import { GUIValidationError } from "wed/gui-validation-error";
import * as keyConstants from "wed/key-constants";
import { TaskRunner } from "wed/task-runner";
import { ValidationController } from "wed/validation-controller";

import * as globalConfig from "../base-config";
import { makeFakePasteEvent, waitForSuccess } from "../util";
import { EditorSetup, firstGUI } from "../wed-test-util";

const assert = chai.assert;
const _slice = Array.prototype.slice;

describe("wed validation errors:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;
  let controller: ValidationController;
  let processRunner: TaskRunner;
  let refreshRunner: TaskRunner;
  let guiRoot: Element;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init().then(() => {
      // tslint:disable-next-line:no-any
      (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
      // tslint:disable-next-line:no-any
      processRunner = (editor as any).validationController.processErrorsRunner;
      // tslint:disable-next-line:no-any
      refreshRunner = (editor as any).validationController.refreshErrorsRunner;
      caretManager = editor.caretManager;
      // tslint:disable-next-line:no-any
      controller = (editor as any).validationController;
      guiRoot = editor.guiRoot;
    });
  });

  beforeEach(() => {
    // Force the processing of errors
    controller.processErrors();
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
    // tslint:disable-next-line:no-any
    (controller as any) = undefined;
  });

  it("validation errors added by the mode", () => {
    const errors = controller.copyErrorList();
    const last = errors[errors.length - 1];
    assert.equal(last.ev.error.toString(), "Test");
  });

  it("refreshErrors does not change the number of errors", async () => {
    await processRunner.onCompleted();
    const count = controller.copyErrorList().length;
    const listCount = editor.$errorList.children("li").length;
    const markerCount = guiRoot.getElementsByClassName("wed-validation-error")
      .length;

    controller.refreshErrors();
    await refreshRunner.onCompleted();

    assert.equal(count, controller.copyErrorList().length,
                 "the number of recorded errors should be the same");
    assert.equal(listCount, editor.$errorList.children("li").length,
                 "the number of errors in the panel should be the same");
    assert.equal(markerCount,
                 guiRoot.getElementsByClassName("wed-validation-error").length,
                 "the number of markers should be the same");
  });

  // tslint:disable-next-line:mocha-no-side-effect-code
  const itNoIE = browsers.MSIE ? it.skip : it;

  // This cannot be run on IE due to the way IE screws up the
  // formatting of contenteditable elements.
  // tslint:disable-next-line:mocha-no-side-effect-code
  itNoIE("errors for inline elements in a correct position", async () => {
    await processRunner.onCompleted();
    const p = guiRoot.querySelectorAll(".body .p")[12];
    const dataP = editor.toDataNode(p)!;
    const dataMonogr = dataP.childNodes[0] as Element;
    const monogr = $.data(dataMonogr, "wed_mirror_node");
    assert.equal(dataMonogr.tagName, "monogr");

    let pError;
    let pErrorIx: number = 0;
    let monogrError;
    let monogrErrorIx: number = 0;
    let i = 0;
    for (const error of controller.copyErrorList()) {
      if (pError === undefined && error.ev.node === dataP) {
        pError = error;
        pErrorIx = i;
      }

      if (monogrError === undefined && error.ev.node === dataMonogr) {
        monogrError = error;
        monogrErrorIx = i;
      }
      i++;
    }

    // Make sure we found our errors.
    assert.isDefined(pError, "no error for our paragraph");
    assert.isDefined(monogrError, "no error for our monogr");

    // Find the corresponding markers
    // tslint:disable-next-line:no-any
    const markers = (editor as any).errorLayer.el.children;
    const pMarker = markers[pErrorIx];
    const monogrMarker = markers[monogrErrorIx];
    assert.isDefined(pMarker, "should have an error for our paragraph");
    assert.isDefined(monogrMarker, "should have an error for our monogr");

    const pMarkerRect = pMarker.getBoundingClientRect();

    // The pMarker should appear to the right of the start label for the
    // paragraph and overlap with the start label for monogr.
    const pStartLabel = firstGUI(p)!;
    assert.isTrue(pStartLabel.classList.contains("__start_label"),
                  "should should have a start label for the paragraph");
    const pStartLabelRect = pStartLabel.getBoundingClientRect();
    assert.isTrue(pMarkerRect.left >= pStartLabelRect.right,
                  "the paragraph error marker should be to the right of the \
start label for the paragraph");
    // We used to check the top too, but the changes in caret size make that
    // impractical. So we check only the bottom position.
    assert.isTrue(Math.abs(pMarkerRect.bottom - pStartLabelRect.bottom) <= 5,
                  "the paragraph error marker should have a bottom which is \
within 5 pixels of the bottom of the start label for the paragraph");

    const monogrStartLabel = firstGUI(monogr)!;
    assert.isTrue(monogrStartLabel.classList.contains("__start_label"),
                  "should should have a start label for the paragraph");
    const monogrStartLabelRect = monogrStartLabel.getBoundingClientRect();
    assert.isTrue(Math.abs(pMarkerRect.left - monogrStartLabelRect.left) <= 5,
                  "the paragraph error marker have a left side within 5 pixels \
of the left side of the start label for the monogr");

    // The monogrMarker should be to the right of the monogrStartLabel.
    const monogrMarkerRect = monogrMarker.getBoundingClientRect();

    assert.isTrue(monogrMarkerRect.left >= monogrStartLabelRect.right,
                  "the monogr error marker should be to the right of the \
start label for the monogr");
    monogrMarker.scrollIntoView();
    // We used to check the top too, but the changes in caret size make that
    // impractical. So we check only the bottom position.
    assert.isTrue(Math.abs(monogrMarkerRect.bottom -
                           monogrStartLabelRect.bottom) <= 5,
                  "the monogr error marker should have a bottom which is \
within 5 pixels of the bottom of the start label for the monogr");
  });

  it("the attributes error are not linked", async () => {
    editor.setLabelVisibilityLevel(0);

    await processRunner.onCompleted();
    let cases = 0;
    for (const { ev, item } of controller.copyErrorList()) {
      if (!isAttr(ev.node)) {
        continue;
      }
      assert.isTrue(item!.getElementsByTagName("a").length === 0,
                    "there should be no link in the item");
      assert.equal(
        item!.title,
        "This error belongs to an attribute which is not currently displayed.",
        "the item should have the right title");
      cases++;
    }
    assert.equal(cases, 5);
  });

  function assertNewMarkers(orig: Element[], after: Element[],
                            event: string): void {
    // Make sure all markers are new.
    const note = ` after ${event}`;
    for (const item of orig) {
      assert.notInclude(after, item,
                        `the list of markers should be new${note}`);
    }

    // We do not compare the number of errors, because changing the label
    // visibility may change the number of errors shown to the user.
  }

  describe("recreates errors when", () => {
    it("changing label visibility level", async () => {
      // Changing label visibility does not merely refresh the errors but
      // recreates them because errors that were visible may become invisible or
      // errors that were invisible may become visible.

      await processRunner.onCompleted();
      // tslint:disable-next-line:no-any
      const errorLayer = (editor as any).errorLayer.el as Element;
      let orig = _slice.call(errorLayer.children);

      // Reduce the visibility level.
      editor.type(keyConstants.LOWER_LABEL_VISIBILITY);
      let after;
      await waitForSuccess(() => {
        after = _slice.call(errorLayer.children);
        assertNewMarkers(orig, after, "decreasing the level");
      });

      orig = after;

      // Increase visibility level
      editor.type(keyConstants.INCREASE_LABEL_VISIBILITY);
      await waitForSuccess(() => {
        assertNewMarkers(orig, _slice.call(errorLayer.children),
                         "increasing the level");
      });
    });

    it("moving into or out of a label with autohidden attributes", async () => {
      // Moving into or ouot of a label with autohidden attributes does not
      // merely refresh the errors but recreates them because errors that were
      // visible may become invisible or errors that were invisible may become
      // visible.

      function getError(): GUIValidationError {
        const errors = controller.copyErrorList();
        let found: GUIValidationError | undefined;
        for (const error of errors) {
          if (error.item!.textContent === "attribute not allowed here: xxx") {
            found = error;
          }
        }

        assert.isDefined(found);

        return found!;
      }

      await processRunner.onCompleted();
      // tslint:disable-next-line:no-any
      const errorLayer = (editor as any).errorLayer.el as Element;
      let orig = _slice.call(errorLayer.children);

      const divs = editor.dataRoot.querySelectorAll("body>div");
      const div = divs[divs.length - 1];

      // We check that there is an error for the "xxx" attribute, which has no
      // link (=== no marker).
      assert.isUndefined(getError().marker);

      // Move into the label.
      editor.caretManager.setCaret(div, 0);
      editor.caretManager.move("left");
      let after;
      await processRunner.onCompleted();
      await waitForSuccess(() => {
        after = _slice.call(errorLayer.children);
        assertNewMarkers(orig, after, "moving into the label");
        // Now it has a link (=== has a marker).
        assert.isDefined(getError().marker);
      });

      orig = after;

      // Move out of the label.
      editor.caretManager.move("right");
      await processRunner.onCompleted();
      await waitForSuccess(() => {
        assertNewMarkers(orig, _slice.call(errorLayer.children),
                         "moving out of the label");
        // No link again.
        assert.isUndefined(getError().marker);
      });
    });
  });

  it("refreshes error positions when pasting", async () => {
    await refreshRunner.onCompleted();

    // Paste.
    const initial = editor.dataRoot.querySelector("body>p")!.firstChild!;
    caretManager.setCaret(initial, 0);
    const initialValue = initial.textContent;

    // Synthetic event
    const event = makeFakePasteEvent({
      types: ["text/plain"],
      getData: () => "abcdef",
    });
    editor.$guiRoot.trigger(event);
    assert.equal(initial.nodeValue, `abcdef${initialValue}`);

    // refreshRunner returns to an incomplete states, which means there will be
    // a refresh.
    assert.isFalse(refreshRunner.completed);
  });

  it("refreshes error positions when typing text", async () => {
    await refreshRunner.onCompleted();

    // Text node inside title.
    const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    editor.type("blah");
    assert.equal(initial.nodeValue, "blahabcd");
    assert.equal(parent.childNodes.length, 3);

    // refreshRunner returns to an incomplete states, which means there will be
    // a refresh.
    assert.isFalse(refreshRunner.completed);
  });

  it("refreshes error positions when typing DELETE", async () => {
    await refreshRunner.onCompleted();

    // Text node inside title.
    const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 0);

    editor.type(keyConstants.DELETE);
    assert.equal(initial.nodeValue, "bcd");
    assert.equal(parent.childNodes.length, 3);

    // refreshRunner returns to an incomplete states, which means there will be
    // a refresh.
    assert.isFalse(refreshRunner.completed);
  });

  it("refreshes error positions when typing BACKSPACE", async () => {
    await refreshRunner.onCompleted();

    // Text node inside title.
    const initial = guiRoot.getElementsByClassName("title")[0].childNodes[1];
    const parent = initial.parentNode!;
    caretManager.setCaret(initial, 4);

    editor.type(keyConstants.BACKSPACE);
    assert.equal(initial.nodeValue, "abc");
    assert.equal(parent.childNodes.length, 3);

    // refreshRunner returns to an incomplete states, which means there will be
    // a refresh.
    assert.isFalse(refreshRunner.completed);
  });
});
