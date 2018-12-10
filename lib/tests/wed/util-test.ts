/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { AnyName, DefaultNameResolver, Name, NameChoice, NsName } from "salve";

import * as util from "wed/util";

const assert = chai.assert;
const expect = chai.expect;

describe("util", () => {
  describe("stringToCodeSequence", () => {
    it("converts a string", () => {
      expect(util.stringToCodeSequence("abc")).to.equal("x61x62x63");
    });
  });

  describe("codeSequenceToString", () => {
    it("converts back a sequence", () => {
      expect(util.codeSequenceToString("x61x62x63")).to.equal("abc");
    });

    it("throws an error on incorrect strings", () => {
      expect(() => util.codeSequenceToString("x")).to.throw(Error);
      expect(() => util.codeSequenceToString("x61x")).to.throw(Error);
      expect(() => util.codeSequenceToString("x61q")).to.throw(Error);
      // We allow only lowercase hex.
      expect(() => util.codeSequenceToString("x6F")).to.throw(Error);
    });
  });

  describe("encodeDiff", () => {
    it("produces an empty diff for as-is cases", () => {
      expect(util.encodeDiff("abc", "abc")).to.equal("");
    });

    it("produces a diff for cases that are not as-is", () => {
      expect(util.encodeDiff("Abc", "abc")).to.equal("u1");
      expect(util.encodeDiff("abC", "abc")).to.equal("g2u1");
      expect(util.encodeDiff("abCdexFGh", "abcdexfgh"))
        .to.equal("g2u1g3u2");

      // The treatment of "C" cannot be handled with the u operation because the
      // diff removes "abc" and then adds "C", and "abc" in uppercase is not
      // "C". The algorithm *could* be modified to handle this, but this is an a
      // case that won't actually happen with "real" data, and the few rare
      // cases that happens in languages other than English are not worth the
      // development expense.
      expect(util.encodeDiff("CdexFGh", "abcdexfgh"))
        .to.equal("m3px43g3u2");
    });
  });

  describe("decodeDiff", () =>  {
    it("returns name unchanged for empty diff", () => {
      expect(util.decodeDiff("abc", "")).to.equal("abc");
    });

    it("decodes diffs properly", () => {
      expect(util.decodeDiff("abc", "u1")).to.equal("Abc");
      expect(util.decodeDiff("abc", "g2u1")).to.equal("abC");
      expect(util.decodeDiff("abCdexFGh", "g2u1g3u2")).to.equal("abCdexFGh");
    });

    it("throws on bad input", () => {
      expect(() => util.decodeDiff("abc", "q1")).to.throw(Error);
      expect(() => util.decodeDiff("abc", "g2uz")).to.throw(Error);
    });
  });

  describe("decodeAttrName", () => {
    it("without namespace prefix", () => {
      expect(util.decodeAttrName("data-wed-blah-"))
        .to.deep.equal({ name: "blah", qualifier: undefined });
    });

    it("with a namespace prefix", () => {
      expect(util.decodeAttrName("data-wed-btw---blah-"))
        .to.deep.equal({ name: "btw:blah", qualifier: undefined });
    });

    it("with dashes in the name", () => {
      expect(
        util.decodeAttrName("data-wed-btw---blah-one--two----three-----four-"))
        .to.deep.equal({ name: "btw:blah-one--two---three----four",
                         qualifier: undefined });
    });

    it("with qualifier", () => {
      expect(util.decodeAttrName("data-wed--ns-blah-"))
        .to.deep.equal({ name: "blah", qualifier: "ns" });
    });

    it("with a name that cannot be represented as-is", () => {
      expect(util.decodeAttrName("data-wed-moo---abc----def-u3g2u1"))
        .to.deep.equal({ name: "MOO:aBc---def", qualifier: undefined });
    });

    it("throws on bad input", () => {
      expect(() =>  util.decodeAttrName("data-moo--ns-blah-")).to.throw(Error);
      expect(() =>  util.decodeAttrName("data-wed--ns-blah")).to.throw(Error);
      expect(() =>  util.decodeAttrName("data-wed--ns-blah-x1"))
        .to.throw(Error);
    });
  });

  describe("encodeAttrName", () => {
    it("without namespace prefix", () => {
      assert.equal(util.encodeAttrName("blah"), "data-wed-blah-");
    });

    it("with a namespace prefix", () => {
      assert.equal(util.encodeAttrName("btw:blah"), "data-wed-btw---blah-");
    });

    it("with dashes in the name", () => {
      assert.equal(util.encodeAttrName("btw:blah-one--two---three----four"),
                   "data-wed-btw---blah-one--two----three-----four-");
    });

    it("with a name that cannot be represented as-is", () => {
      assert.equal(util.encodeAttrName("MOO:aBc---def"),
                   "data-wed-moo---abc----def-u3g2u1");
    });

    it("with qualifier", () => {
      assert.equal(util.encodeAttrName("blah", "ns"), "data-wed--ns-blah-");
    });
  });

  describe("classFromOriginalName", () => {
    it("no namespace", () => {
      assert.equal(util.classFromOriginalName("li", { "": "" }),
                   "._local_li._xmlns_._real");
    });

    it("match all", () => {
      assert.equal(util.classFromOriginalName("*", {}), "._real");
    });

    it("with namespace", () => {
      assert.equal(util.classFromOriginalName("btw:foo", {
        // tslint:disable-next-line:no-http-string
        btw: "http://mangalamresearch.org/ns/btw-storage",
      }), "._local_foo.\
_xmlns_http\\:\\/\\/mangalamresearch\\.org\\/ns\\/btw-storage._real");
    });
  });

  describe("distFromDeltas", () => {
    it("works", () => {
      assert.equal(util.distFromDeltas(0, 0), 0);
      assert.equal(util.distFromDeltas(3, 4), 5);
    });
  });

  describe("distFromRect", () => {
    it("returns 0 when point inside", () => {
      assert.equal(util.distFromRect(5, 5, 0, 0, 10, 10), 0);
    });

    it("returns 0 when point at corners", () => {
      assert.equal(util.distFromRect(0, 0, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(0, 10, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(10, 0, 0, 0, 10, 10), 0);
      assert.equal(util.distFromRect(10, 10, 0, 0, 10, 10), 0);
    });

    it("returns dist from top when point above", () => {
      assert.equal(util.distFromRect(4, -5, 0, 0, 10, 10), 5);
    });

    it("returns dist from bottom when point below", () => {
      assert.equal(util.distFromRect(4, 15, 0, 0, 10, 10), 5);
    });

    it("returns dist from left when point left", () => {
      assert.equal(util.distFromRect(-5, 4, 0, 0, 10, 10), 5);
    });

    it("returns dist from right when point right", () => {
      assert.equal(util.distFromRect(15, 4, 0, 0, 10, 10), 5);
    });

    it("returns min dist when point at corner", () => {
      assert.equal(util.distFromRect(-5, -12, 0, 0, 10, 10), 13);
      assert.equal(util.distFromRect(13, -4, 0, 0, 10, 10), 5);
      assert.equal(util.distFromRect(-4, 13, 0, 0, 10, 10), 5);
      assert.equal(util.distFromRect(15, 22, 0, 0, 10, 10), 13);
    });
  });

  describe("convertPatternObj", () => {
    let nr: DefaultNameResolver;
    before(() => {
      nr = new DefaultNameResolver();
      nr.definePrefix("", "default");
      nr.definePrefix("prefix", "uri");
      nr.definePrefix("prefix2", "uri2");
    });

    it("converts a Name", () => {
      const name = new Name("", "uri", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:name");
    });

    it("converts a Name with an unprefixed namespace", () => {
      const name = new Name("", "unprefixed", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "{unprefixed}name");
    });

    it("converts a Name with a default namespace", () => {
      const name = new Name("", "default", "name");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "name");
    });

    it("converts an NsName", () => {
      const name = new NsName("", "uri");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "prefix:*");
    });

    it("converts an NsName with a default namespace", () => {
      const name = new NsName("", "default");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "*");
    });

    it("converts an NsName with an unprefixed namespace", () => {
      const name = new NsName("", "unprefixed");
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "{unprefixed}*");
    });

    it("converts an NsName with exception", () => {
      const name = new NsName("", "uri", new Name("", "uri", "name"));
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "prefix:* except (prefix:name)");
    });

    it("converts an AnyName", () => {
      const name = new AnyName("");
      assert.equal(util.convertPatternObj(name.toObject(), nr), "*:*");
    });

    it("converts an AnyName with exception", () => {
      const name = new AnyName("", new Name("", "uri", "name"));
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "*:* except (prefix:name)");
    });

    it("converts a NameChoice", () => {
      const name = new NameChoice("", new Name("", "uri", "name"),
                                  new Name("", "uri2", "name2"));
      assert.equal(util.convertPatternObj(name.toObject(), nr),
                   "(prefix:name) or (prefix2:name2)");
    });
  });
});

//  LocalWords:  requirejs util chai classFromOriginalName namespace
//  LocalWords:  distFromDeltas btw distFromRect li Dubeau MPL
//  LocalWords:  Mangalam RequireJS
