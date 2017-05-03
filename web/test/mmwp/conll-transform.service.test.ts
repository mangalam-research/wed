import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { ChunksService } from "../../dashboard/chunks.service";
import { ProcessingService } from "../../dashboard/processing.service";
import { db } from "../../dashboard/store";
import { XMLFile } from "../../dashboard/xml-file";
import { XMLFilesService } from "../../dashboard/xml-files.service";
import { CoNLLTransformService,
         ProcessingError } from "../../mmwp/conll-transform.service";
import { DataProvider } from "../util";

// Interface that shows the private members of ConcordanceTransformService.  We
// cannot link it directly to ConcordanceTransformService because revealing
// private fields is not allowed by TS.
interface RevealedService {
  transform(doc: Document): string;
}

function revealService(s: CoNLLTransformService): RevealedService {
  // tslint:disable-next-line:no-any
  return s as any as RevealedService;
}

// tslint:disable-next-line:max-func-body-length
describe("CoNLLTransformService", () => {
  let provider: DataProvider;
  let xmlFilesService: XMLFilesService;
  let service: CoNLLTransformService;
  let rservice: RevealedService;
  let file: XMLFile;
  let bad: XMLFile;

  before(() => {
    provider = new DataProvider("/base/web/test/mmwp-data/");
    xmlFilesService = new XMLFilesService(new ChunksService());
    service = new CoNLLTransformService(new ProcessingService());
    rservice = revealService(service);

  });

  after(() => db.delete().then(() => db.open()));

  describe("#perform", () => {
    beforeEach(() =>
               provider.getText("annotated-file-1.xml")
               .then((data) => xmlFilesService.makeRecord("foo", data))
               .then((newFile) => file = newFile)
               .then(() => xmlFilesService.makeRecord("foo", "<div/>"))
               .then((newFile) => bad = newFile));

    it("converts a file", () => service.perform(file));

    it("errors if the file is incorrect", () =>
       expect(service.perform(bad))
       .to.eventually.be.rejectedWith(
         ProcessingError,
         `<p>tag not allowed here: {"ns":"","name":"div"}<\/p>
<p>tag required: {"ns":"http://mangalamresearch.org/ns/mmwp/doc",\
"name":"doc"}</p>`));
  });

  describe("#transform", () => {
    let doc: Document;
    beforeEach(() => provider.getDoc("annotated-file-1.xml").then((newDoc) => {
      doc = newDoc;
    }));

    it("transforms a document", () =>
       provider.getText("annotated-file-1-converted.txt").then((expected) => {
         const result = rservice.transform(doc);

         const lines = result.split("\n");
         const expectedLines = expected.split("\n")
           .filter((line) => line[0] !== "#");

         for (let ix = 0; ix < lines.length; ++ix) {
           const line = lines[ix];

           expect(ix).to.be.lessThan(expectedLines.length);
           const expectedLine = expectedLines[ix];

           expect(line).to.equal(expectedLine);
         }

         expect(lines).to.have.lengthOf(expectedLines.length);
       }));
  });
});
