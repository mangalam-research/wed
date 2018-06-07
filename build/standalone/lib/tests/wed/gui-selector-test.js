define(["require", "exports", "wed/domutil", "wed/gui-selector"], function (require, exports, domutil_1, gui_selector_1) {
    /**
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expect = chai.expect;
    describe("GUISelector", function () {
        describe("#makeVerbatim", function () {
            it("makes a selector verbatim", function () {
                var v = gui_selector_1.GUISelector.makeVerbatim("foo");
                expect(v).to.have.property("value").equal("foo");
            });
            it("caches values", function () {
                var v = gui_selector_1.GUISelector.makeVerbatim("foo");
                expect(v).to.equal(gui_selector_1.GUISelector.makeVerbatim("foo"));
            });
        });
        describe("#fromDataSelector", function () {
            it("makes a selector", function () {
                var selector = "btw:foo";
                var namespaces = {
                    btw: "something",
                };
                var v = gui_selector_1.GUISelector.fromDataSelector(selector, namespaces);
                expect(v).to.have.property("value")
                    .equal(domutil_1.toGUISelector(selector, namespaces));
            });
            it("caches values", function () {
                var namespaces = {
                    "": "something",
                };
                var v = gui_selector_1.GUISelector.fromDataSelector("foo", namespaces);
                expect(v).to.equal(gui_selector_1.GUISelector.fromDataSelector("foo", namespaces));
            });
        });
    });
});
//# sourceMappingURL=gui-selector-test.js.map