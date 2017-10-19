/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "salve", "wed/util"], function (require, exports, module, salve_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("util", function () {
        describe("decode attribute name", function () {
            it("no prefix", function () {
                assert.equal(util.decodeAttrName("data-wed-blah"), "blah");
            });
            it("prefix", function () {
                assert.equal(util.decodeAttrName("data-wed-btw---blah"), "btw:blah");
            });
            it("prefix dashes", function () {
                assert.equal(util.decodeAttrName("data-wed-btw---blah-one--two----three-----four"), "btw:blah-one--two---three----four");
            });
        });
        describe("encode attribute name", function () {
            it("no prefix", function () {
                assert.equal(util.encodeAttrName("blah"), "data-wed-blah");
            });
            it("prefix", function () {
                assert.equal(util.encodeAttrName("btw:blah"), "data-wed-btw---blah");
            });
            it("prefix dashes", function () {
                assert.equal(util.encodeAttrName("btw:blah-one--two---three----four"), "data-wed-btw---blah-one--two----three-----four");
            });
        });
        describe("classFromOriginalName", function () {
            it("no namespace", function () {
                assert.equal(util.classFromOriginalName("li", { "": "" }), "._local_li._xmlns_._real");
            });
            it("match all", function () {
                assert.equal(util.classFromOriginalName("*", {}), "._real");
            });
            it("with namespace", function () {
                assert.equal(util.classFromOriginalName("btw:foo", {
                    // tslint:disable-next-line:no-http-string
                    btw: "http://mangalamresearch.org/ns/btw-storage",
                }), "._local_foo.\
_xmlns_http\\:\\/\\/mangalamresearch\\.org\\/ns\\/btw-storage._real");
            });
        });
        describe("distFromDeltas", function () {
            it("works", function () {
                assert.equal(util.distFromDeltas(0, 0), 0);
                assert.equal(util.distFromDeltas(3, 4), 5);
            });
        });
        describe("distFromRect", function () {
            it("returns 0 when point inside", function () {
                assert.equal(util.distFromRect(5, 5, 0, 0, 10, 10), 0);
            });
            it("returns 0 when point at corners", function () {
                assert.equal(util.distFromRect(0, 0, 0, 0, 10, 10), 0);
                assert.equal(util.distFromRect(0, 10, 0, 0, 10, 10), 0);
                assert.equal(util.distFromRect(10, 0, 0, 0, 10, 10), 0);
                assert.equal(util.distFromRect(10, 10, 0, 0, 10, 10), 0);
            });
            it("returns dist from top when point above", function () {
                assert.equal(util.distFromRect(4, -5, 0, 0, 10, 10), 5);
            });
            it("returns dist from bottom when point below", function () {
                assert.equal(util.distFromRect(4, 15, 0, 0, 10, 10), 5);
            });
            it("returns dist from left when point left", function () {
                assert.equal(util.distFromRect(-5, 4, 0, 0, 10, 10), 5);
            });
            it("returns dist from right when point right", function () {
                assert.equal(util.distFromRect(15, 4, 0, 0, 10, 10), 5);
            });
            it("returns min dist when point at corner", function () {
                assert.equal(util.distFromRect(-5, -12, 0, 0, 10, 10), 13);
                assert.equal(util.distFromRect(13, -4, 0, 0, 10, 10), 5);
                assert.equal(util.distFromRect(-4, 13, 0, 0, 10, 10), 5);
                assert.equal(util.distFromRect(15, 22, 0, 0, 10, 10), 13);
            });
        });
        describe("convertPatternObj", function () {
            var nr;
            before(function () {
                nr = new salve_1.NameResolver();
                nr.definePrefix("", "default");
                nr.definePrefix("prefix", "uri");
                nr.definePrefix("prefix2", "uri2");
            });
            it("converts a Name", function () {
                var name = new salve_1.Name("", "uri", "name");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:name");
            });
            it("converts a Name with an unprefixed namespace", function () {
                var name = new salve_1.Name("", "unprefixed", "name");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "{unprefixed}name");
            });
            it("converts a Name with a default namespace", function () {
                var name = new salve_1.Name("", "default", "name");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "name");
            });
            it("converts an NsName", function () {
                var name = new salve_1.NsName("", "uri");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:*");
            });
            it("converts an NsName with a default namespace", function () {
                var name = new salve_1.NsName("", "default");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "*");
            });
            it("converts an NsName with an unprefixed namespace", function () {
                var name = new salve_1.NsName("", "unprefixed");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "{unprefixed}*");
            });
            it("converts an NsName with exception", function () {
                var name = new salve_1.NsName("", "uri", new salve_1.Name("", "uri", "name"));
                assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:* except (prefix:name)");
            });
            it("converts an AnyName", function () {
                var name = new salve_1.AnyName("");
                assert.equal(util.convertPatternObj(name.toObject(), nr), "*:*");
            });
            it("converts an AnyName with exception", function () {
                var name = new salve_1.AnyName("", new salve_1.Name("", "uri", "name"));
                assert.equal(util.convertPatternObj(name.toObject(), nr), "*:* except (prefix:name)");
            });
            it("converts a NameChoice", function () {
                var name = new salve_1.NameChoice("", [
                    new salve_1.Name("", "uri", "name"),
                    new salve_1.Name("", "uri2", "name2"),
                ]);
                assert.equal(util.convertPatternObj(name.toObject(), nr), "(prefix:name) or (prefix2:name2)");
            });
        });
    });
});
//  LocalWords:  requirejs util chai classFromOriginalName namespace
//  LocalWords:  distFromDeltas btw distFromRect li Dubeau MPL
//  LocalWords:  Mangalam RequireJS

//# sourceMappingURL=util-test.js.map
