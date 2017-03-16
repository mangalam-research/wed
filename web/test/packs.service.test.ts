import "chai";
import "chai-as-promised";
import "mocha";

chai.config.truncateThreshold = 0;
const expect = chai.expect;

import { db } from "../dashboard/store";

import { ChunksService } from "../dashboard/chunks.service";
import { Pack } from "../dashboard/pack";
import { PacksService } from "../dashboard/packs.service";

describe("PacksService", () => {
  let chunkService: ChunksService;
  let service: PacksService;
  let file: Pack;

  // tslint:disable-next-line:mocha-no-side-effect-code
  const metadata = JSON.stringify({
    generator: "gen1",
    date: "date1",
    version: "ver1",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  const packAUnserialized = {
    name: "foo",
    interchangeVersion: 1,
    schema: "aaa",
    metadata,
    mode: "generic",
    meta: "tei_meta",
  };

  // tslint:disable-next-line:mocha-no-side-effect-code
  const packA = JSON.stringify(packAUnserialized);

  before(() => {
    chunkService = new ChunksService();
    service = new PacksService(chunkService);
    return service.makeRecord("foo", packA)
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  describe("makeRecord", () => {
    it("records metadata into a chunk", () =>
       expect(chunkService.getRecordById(file.metadata!)
              .then((chunk) => chunk!.getData()))
       .to.eventually.equal(metadata));

    it("records schema into a chunk", () =>
       expect(chunkService.getRecordById(file.schema)
              .then((chunk) => chunk!.getData())).to.eventually.equal("aaa"));
  });

  describe("#getDownloadData", () => {
    // tslint:disable-next-line:no-any
    const records: any = {
      "all fields": {
        name: "all fields",
        interchangeVersion: 1,
        schema: "aaa",
        metadata,
        mode: "generic",
        meta: "tei_meta",
      },
      minimal: {
        name: "minimal",
        interchangeVersion: 1,
        schema: "aaa",
        metadata: undefined,
        mode: "generic",
        meta: undefined,
      },
    };

    for (const testCase of ["all fields", "minimal"]) {
      describe(`with ${testCase}`, () => {
        // tslint:disable-next-line:no-any
        let record: any;
        let downloadFile: Pack;
        before(() => {
          record = records[testCase];
          const stringified = JSON.stringify(record);
          return service.makeRecord(record.name, stringified)
            .then((newFile) => downloadFile = newFile)
            .then(() => service.updateRecord(downloadFile));
        });

        it("returns the right data", () =>
           service.getDownloadData(downloadFile)
           .then((data) => JSON.parse(data))
           .then((parsed) => expect(parsed)
                 // We have to stringify and parse again because ``undefined``
                 // is lost in the process. So ``parsed`` won't have any field
                 // with an undefined value.
                 .to.deep.equal(JSON.parse(JSON.stringify(record)))));

        it("round-trips with makeRecord", () =>
           service.getDownloadData(downloadFile)
           .then((data) => service.makeRecord("", data)));
      });
    }
  });
});
