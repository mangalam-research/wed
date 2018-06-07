var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "rxjs/operators", "wed", "../base-config", "../wed-test-util"], function (require, exports, operators_1, wed_1, globalConfig, wed_test_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    globalConfig = __importStar(globalConfig);
    var assert = chai.assert;
    describe("wed save:", function () {
        var setup;
        var editor;
        var server;
        before(function () {
            setup = new wed_test_util_1.EditorSetup("/base/build/standalone/lib/tests/wed_test_data/\
server_interaction_converted.xml", globalConfig.config, document);
            (editor = setup.editor, server = setup.server);
            return setup.init();
        });
        afterEach(function () {
            setup.reset();
        });
        after(function () {
            setup.restore();
            // tslint:disable-next-line:no-any
            editor = undefined;
        });
        it("saves using the keyboard", function () {
            var prom = editor.saver.events
                .pipe(operators_1.filter(function (ev) { return ev.name === "Saved"; }), operators_1.first()).toPromise()
                .then(function () {
                assert.deepEqual(server.lastSaveRequest, {
                    command: "save",
                    version: wed_1.version,
                    data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                });
            });
            editor.type(wed_1.keyConstants.SAVE);
            return prom;
        });
        it("saves using the toolbar", function () {
            // We just check the event happened.
            var prom = editor.saver.events
                .pipe(operators_1.filter(function (ev) { return ev.name === "Saved"; }), operators_1.first()).toPromise();
            var button = editor.widget
                .querySelector("[data-original-title='Save']");
            button.click();
            return prom;
        });
        it("serializes properly", function () {
            var prom = editor.saver.events
                .pipe(operators_1.filter(function (ev) { return ev.name === "Saved"; }), operators_1.first()).toPromise()
                .then(function () {
                assert.deepEqual(server.lastSaveRequest, {
                    command: "save",
                    version: wed_1.version,
                    data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p><abbr/></p></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                });
            });
            var p = editor.dataRoot.querySelector("p");
            editor.caretManager.setCaret(p, 0);
            var trs = editor.modeTree.getMode(p)
                .getContextualActions("insert", "abbr", p, 0);
            trs[0].execute({ name: "abbr" });
            editor.type(wed_1.keyConstants.SAVE);
            return prom;
        });
        it("does not autosave if not modified", function (done) {
            // tslint:disable-next-line:no-floating-promises
            editor.save().then(function () {
                var sub = editor.saver.events
                    .pipe(operators_1.filter(function (ev) { return ev.name === "Autosaved"; })).subscribe(function () {
                    throw new Error("autosaved!");
                });
                editor.saver.setAutosaveInterval(50);
                setTimeout(function () {
                    sub.unsubscribe();
                    done();
                }, 500);
            });
        });
        it("autosaves when the document is modified", function (done) {
            // We're testing that autosave is not called again after the first time.
            var autosaved = false;
            var sub = editor.saver.events.pipe(operators_1.filter(function (x) { return x.name === "Autosaved"; }))
                .subscribe(function () {
                if (autosaved) {
                    throw new Error("autosaved more than once");
                }
                autosaved = true;
                assert.deepEqual(server.lastSaveRequest, {
                    command: "autosave",
                    version: wed_1.version,
                    data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                });
                setTimeout(function () {
                    sub.unsubscribe();
                    done();
                }, 500);
            });
            editor.dataUpdater.removeNode(editor.dataRoot.querySelector("p"));
            editor.saver.setAutosaveInterval(50);
        });
        it("autosaves when the document is modified after a first autosave timeout " +
            "that did nothing", function (done) {
            // tslint:disable-next-line:no-floating-promises
            editor.save().then(function () {
                // We're testing that autosave is not called again after the first
                // time.
                var autosaved = false;
                var interval = 50;
                var sub = editor.saver.events
                    .pipe(operators_1.filter(function (x) { return x.name === "Autosaved"; }))
                    .subscribe(function () {
                    if (autosaved) {
                        throw new Error("autosaved more than once");
                    }
                    autosaved = true;
                    assert.deepEqual(server.lastSaveRequest, {
                        command: "autosave",
                        version: wed_1.version,
                        data: "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt/><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                    });
                    setTimeout(function () {
                        sub.unsubscribe();
                        done();
                    }, interval * 2);
                });
                editor.saver.setAutosaveInterval(interval);
                setTimeout(function () {
                    assert.isFalse(autosaved, "should not have been saved yet");
                    editor.dataUpdater.removeNode(editor.dataRoot.querySelector("p"));
                }, interval * 2);
            });
        });
    });
});
//# sourceMappingURL=wed-save-test.js.map