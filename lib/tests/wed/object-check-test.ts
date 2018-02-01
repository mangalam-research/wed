/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { assertExtensively, assertSummarily, check } from "wed/object-check";

const assert = chai.assert;

describe("object-check", () => {
  const template = {
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

  const correct = {
    bar: {
      baz: 1,
    },
    bip: {
      toto: 1,
    },
    toto: { blah: "blah" },
  };

  describe("check", () => {
    it("reports extraneous fields", () => {
      const ret = check(template, {
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

    it("reports missing fields", () => {
      const ret = check(template, {
        bip: {
          baz: 1,
        },
      });
      assert.deepEqual(ret, {
        missing: ["bar", "bip.toto", "toto"],
      });
    });

    it("reports missing fields and extraneous fields", () => {
      const ret = check(template, { unknown: 1 });
      assert.deepEqual(ret, {
        missing: ["bar", "bip", "toto"],
        extra: ["unknown"],
      });
    });

    it("reports no error", () => {
      assert.deepEqual(check(template, correct), {});
    });
  });

  describe("assertSummarily", () => {
    it("does not throw on correct input", () => {
      assertSummarily(template, correct);
    });

    it("throws on missing fields", () => {
      assert.throws(() => {
        assertSummarily(template, {
          bip: {
            toto: 1,
          },
          toto: { blah: "blah" },
        });
      }, Error, "missing option: bar");
    });

    it("throws on extra fields", () => {
      assert.throws(() => {
        assertSummarily(template, {
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

  describe("assertExtensively", () => {
    it("does not throw on correct input", () => {
      assertExtensively(template, correct);
    });

    it("throws on errors", () => {
      assert.throws(() => {
        assertExtensively(template, {
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
