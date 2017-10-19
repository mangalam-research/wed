define(["require", "exports", "module", "wed/key-constants", "wed/onerror", "wed/wed", "../base-config", "../wed-test-util"], function (require, exports, module, keyConstants, onerror, wed, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("wed error handling:", function () {
        var setup;
        var editor;
        var server;
        beforeEach(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/\
server_interaction_converted.xml", globalConfig.config, document);
            (editor = setup.editor, server = setup.server);
            return setup.init();
        });
        afterEach(function () {
            setup.restore();
        });
        it("tell user to reload when save fails hard", function (done) {
            server.emptyResponseOnSave = true;
            var $modal = onerror.__test.$modal;
            $modal.on("shown.bs.modal", function () {
                // Reset the state so we don't get a failure in the after hook.
                onerror.__test.reset();
                done();
            });
            editor.type(keyConstants.CTRLEQ_S);
        });
        it("warn of disconnection when server returns a bad status", function (done) {
            server.failOnSave = true;
            var $modal = editor.modals.getModal("disconnect").getTopLevel();
            $modal.on("shown.bs.modal", function () {
                editor.saver.events.filter(function (ev) { return ev.name === "Saved"; })
                    .first().subscribe(function (ev) {
                    // Was saved on retry!
                    // This allows us to let the whole save process run its course before
                    // we declare it done.
                    setTimeout(done, 0);
                });
                server.reset();
                // This triggers a retry.
                $modal.modal("hide");
            });
            editor.type(keyConstants.CTRLEQ_S);
        });
        it("bring up modal when document was edited by someone else", function (done) {
            server.preconditionFailOnSave = true;
            var $modal = editor.modals.getModal("editedByOther").getTopLevel();
            $modal.on("shown.bs.modal", function () {
                // Prevent a reload.
                $modal.off("hidden.bs.modal.modal");
                $modal.modal("hide");
                done();
            });
            editor.type(keyConstants.CTRLEQ_S);
        });
        it("bring up modal when there is a new version of editor", function (done) {
            server.tooOldOnSave = true;
            var $modal = editor.modals.getModal("tooOld").getTopLevel();
            $modal.on("shown.bs.modal", function () {
                // Prevent a reload.
                $modal.off("hidden.bs.modal.modal");
                $modal.modal("hide");
                done();
            });
            editor.type(keyConstants.CTRLEQ_S);
        });
        it("no recovery when save fails hard", function (done) {
            server.emptyResponseOnSave = true;
            var $modal = onerror.__test.$modal;
            $modal.on("shown.bs.modal", function () {
                // Reset the state so we don't get a failure in the after hook.
                onerror.__test.reset();
                // The data was saved even though the server replied badly.
                assert.deepEqual(server.lastSaveRequest, {
                    // It is important that this be "save" and not "recover".
                    command: "save",
                    version: wed.version,
                    data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                });
                done();
            });
            editor.type(keyConstants.CTRLEQ_S);
        });
        it("recovery on uncaught exception", function (done) {
            // We can't just raise an exception because mocha will intercept it and it
            // will never get to the onerror handler. If we raise the error in a
            // timeout, it will go straight to onerror.
            setTimeout(function () {
                setTimeout(function () {
                    // Reset the state so we don't get a failure in the after hook.
                    onerror.__test.reset();
                    assert.deepEqual(server.lastSaveRequest, {
                        command: "recover",
                        version: wed.version,
                        data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
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
});

//# sourceMappingURL=wed-error-handling-test.js.map
