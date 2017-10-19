define(["require", "exports", "module", "salve", "wed/dloc", "wed/validator", "../util"], function (require, exports, module, salve_1, dloc_1, validator, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("validator", function () {
        var emptyTree;
        var emptyDataRoot;
        var grammar;
        var genericTree;
        before(function () {
            var frag = document.createDocumentFragment();
            emptyTree = document.createElement("div");
            frag.appendChild(emptyTree);
            emptyDataRoot = new dloc_1.DLocRoot(frag);
            var provider = new util_1.DataProvider("/base/build/");
            return Promise.all([
                provider.getText("schemas/simplified-rng.js").then(function (schema) {
                    grammar = salve_1.constructTree(schema);
                }),
                provider.getDoc("standalone/lib/tests/validator_test_data/to_parse_converted.xml")
                    .then(function (doc) {
                    genericTree = doc;
                }),
            ]);
        });
        describe("possibleAt", function () {
            it("with DLoc", function () {
                var p = new validator.Validator(grammar, emptyTree, []);
                var evs = p.possibleAt(dloc_1.DLoc.mustMakeDLoc(emptyDataRoot, emptyTree, 0));
                assert.sameMembers(evs.toArray(), [new salve_1.Event("enterStartTag", new salve_1.Name("", "", "html"))]);
            });
        });
        // We test speculativelyValidateFragment through speculativelyValidate
        describe("speculativelyValidate", function () {
            it("with DLoc", function () {
                var tree = genericTree.cloneNode(true);
                var dataRoot = new dloc_1.DLocRoot(tree);
                var p = new validator.Validator(grammar, tree, []);
                var body = tree.getElementsByTagName("body")[0];
                var container = body.parentNode;
                var index = Array.prototype.indexOf.call(container.childNodes, body);
                var ret = p.speculativelyValidate(dloc_1.DLoc.mustMakeDLoc(dataRoot, container, index), body);
                assert.isFalse(ret);
            });
        });
        // speculativelyValidateFragment is largely tested through
        // speculativelyValidate above.
        describe("speculativelyValidateFragment", function () {
            it("throws an error if toParse is not an element", function () {
                var tree = genericTree.cloneNode(true);
                var dataRoot = new dloc_1.DLocRoot(tree);
                var p = new validator.Validator(grammar, tree, []);
                // tslint:disable-next-line:no-any
                p._maxTimespan = 0; // Work forever.
                var body = tree.getElementsByTagName("body")[0];
                var container = body.parentNode;
                var index = Array.prototype.indexOf.call(container.childNodes, body);
                assert.throws(p.speculativelyValidateFragment.bind(p, dloc_1.DLoc.makeDLoc(dataRoot, container, index), document.createTextNode("blah")), Error, "toParse is not an element");
            });
        });
        describe("with a mode validator", function () {
            var p;
            var tree;
            var validationError;
            before(function () {
                validationError = new salve_1.ValidationError("Test");
                tree = genericTree.cloneNode(true);
            });
            beforeEach(function () {
                // tslint:disable-next-line:completed-docs
                var Validator = /** @class */ (function () {
                    function Validator() {
                    }
                    Validator.prototype.validateDocument = function () {
                        return [{
                                error: validationError,
                                node: tree,
                                index: 0,
                            }];
                    };
                    return Validator;
                }());
                p = new validator.Validator(grammar, tree, [new Validator()]);
                // tslint:disable-next-line:no-any
                p._maxTimespan = 0; // Work forever.
            });
            function onCompletion(cb) {
                p.events.addEventListener("state-update", function (state) {
                    if (!(state.state === validator.VALID ||
                        state.state === validator.INVALID)) {
                        return;
                    }
                    cb();
                });
            }
            it("records additional errors", function (done) {
                onCompletion(function () {
                    assert.deepEqual(p.errors, [{ error: validationError, node: tree,
                            index: 0 }]);
                    done();
                });
                p.start();
            });
            it("emits additional error events", function (done) {
                var seen = 0;
                p.events.addEventListener("error", function (error) {
                    assert.deepEqual(error, { error: validationError, node: tree,
                        index: 0 });
                    seen++;
                });
                onCompletion(function () {
                    assert.equal(seen, 1);
                    done();
                });
                p.start();
            });
        });
    });
});
//  LocalWords:  enterStartTag html jQuery Dubeau MPL Mangalam config
//  LocalWords:  RequireJS requirejs subdirectory validator jquery js
//  LocalWords:  chai baseUrl rng

//# sourceMappingURL=validator-test.js.map
