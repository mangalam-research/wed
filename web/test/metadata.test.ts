import "chai";
import "chai-as-promised";
import "mocha";

const expect = chai.expect;

import { Metadata } from "../dashboard/metadata";

describe("Metadata", () => {
  const content = JSON.stringify({
    generator: "gen1",
    date: "date1",
    version: "ver1",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  const different = JSON.stringify({
    generator: "gen2",
    date: "date2",
    version: "ver2",
    namespaces: {
      foo: "foouri",
      bar: "baruri",
    },
  });

  const metadata1 = new Metadata("a", content);
  const metadata2 = new Metadata("b", content);
  const metadata3 = new Metadata("b", different);

  it("instances with same content have same sum",
     () => expect(metadata1.sum).to.equal(metadata2.sum));

  it("instances with different content have different sum",
     () => expect(metadata1.sum).to.not.equal(metadata3.sum));

  it("instances have a Metadata type",
     () => expect(metadata1.recordType).to.equal("Metadata"));

  it("to have a generator value which is extracted from the data",
     () => expect(metadata1.generator).to.equal("gen1"));

  it("to have a creationDate which is extracted from the data",
     () => expect(metadata1.creationDate).to.equal("date1"));

  it("to have a version which is extracted from the data",
     () => expect(metadata1.version).to.equal("ver1"));

  it("to have namespaces extracted from the data",
     () => expect(metadata1.namespaces).to.deep.equal({
       foo: "foouri",
       bar: "baruri",
     }));

  it("to have prefixNamespacePairs extracted from the data",
     () => expect(metadata1.prefixNamespacePairs).to.deep.equal([
       {
         prefix: "foo",
         uri: "foouri",
       },
       {
         prefix: "bar",
         uri: "baruri",
       },
     ]));
});
