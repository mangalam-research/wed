import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { db } from "../dashboard/store";

import { MetadataService } from "../dashboard/metadata.service";
import { Pack } from "../dashboard/pack";
import { PacksService } from "../dashboard/packs.service";
import { SchemasService } from "../dashboard/schemas.service";

describe("PacksService", () => {
  let service: PacksService;
  let file: Pack;
  let schemasService: SchemasService;
  let metadataService: MetadataService;

  const metadata = JSON.stringify({
    generator: "gen1",
    date: "date1",
    version: "ver1",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  const packA = JSON.stringify({
    interchangeVersion: 1,
    schema: "aaa",
    metadata,
    mode: "generic",
    meta: "tei_meta",
  });

  before(() => {
    metadataService = new MetadataService();
    schemasService = new SchemasService();
    service = new PacksService(schemasService, metadataService);
    return service.makeRecord("foo", packA)
      .then((newFile) => file = newFile)
      .then(() => service.updateRecord(file));
  });

  after(() => db.delete().then(() => db.open()));

  describe("makeRecord", () => {
    it("records data into the metadata service", () =>
       expect(metadataService.getRecordByName("@@foo"))
       .to.eventually.have.property("generator", "gen1"));

    it("records data into the schemas service", () =>
       expect(schemasService.getRecordByName("@@foo"))
       .to.eventually.have.property("data", "aaa"));

    it("does not record data into the metadata service, when not needed", () =>
       service.makeRecord("bar", packA)
       .then((record) => expect(metadataService.getRecordByName("@@foo"))
             .to.eventually.have.property("id", parseInt(record.metadata, 10)))
       .then(() => expect(metadataService.getRecordByName("@@bar"))
             .to.eventually.be.undefined));

    it("does not record data into the schemas service, when not needed", () =>
       service.makeRecord("bar", packA)
       .then((record) => expect(schemasService.getRecordByName("@@foo"))
             .to.eventually.have.property("id", parseInt(record.schema, 10)))
       .then(() => expect(schemasService.getRecordByName("@@bar"))
             .to.eventually.be.undefined));

  });
});
