/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
requirejs.config({
    baseUrl: __dirname + '/../../../build/standalone/lib',
    nodeRequire: require
});
var object_check = requirejs("wed/object_check");
var chai = require("chai");
var assert = chai.assert;

describe("object_check", function () {
    describe("check", function () {
        var template = {
            foo: false,
            bar: {
                baz: true,
                bin: false
            },
            bip: {
                baz: false,
                bin: false,
                toto: true
            },
            toto: true
        };

        it("reports extraneous fields", function () {
            var ret = object_check.check(template, {
                unknown1: "blah",
                unknown2: "blah",
                bar: {
                    baz: 1,
                    unknown3: "blah"
                },
                bip: {
                    toto: [1]
                },
                "unknown4": {
                    "unknown5": true
                },
                toto: 1
            });
            assert.deepEqual(ret, {
                extra: ["bar.unknown3", "unknown1", "unknown2", "unknown4"]
            });
        });

        it("reports missing fields", function () {
            var ret = object_check.check(template, {
                bip: {
                    baz: 1
                }
            });
            assert.deepEqual(ret, {
                missing: ["bar", "bip.toto", "toto"]
            });
        });

        it("reports missing fields and extraneous fields", function () {
            var ret = object_check.check(template, {unknown: 1});
            assert.deepEqual(ret, {
                missing: ["bar", "bip", "toto"],
                extra: ["unknown"]
            });
        });

        it("reports no error", function () {
            var ret = object_check.check(template, {
                bar: {
                    baz: 1
                },
                bip: {
                    toto: 1
                },
                toto: { blah: "blah" }
            });
            assert.deepEqual(ret, {});
        });

    });
});
