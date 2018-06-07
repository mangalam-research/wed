/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { filter, first } from "rxjs/operators";

import { keyConstants, version } from "wed";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { EditorSetup, WedServer } from "../wed-test-util";

const assert = chai.assert;

describe("wed save:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let server: WedServer;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/\
server_interaction_converted.xml",
      globalConfig.config,
      document);
    ({ editor, server } = setup);
    return setup.init();
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
  });

  it("saves using the keyboard", () => {
    const prom =  editor.saver.events
      .pipe(filter((ev) => ev.name === "Saved"), first()).toPromise()
      .then(() => {
        assert.deepEqual(server.lastSaveRequest, {
          command: "save",
          version: version,
          data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
        });
    });
    editor.type(keyConstants.SAVE);
    return prom;
  });

  it("saves using the toolbar", () => {
    // We just check the event happened.
    const prom =  editor.saver.events
      .pipe(filter((ev) => ev.name === "Saved"), first()).toPromise();
    const button = editor.widget
      .querySelector("[data-original-title='Save']") as HTMLElement;
    button.click();
    return prom;
  });

  it("serializes properly", () =>  {
    const prom = editor.saver.events
      .pipe(filter((ev) => ev.name === "Saved"), first()).toPromise()
      .then(() => {
        assert.deepEqual(server.lastSaveRequest, {
          command: "save",
          version: version,
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
    editor.type(keyConstants.SAVE);
    return prom;
  });

  it("does not autosave if not modified", (done) => {
    // tslint:disable-next-line:no-floating-promises
    editor.save().then(() => {
      const sub = editor.saver.events
        .pipe(filter((ev) => ev.name === "Autosaved")).subscribe(() => {
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
    const sub = editor.saver.events.pipe(filter((x) => x.name === "Autosaved"))
      .subscribe(() => {
        if (autosaved) {
          throw new Error("autosaved more than once");
        }
        autosaved = true;
        assert.deepEqual(server.lastSaveRequest, {
          command: "autosave",
          version: version,
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
         const sub = editor.saver.events
           .pipe(filter((x) => x.name === "Autosaved"))
           .subscribe(() => {
             if (autosaved) {
               throw new Error("autosaved more than once");
             }
             autosaved = true;
             assert.deepEqual(server.lastSaveRequest, {
               command: "autosave",
               version: version,
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
