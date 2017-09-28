/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as sinon from "sinon";

import * as keyConstants from "wed/key-constants";
import * as onerror from "wed/onerror";
import * as wed from "wed/wed";

import * as globalConfig from "../base-config";
import { DataProvider, makeWedRoot, WedServer } from "../util";

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

describe("wed save:", () => {
  let source: string;
  let editor: wed.Editor;
  let topSandbox: sinon.SinonSandbox;
  let wedroot: HTMLElement;
  let server: WedServer;

  before(async () => {
    const provider =
      new DataProvider("/base/build/standalone/lib/tests/wed_test_data/");
    source = await provider.getText("server_interaction_converted.xml");
  });

  before(() => {
    topSandbox = sinon.sandbox.create({
      useFakeServer: true,
    });
    server = new WedServer(topSandbox.server);

    wedroot = makeWedRoot(document);
    document.body.appendChild(wedroot);
    editor = new wed.Editor(wedroot,
                            mergeOptions(globalConfig.config, options));
    return editor.init(source)
      .then(() => {
        // tslint:disable-next-line:no-any
        (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
      });
  });

  beforeEach(() => {
    editor.undoAll();
    editor.resetLabelVisibilityLevel();
    server.reset();
  });

  afterEach(() => {
    assert.isFalse(onerror.is_terminating(),
                   "test caused an unhandled exception to occur");
    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    editor.editingMenuManager.dismiss();
  });

  after(() => {
    if (editor !== undefined) {
      editor.destroy();
    }

    // We read the state, reset, and do the assertion later so that if the
    // assertion fails, we still have our reset.
    const wasTerminating = onerror.is_terminating();

    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    expect(wasTerminating)
      .to.equal(false, "test caused an unhandled exception to occur");

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;

    if (topSandbox !== undefined) {
      topSandbox.restore();
    }
    document.body.removeChild(wedroot);

    // Immediately destroy all notifications to prevent interfering with other
    // tests. ($.notifyClose is not drastic enough.)
    $("[data-notify=container]").remove();
  });

  it("saves", () => {
    const prom =  editor.saver.events
      .filter((ev) => ev.name === "Saved").first().toPromise()
      .then(() => {
        assert.deepEqual(server.lastSaveRequest, {
          command: "save",
          version: wed.version,
          data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
        });
    });
    editor.type(keyConstants.CTRLEQ_S);
    return prom;
  });

  it("serializes properly", () =>  {
    const prom = editor.saver.events
      .filter((ev) => ev.name === "Saved").first().toPromise()
      .then(() => {
        assert.deepEqual(server.lastSaveRequest, {
          command: "save",
          version: wed.version,
          data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p><abbr/></p></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
        });
      });
    const p = editor.dataRoot.querySelector("p")!;
    editor.caretManager.setCaret(p, 0);
    const trs = editor.modeTree.getMode(p)
      .getContextualActions("insert", "abbr", p, 0);
    trs[0].execute({ name: "abbr" });
    editor.type(keyConstants.CTRLEQ_S);
    return prom;
  });

  it("does not autosave if not modified", (done) => {
    // tslint:disable-next-line:no-floating-promises
    editor.save().then(() => {
      const sub = editor.saver.events
        .filter((ev) => ev.name === "Autosaved").subscribe((ev) => {
          throw new Error("autosaved!");
        });
      editor.saver.setAutosaveInterval(50);
      setTimeout(() => {
        sub.unsubscribe();
        done();
      }, 500);
    });
  });

  it("autosaves when the document is modified", (done) => {
    // We're testing that autosave is not called again after the first time.
    let autosaved = false;
    const sub = editor.saver.events.filter((x) => x.name === "Autosaved")
      .subscribe(() => {
        if (autosaved) {
          throw new Error("autosaved more than once");
        }
        autosaved = true;
        assert.deepEqual(server.lastSaveRequest, {
          command: "autosave",
          version: wed.version,
          data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
        });
        setTimeout(() => {
          sub.unsubscribe();
          done();
        }, 500);
      });
    editor.dataUpdater.removeNode(editor.dataRoot.querySelector("p"));
    editor.saver.setAutosaveInterval(50);
  });

  it("autosaves when the document is modified after a first autosave timeout " +
     "that did nothing", (done) => {
       // tslint:disable-next-line:no-floating-promises
       editor.save().then(() => {
         // We're testing that autosave is not called again after the first
         // time.
         let autosaved = false;
         const interval = 50;
         const sub = editor.saver.events.filter((x) => x.name === "Autosaved")
           .subscribe(() => {
             if (autosaved) {
               throw new Error("autosaved more than once");
             }
             autosaved = true;
             assert.deepEqual(server.lastSaveRequest, {
               command: "autosave",
               version: wed.version,
               data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
             });
             setTimeout(() => {
               sub.unsubscribe();
               done();
             }, interval * 2);
           });
         editor.saver.setAutosaveInterval(interval);
         setTimeout(() => {
           assert.isFalse(autosaved, "should not have been saved yet");
           editor.dataUpdater.removeNode(editor.dataRoot.querySelector("p"));
         }, interval * 2);
       });
     });
});
