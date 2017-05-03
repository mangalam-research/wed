import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { ChunksService } from "../../dashboard/chunks.service";
import { ProcessingService } from "../../dashboard/processing.service";
import { db } from "../../dashboard/store";
import { XMLFile } from "../../dashboard/xml-file";
import { XMLFilesService } from "../../dashboard/xml-files.service";
import { ConcordanceTransformService,
         ProcessingError } from "../../mmwp/concordance-transform.service";
import { DataProvider } from "../util";

// We use innerHTML a lot for testing purposes.
// tslint:disable:no-inner-html

// tslint:disable:no-any
type Title = any;
type CheckError = any;
// tslint:enable:no-any

// Interface that shows the private members of ConcordanceTransformService.  We
// cannot link it directly to ConcordanceTransformService because revealing
// private fields is not allowed by TS.
interface RevealedService {
  gatherTitles(doc: Document, titles: Record<string, Title>,
               titleToLines: Record<string, Element[]>): void;
  transformTitle(titleInfo: Title, lines: Element[]): Document | CheckError[];
  checkCit(cit: Element): CheckError[];
  makeCitFromLine(doc: Document, line: Element,
                  citId: number): Element;
  convertMarkedToWord(doc: Document, cit: Element): void;
  cleanText(node: Node): void;
  breakIntoWords(doc: Document, cit: Element): void;
  cleanDashes(cit: Element, line: Element): void;
}

function revealService(s: ConcordanceTransformService): RevealedService {
  // tslint:disable-next-line:no-any
  return s as any as RevealedService;
}

function addErrantAvagraha(doc: Document): void {
  const line = doc.getElementsByTagName("line")[0];
  line.appendChild(doc.createTextNode("' "));
}

