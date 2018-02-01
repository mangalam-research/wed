/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { filter } from "rxjs/operators/filter";
import { first } from "rxjs/operators/first";

import * as wed from "wed";
import { Editor } from "wed/editor";
import * as keyConstants from "wed/key-constants";
import * as onerror from "wed/onerror";

import * as globalConfig from "../base-config";
import { EditorSetup, WedServer } from "../wed-test-util";

const assert = chai.assert;

describe("wed error handling:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let server: WedServer;

  beforeEach(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/\
server_interaction_converted.xml",
      globalConfig.config,
      document);
    ({ editor, server } = setup);
    return setup.init();
  });

  afterEach(() => {
    setup.restore();
  });

  it("tell user to reload when save fails hard", (done) => {
    server.emptyResponseOnSave = true;
    const $modal = onerror.__test.$modal;
    $modal.on("shown.bs.modal", () => {
      // Reset the state so we don't get a failure in the after hook.
      onerror.__test.reset();
      done();
    });

    editor.type(keyConstants.SAVE);
  });

  it("warn of disconnection when server returns a bad status", (done) => {
    server.failOnSave = true;
    const $modal = editor.modals.getModal("disconnect").getTopLevel();
    $modal.on("shown.bs.modal", () => {
      editor.saver.events.pipe(filter((ev) => ev.name === "Saved"),
                               first())
        .subscribe((ev) => {
          // Was saved on retry!

          // This allows us to let the whole save process run its course before
          // we declare it done.
          setTimeout(done, 0);
        });

      server.reset();
      // This triggers a retry.
      $modal.modal("hide");
    });

    editor.type(keyConstants.SAVE);
  });

  it("bring up modal when document was edited by someone else", (done) => {
    server.preconditionFailOnSave = true;
    const $modal = editor.modals.getModal("editedByOther").getTopLevel();
    $modal.on("shown.bs.modal", () => {
      // Prevent a reload.
      $modal.off("hidden.bs.modal.modal");
      $modal.modal("hide");
      done();
    });

    editor.type(keyConstants.SAVE);
  });

  it("bring up modal when there is a new version of editor", (done) => {
    server.tooOldOnSave = true;
    const $modal = editor.modals.getModal("tooOld").getTopLevel();
    $modal.on("shown.bs.modal", () => {
      // Prevent a reload.
      $modal.off("hidden.bs.modal.modal");
      $modal.modal("hide");
      done();
    });

    editor.type(keyConstants.SAVE);
  });

  it("no recovery when save fails hard", (done) => {
    server.emptyResponseOnSave = true;
    const $modal = onerror.__test.$modal;
    $modal.on("shown.bs.modal", () => {
      // Reset the state so we don't get a failure in the after hook.
      onerror.__test.reset();

      // The data was saved even though the server replied badly.
      assert.deepEqual(server.lastSaveRequest, {
        // It is important that this be "save" and not "recover".
        command: "save",
        version: wed.version,
        data:
        "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
      });
      done();
    });

    editor.type(keyConstants.SAVE);
  });

  it("recovery on uncaught exception", (done) => {
    // We can't just raise an exception because mocha will intercept it and it
    // will never get to the onerror handler. If we raise the error in a
    // timeout, it will go straight to onerror.

    setTimeout(() => {
      setTimeout(() => {
        // Reset the state so we don't get a failure in the after hook.
        onerror.__test.reset();
        assert.deepEqual(server.lastSaveRequest, {
          command: "recover",
          version: wed.version,
          data:
          "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
        });
        done();
      }, 1000);
      throw new Error("I'm failing!");
    }, 5);
  });
});
