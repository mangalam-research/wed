import { Chunk } from "./chunk";
import { ChunkedRecord } from "./chunked-record";

export type PrefixNamespacePair = { prefix: string, uri: string };
//tslint:disable-next-line:no-any
export type ParsedData = any;

export class Metadata extends ChunkedRecord {
  // Double underscore is a local convention that tells store.ts to not
  // store the field.
  // tslint:disable:variable-name
  private __parsed: Promise<ParsedData> | undefined;
  private __generator: Promise<string> | undefined;
  private __creationDate: Promise<string> | undefined;
  private __version: Promise<string> | undefined;
  private __namespaces: Promise<Record<string, string>> | undefined;
  private __prefixNamespacePairs: Promise<PrefixNamespacePair[]> | undefined;
  // tslint:enable:variable-name

  /**
   * Calling code is responsible for ensuring that ``chunk`` already exists in
   * the database.
   */
  constructor(name: string, chunk: string | Chunk) {
    super(name, chunk);
  }

  get recordType(): "Metadata" {
    return "Metadata";
  }

  set chunk(value: string) {
    if (this.chunk !== value) {
      // Barf! This is a problem with setter/getter inheritance in
      // TypeScript.
      Object.getOwnPropertyDescriptor(ChunkedRecord.prototype, "chunk")
        .set!.call(this, value);
      this.__parsed = undefined;
      this.__generator = undefined;
      this.__creationDate = undefined;
      this.__version = undefined;
      this.__namespaces = undefined;
      this.__prefixNamespacePairs = undefined;
    }
  }

  // This just calls up the super getter. We cannot have the setter above
  // without this getter. This is a limitation of JS. Barf barf barf!
  get chunk(): string {
    return Object.getOwnPropertyDescriptor(ChunkedRecord.prototype, "chunk")
      .get!.call(this);
  }

  private getParsed(): Promise<ParsedData> {
    if (this.__parsed === undefined) {
      this.__parsed = this.getData().then((data) => JSON.parse(data));
    }

    return this.__parsed;
  }

  getGenerator(): Promise<string> {
    if (this.__generator === undefined) {
      this.__generator = this.getParsed().then((parsed) => parsed.generator);
    }
    return this.__generator;
  }

  getCreationDate(): Promise<string> {
    if (this.__creationDate === undefined) {
      this.__creationDate =  this.getParsed().then((parsed) => parsed.date);
    }
    return this.__creationDate;
  }

  getVersion(): Promise<string> {
    if (this.__version === undefined) {
      this.__version = this.getParsed().then((parsed) => parsed.version);
    }

    return this.__version;
  }

  getNamespaces(): Promise<Record<string, string>> {
    if (this.__namespaces === undefined) {
      this.__namespaces = this.getParsed().then((parsed) => parsed.namespaces);
    }
    return this.__namespaces;
  }

  getPrefixNamespacePairs(): Promise<PrefixNamespacePair[]> {
    if (this.__prefixNamespacePairs === undefined) {
      this.__prefixNamespacePairs = this.getNamespaces()
        .then((namespaces) =>
              Object.keys(namespaces).map(
                (prefix) => ({ prefix, uri: namespaces[prefix] })));
    }

    return this.__prefixNamespacePairs;
  }
}