// tslint:disable-next-line:max-func-body-length
describe("ConcordanceTransformService", () => {
  let provider: DataProvider;
  let xmlFilesService: XMLFilesService;
  let service: ConcordanceTransformService;
  let file: XMLFile;
  let bad: XMLFile;
  let rservice: RevealedService;

  before(() => {
    provider = new DataProvider("/base/web/test/mmwp-data/");
    xmlFilesService = new XMLFilesService(new ChunksService());
    service = new ConcordanceTransformService(new ProcessingService(),
                                              xmlFilesService);
    rservice = revealService(service);
  });

  after(() => db.delete().then(() => db.open()));

  describe("#perform", () => {
    const resultNames = [
      // tslint:disable-next-line:max-line-length
      "Abhidharmakośabhāṣya_word_sajn_and_word_sajni_and_word_sajnak_1029_0_0_1_within_lessdoc_titleAbhidharmakosabhaya_greater_154_51_51_buddhsktnewton_2.xml",
      // tslint:disable-next-line:max-line-length
      "Moo_word_sajn_and_word_sajni_and_word_sajnak_1029_0_0_1_within_lessdoc_titleAbhidharmakosabhaya_greater_154_51_51_buddhsktnewton_2.xml",
    ];

    function getAllFiles(): Promise<(XMLFile | undefined)[]> {
      return Promise.all(
        resultNames.map((name) => xmlFilesService.getRecordByName(name)));
    }

    beforeEach(() =>
      provider.getText("multiple-titles-1.xml")
      .then((data) => xmlFilesService.makeRecord("foo", data))
      .then((newFile) => file = newFile)
      .then(() => xmlFilesService.makeRecord("foo", "<div/>"))
      .then((newFile) => bad = newFile));

    // We need to reset after each test because otherwise
    // we get overwrite errors.
    afterEach(() => db.delete().then(() => db.open()));

    it("runs without error", () => service.perform(file));

    it("names the resulting files properly", () =>
      service.perform(file).then((results) => {
        expect(results.map((x) => x.name))
          .to.have.members(resultNames);
      }));

    it("saves the files", () =>
       expect(getAllFiles()).to.eventually.deep.equal([undefined, undefined])
       .then(() => service.perform(file))
       .then(() => expect(getAllFiles()).to.eventually.not.include(undefined)));

    it("raises an error if any file is going to be overwritten", () =>
       service.perform(file)
       .then(() => expect(service.perform(file))
             .to.eventually.be.rejectedWith(ProcessingError,
                                            /^This would overwrite: /)));

    it("errors if the file is incorrect", () =>
       expect(service.perform(bad))
       .to.eventually.be.rejectedWith(
         ProcessingError,
         "<p>tag not allowed here: {\"ns\":\"\",\"name\":\"div\"}<\/p>\n" +
           "<p>tag required: {\"ns\":\"\",\"name\":\"concordance\"}</p>"));
  });

  describe("#gatherTitles", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("gathers titles", () => {
      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);

      rservice.gatherTitles(doc, titles, titleToLines);
      expect(titles).to.have.keys(["Abhidharmakośabhāṣya", "Moo"]);
      expect(titleToLines).to.have.keys(["Abhidharmakośabhāṣya", "Moo"]);
      expect(titleToLines).to.have.property("Abhidharmakośabhāṣya")
        .with.lengthOf(2);
      expect(titleToLines).to.have.property("Moo").with.lengthOf(2);

      const akb = titles["Abhidharmakośabhāṣya"];
      expect(akb.title).to.equal("Abhidharmakośabhāṣya");
      expect(akb.genre).to.equal("śāstra");
      expect(akb.author).to.equal("Vasubandhu");
      expect(akb.tradition).to.equal("abhidharma");
      expect(akb.school).to.equal("N/A");
      expect(akb.period).to.equal("classical");

      const moo = titles["Moo"];
      expect(moo.title).to.equal("Moo");
      expect(moo.genre).to.equal("sūtra");
      expect(moo.author).to.equal("Mooplex");
      expect(moo.tradition).to.equal("milk");
      expect(moo.school).to.equal("pasteurized");
      expect(moo.period).to.equal("old");
    });

    it("throws a processing error if the titles are inconsistent", () => {
      const ref = doc.getElementsByTagName("ref")[0];
      ref.textContent = ref.textContent; // Drop all tags.
      // Skip the 1st part because that's not something we need.
      const parts = ref.textContent!.split(",").slice(1);
      for (let ix = 0; ix < parts.length; ++ix) {
        parts[ix] = parts[ix].trim();
      }

      const fieldNames = [undefined, "genres", "authors", "traditions",
                          "schools", "periods"];
      expect(fieldNames).to.have.lengthOf(parts.length);
      for (let ix = 1; ix < parts.length; ++ix) {
        const fieldName = fieldNames[ix];
        const corrupt = parts.slice();
        corrupt[ix] = "bad";
        ref.textContent = "ignored," + corrupt.join(",");

        const titles: Record<string, Title> = Object.create(null);
        const titleToLines: Record<string, Element[]> = Object.create(null);
        expect(() => {
          rservice.gatherTitles(doc, titles, titleToLines);
        }).to.throw(ProcessingError,
                    `the title Abhidharmakośabhāṣya appears more than once, \
with differing values: ${fieldName} differ: bad vs ${parts[ix]}`);
      }
    });

    it("throws a processing error if a line is missing a ref", () => {
      const ref = doc.getElementsByTagName("ref")[0];
      const line = ref.parentNode! as HTMLElement;
      line.removeChild(ref);
      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);
      expect(() => {
        rservice.gatherTitles(doc, titles, titleToLines);
      }).to.throw(ProcessingError, `line without a ref: ${line.outerHTML}`);
    });

    it("throws a processing error if a ref lacks expected parts", () => {
      const ref = doc.getElementsByTagName("ref")[0];
      ref.textContent = "";
      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);
      expect(() => {
        rservice.gatherTitles(doc, titles, titleToLines);
      }).to.throw(ProcessingError, `ref does not contain 7 parts: `);
    });
  });

  describe("#transformTitle", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("converts a title", () => {
      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);
      rservice.gatherTitles(doc, titles, titleToLines);
      const result =
        rservice.transformTitle(titles["Moo"], titleToLines["Moo"]) as Document;
      expect(result).to.be.instanceof(Document);

      const root = result.documentElement;
      expect(root).to.have.property("tagName", "doc");
      expect(root).to.have.deep.property("attributes.version.value", "1");
      expect(root).to.have.deep.property("attributes.title.value", "Moo");
      expect(root).to.have.deep.property("attributes.genre.value", "sūtra");
      expect(root).to.have.deep.property("attributes.author.value", "Mooplex");
      expect(root).to.have.deep.property("attributes.tradition.value", "milk");
      expect(root).to.have.deep.property("attributes.school.value",
                                         "pasteurized");
      expect(root).to.have.deep.property("attributes.period.value", "old");

      expect(root).to.have.property("childNodes").with.lengthOf(2);
      const first = root.firstElementChild!;
      expect(first).to.have.deep.property("attributes.id.value", "1");

      const firstExpected = ` \
<word lem="yāvad">yāvan</word> \
<word lem="nīla">nīla-</word> <word>-pīta-</word>\
<word lem="dīrgha">-dīrgha-</word> \
<word lem="hrasva">-hrasva-</word> \
<word>-stri-</word><word>-puruṣa-</word><word>-mitra-</word>\
<word lem="amitra">-amitra-</word> \
<word lem="sukha">-sukha-</word> \
<word lem="duḥkha">-duḥkha-</word> \
<word lem="adi">-adi-</word> \
<word lem="nimitta">-nimitta-</word> \
<word lem="udgrahaṇa">-dgrahaṇam</word> \
<word lem="adas">asau</word> \
<word lem="saṃjñā">saṃjñā-</word> \
<word lem="skandha">-skandhaḥ</word> \
<word>|</word> <word>sa</word> <word lem="punar">punar</word> \
<word lem="bhid">bhidyamānaḥ</word> \
<word>ṣaṭsaṃjñākāyā</word> <word lem="vedanāvat">vedanāvat</word> \
<word>||</word> \
<word lem="catur">caturbhyo</word> \
<word lem="'nye">'nye</word> \
<word lem="tu">tu</word> \
<word lem="saṃskāra">saṃskāra-</word> \
<word lem="skandha">-skandhaḥ</word> \
<word>rūpavedanāsaṃjñāvijñānebhyaścatubbryo</word> \
<word lem="'nye">'nye</word> \
<word lem="tu">tu</word> `;
      expect(first).to.have.deep.property("innerHTML").equal(firstExpected);

      const second = first.nextElementSibling;
      expect(second).to.have.deep.property("attributes.id.value", "2");
    });

    it("errors on errant avagraha", () => {
      addErrantAvagraha(doc);
      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);
      rservice.gatherTitles(doc, titles, titleToLines);
      const result =
        rservice.transformTitle(
          titles["Abhidharmakośabhāṣya"],
          titleToLines["Abhidharmakośabhāṣya"]) as CheckError;
      expect(result).to.have.lengthOf(1);
      expect(result[0])
        .to.have.property("message").matches(/^errant avagraha in:/);
    });
  });

  describe("#makeCitFromLine", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("does not create @ref when page.number is absent", () => {
      const line = doc.getElementsByTagName("line")[0];
      expect(line.querySelector("page.number")).to.be.null;
      const cit = rservice.makeCitFromLine(doc, line, 1);
      expect(cit.getAttribute("ref")).to.be.null;
    });

    it("creates @ref when page.number is present", () => {
      const line = doc.getElementsByTagName("line")[0];
      expect(line.querySelector("page\\.number")).to.be.null;
      const pn = doc.createElement("page.number");
      pn.textContent = "999";
      line.appendChild(pn);
      expect(line.querySelector("page\\.number")).to.not.be.null;
      const cit = rservice.makeCitFromLine(doc, line, 1);
      expect(cit).to.have.deep.property("attributes.ref.value", "999");
    });

    it("sets @id to the value passed", () => {
      const line = doc.getElementsByTagName("line")[0];
      const cit = rservice.makeCitFromLine(doc, line, 222);
      expect(cit).to.have.deep.property("attributes.id.value", "222");
    });

    it("preserves text", () => {
      const line = doc.createElement("line");
      line.textContent = "something";
      const cit = rservice.makeCitFromLine(doc, line, 222);
      expect(cit).to.have.property("textContent", "something");
    });

    it("removes ref and page.number element", () => {
      const line = doc.createElement("line");
      line.innerHTML = `a<ref>something</ref>\
<page.number>something</page.number>b<ref>something else</ref>\
<page.number>foo</page.number>c`;
      const cit = rservice.makeCitFromLine(doc, line, 222);
      expect(cit).to.have.property("textContent", "abc");
      expect(cit).to.have.property("firstElementChild").be.null;
    });

    it("leaves notvariant and normalised as they are", () => {
      const line = doc.createElement("line");
      line.innerHTML = `a<notvariant>something</notvariant>\
<normalised>something</normalised>b<notvariant>something else</notvariant>\
<normalised>foo</normalised>c`;
      const cit = rservice.makeCitFromLine(doc, line, 222);
      expect(cit).to.have.property("innerHTML", line.innerHTML);
    });

    it("unwraps other elements", () => {
      const line = doc.createElement("line");
      line.innerHTML = `a<foo>b</foo>c<bar>d</bar>e`;
      const cit = rservice.makeCitFromLine(doc, line, 222);
      expect(cit).to.have.property("innerHTML", "abcde");
    });
  });

  describe("#convertMarkedToWord", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("converts marked words to word elements", () => {
      const line = doc.createElement("line");
      line.innerHTML = `a<notvariant>something</notvariant>\
<normalised orig="a">something</normalised>b\
<notvariant>something else</notvariant>\
<normalised orig="b">foo</normalised>c`;
      const cit = rservice.makeCitFromLine(doc, line, 222);
      rservice.convertMarkedToWord(doc, cit);
      const expected = `a<word lem="something">something</word>\
<word lem="something">a</word>b\
<word lem="something else">something else</word>\
<word lem="foo">b</word>c`;
      expect(cit).to.have.property("innerHTML", expected);
    });
  });

  describe("#cleanText", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("performs a DOM normalization", () => {
      const cit = doc.createElement("cit");
      const word = doc.createElement("word");
      cit.appendChild(word);
      word.appendChild(doc.createTextNode("foo"));
      word.appendChild(doc.createTextNode("bar"));
      cit.appendChild(doc.createTextNode(""));

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("foobar");
      expect(cit).to.have.property("childNodes").with.lengthOf(1);
      expect(word).to.have.property("childNodes").with.lengthOf(1);
    });

    it("converts / to |", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>/</word>/";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("||");
    });

    it("strips **", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>**</word>**";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("");
    });

    it("removes spaces before and after dashes", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word> - a - </word>- b -";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("-a--b-");
    });

    it("converts multi dashes to a single one", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "--a - - b - - - c";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("-a-b-c");
    });

    it("converts multiple spaces to a single space", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>  a  </word>  b  ";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal(" a  b ");
    });

    it("removes text nodes that become empty", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>a</word>**";

      rservice.cleanText(cit);
      expect(cit).to.have.property("textContent").equal("a");
      expect(cit).to.have.property("childNodes").with.lengthOf(1);
    });
  });

  describe("#breakIntoWords", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("breaks the citation into words", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML =
        ` something-else-s <word>or </word> <word>other</word> words \
<word>foo-</word><word>-bar</word> and more `;

      rservice.breakIntoWords(doc, cit);

      const expected =
        ` <word>something-</word><word>-else-</word><word>-s</word> \
<word>or </word> <word>other</word> <word>words</word> \
<word>foo-</word><word>-bar</word> <word>and</word> <word>more</word> `;
      expect(cit).to.have.property("innerHTML").equal(expected);
    });
  });

  describe("#cleanDashes", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("throws on unexpected element", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<foo/>";
      expect(() => {
        rservice.cleanDashes(cit, cit);
      }).to.throw(Error, "unexpected element: foo");
    });

    it("throws on word with final dash but no following sibling", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>foo-</word>";
      expect(() => {
        rservice.cleanDashes(cit, cit);
      }).to.throw(Error,
                  /^word with trailing dash has no following sibling:/);
    });

    it("throws on word with initial dash but no preceding sibling", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = "<word>-foo</word>";
      expect(() => {
        rservice.cleanDashes(cit, cit);
      }).to.throw(Error,
                  /^word with leading dash has no preceding sibling:/);
    });

    it("cleans the dashes", () => {
      const cit = doc.createElement("cit");
      cit.innerHTML = `\
<word>blah</word><word>-foo-</word><word>bar</word>\
<word>bwip-</word><word>fwip-</word><word>moo</word>\
<word>aaa</word><word>-bbb</word><word>-ccc</word>\
`;
      rservice.cleanDashes(cit, cit);
      expect(cit).to.have.property("innerHTML").equal(`\
<word>blah-</word><word>-foo-</word><word>-bar</word>\
<word>bwip-</word><word>-fwip-</word><word>-moo</word>\
<word>aaa-</word><word>-bbb-</word><word>-ccc</word>`);
    });
  });

  describe("#checkCit", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("multiple-titles-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("reports errant avagrahas", () => {
      addErrantAvagraha(doc);
      // We pass a line element rather than a cit element. By the time checkCit
      // is called in the service, it gets a cit element but passing a line does
      // not matter.
      const result = rservice.checkCit(doc.getElementsByTagName("line")[0]);
      expect(result).to.have.lengthOf(1);
      expect(result[0])
        .to.have.property("message").matches(/^errant avagraha in:/);
    });

    it("reports no error if the input is fine", () => {
      // We pass a line element rather than a cit element. By the time checkCit
      // is called in the service, it gets a cit element but passing a line does
      // not matter.
      const result = rservice.checkCit(doc.getElementsByTagName("line")[0]);
      expect(result).to.have.lengthOf(0);
    });
  });

});
