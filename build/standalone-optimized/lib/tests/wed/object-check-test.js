define(["require", "exports", "module", "wed/object-check"], function (require, exports, module, object_check_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("object-check", function () {
        describe("check", function () {
            var template = {
                foo: false,
                bar: {
                    baz: true,
                    bin: false,
                },
                bip: {
                    baz: false,
                    bin: false,
                    toto: true,
                },
                toto: true,
            };
            it("reports extraneous fields", function () {
                var ret = object_check_1.check(template, {
                    unknown1: "blah",
                    unknown2: "blah",
                    bar: {
                        baz: 1,
                        unknown3: "blah",
                    },
                    bip: {
                        toto: [1],
                    },
                    unknown4: {
                        unknown5: true,
                    },
                    toto: 1,
                });
                assert.deepEqual(ret, {
                    extra: ["bar.unknown3", "unknown1", "unknown2", "unknown4"],
                });
            });
            it("reports missing fields", function () {
                var ret = object_check_1.check(template, {
                    bip: {
                        baz: 1,
                    },
                });
                assert.deepEqual(ret, {
                    missing: ["bar", "bip.toto", "toto"],
                });
            });
            it("reports missing fields and extraneous fields", function () {
                var ret = object_check_1.check(template, { unknown: 1 });
                assert.deepEqual(ret, {
                    missing: ["bar", "bip", "toto"],
                    extra: ["unknown"],
                });
            });
            it("reports no error", function () {
                var ret = object_check_1.check(template, {
                    bar: {
                        baz: 1,
                    },
                    bip: {
                        toto: 1,
                    },
                    toto: { blah: "blah" },
                });
                assert.deepEqual(ret, {});
            });
        });
    });
});

//# sourceMappingURL=object-check-test.js.map
