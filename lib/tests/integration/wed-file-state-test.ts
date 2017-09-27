/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import { CaretManager } from "wed/caret-manager";
import * as keyConstants from "wed/key-constants";
import * as log from "wed/log";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, makeWedRoot, setupServer,
         waitForSuccess } from "../util";

const options = {
  schema: "/base/build/schemas/tei-simplified-rng.js",
  mode: {
    path: "wed/modes/test/test-mode",
    options: {
      metadata: "/base/build/schemas/tei-metadata.json",
    },
  },
};

const assert = chai.assert;

describe("wed file state:", () => {
  let source: string;
  let editor: wed.Editor;
  let caretManager: CaretManager;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let $modificationStatus: JQuery;
  let $saveStatus: JQuery;
  let titles: NodeListOf<Element>;

  before(async () => {
    const provider =
      new DataProvider("/base/build/standalone/lib/tests/wed_test_data/");
    source = await provider.getText("source_converted.xml");

    topSandbox = sinon.sandbox.create({
      useFakeServer: true,
    });
    setupServer(topSandbox.server);
  });

  beforeEach(() => {
    wedroot = makeWedRoot(document);
    document.body.appendChild(wedroot);
    editor = new wed.Editor(wedroot,
                            mergeOptions(globalConfig.config, options));
    return editor.init(source)
      .then(() => {
        // tslint:disable-next-line:no-any
        (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
        caretManager = editor.caretManager;
        // tslint:disable-next-line:no-any
        $modificationStatus = (editor as any).$modificationStatus;
        // tslint:disable-next-line:no-any
        $saveStatus = (editor as any).$saveStatus;
        titles = editor.guiRoot.getElementsByClassName("title");
      });
  });

  afterEach(() => {
    if (editor !== undefined) {
      editor.destroy();
    }

    // We read the state, reset, and do the assertion later so that if the
    // assertion fails, we still have our reset.
    const wasTerminating = onerror.is_terminating();

    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    log.clearAppenders();
    expect(wasTerminating)
      .to.equal(false, "test caused an unhandled exception to occur");

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
    document.body.removeChild(wedroot);

    // Immediately destroy all notifications to prevent interfering with other
    // tests. ($.notifyClose is not drastic enough.)
    $("[data-notify=container]").remove();
  });

  after(() => {
    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
  });

  it("modification status shows an unmodified document when starting", () => {
    assert.isTrue($modificationStatus.hasClass("label-success"));
  });

  it("save status shows an unsaved document when starting", () => {
    assert.isTrue($saveStatus.hasClass("label-default"));
    assert.equal($saveStatus.children("span").text(), "");
  });

  it("onbeforeunload returns falsy on unmodified doc", () => {
    assert.isFalse(!!editor.window.onbeforeunload
                   // tslint:disable-next-line:no-any
                   .call(editor.window, undefined) as any);
  });

  it("modification status shows a modified document after modification", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);
    editor.type(" ");

    assert.isTrue($modificationStatus.hasClass("label-warning"));
  });

  it("onbeforeunload returns truthy on modified doc", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);
    editor.type(" ");

    assert.isTrue(!!editor.window.onbeforeunload
                  .call(editor.window, undefined));
  });

  it("modification status shows an unmodified document after save", () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);
    editor.type(" ");

    assert.isTrue($modificationStatus.hasClass("label-warning"));
    editor.type(keyConstants.CTRLEQ_S);
    return waitForSuccess(() => {
      assert.isTrue($modificationStatus.hasClass("label-success"));
    });
  });

  it("save status shows a saved document after a save", () => {
    assert.isTrue($saveStatus.hasClass("label-default"));
    assert.equal($saveStatus.children("span").text(), "");

    editor.type(keyConstants.CTRLEQ_S);
    return waitForSuccess(() => {
      assert.isTrue($saveStatus.hasClass("label-success"));
      assert.equal($saveStatus.children("span").text(), "moments ago");
      // We also check the tooltip text.
      assert.equal($saveStatus.data("bs.tooltip").getTitle(),
                   "The last save was a manual save.");
    });
  });

  it("save status shows a saved document after an autosave", () => {
    assert.isTrue($saveStatus.hasClass("label-default"));
    assert.equal($saveStatus.children("span").text(), "");

    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);
    editor.type(" ");
    editor.saver.setAutosaveInterval(50);
    return waitForSuccess(() => {
      assert.isTrue($saveStatus.hasClass("label-info"));
      assert.equal($saveStatus.children("span").text(), "moments ago");
      // We also check the tooltip text.
      assert.equal($saveStatus.data("bs.tooltip").getTitle(),
                   "The last save was an autosave.");
    });
  });

  it("save status tooltip updated after a different kind of save", async () => {
    // Text node inside title.
    const initial = titles[0].childNodes[1];
    caretManager.setCaret(initial, 0);
    editor.type(" ");
    editor.saver.setAutosaveInterval(50);
    await waitForSuccess(() => {
      // We check the initial tooltip text.
      const tooltip = $saveStatus.data("bs.tooltip");
      assert.isDefined(tooltip);
      assert.equal(tooltip.getTitle(), "The last save was an autosave.");
    });

    // Now perform a save.
    editor.type(keyConstants.CTRLEQ_S);

    return waitForSuccess(() => {
      // We check the tooltip changed.
      const tooltip = $saveStatus.data("bs.tooltip");
      assert.isDefined(tooltip);
      assert.equal(tooltip.getTitle(), "The last save was a manual save.");
    });
  });
});
