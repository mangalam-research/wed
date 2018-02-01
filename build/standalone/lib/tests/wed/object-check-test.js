define(["require", "exports", "wed/object-check"], function (require, exports, object_check_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    describe("object-check", function () {
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
        var correct = {
            bar: {
                baz: 1,
            },
            bip: {
                toto: 1,
            },
            toto: { blah: "blah" },
        };
        describe("check", function () {
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
                assert.deepEqual(object_check_1.check(template, correct), {});
            });
        });
        describe("assertSummarily", function () {
            it("does not throw on correct input", function () {
                object_check_1.assertSummarily(template, correct);
            });
            it("throws on missing fields", function () {
                assert.throws(function () {
                    object_check_1.assertSummarily(template, {
                        bip: {
                            toto: 1,
                        },
                        toto: { blah: "blah" },
                    });
                }, Error, "missing option: bar");
            });
            it("throws on extra fields", function () {
                assert.throws(function () {
                    object_check_1.assertSummarily(template, {
                        bar: {
                            baz: 1,
                            unknown: 1,
                        },
                        bip: {
                            toto: 1,
                        },
                        toto: { blah: "blah" },
                    });
                }, Error, "extra option: bar.unknown");
            });
        });
        describe("assertExtensively", function () {
            it("does not throw on correct input", function () {
                object_check_1.assertExtensively(template, correct);
            });
            it("throws on errors", function () {
                assert.throws(function () {
                    object_check_1.assertExtensively(template, {
                        bip: {
                            toto: 1,
                            unknown: 2,
                        },
                        toto: { blah: "blah" },
                    });
                }, Error, "missing option: bar, extra option: bip.unknown");
            });
        });
    });
});
//# sourceMappingURL=object-check-test.js.map