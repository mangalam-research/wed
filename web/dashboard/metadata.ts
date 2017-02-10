import md5 = require("blueimp-md5");

import { RecordCommon } from "./record-common";

export class Metadata extends RecordCommon {
  public data: string;
  public sum: string;

  // Double underscore is a local convention that tells store.ts to not
  // store the field.
  private __parsed: any; // tslint:disable-line:variable-name

  constructor(name: string, data: string) {
    super(name);
    this.data = data;
    this.sum = md5(data);
  }

  get recordType(): "Metadata" {
    return "Metadata";
  }

  private get parsed(): any {
    if (!this.__parsed) {
      this.__parsed = JSON.parse(this.data);
    }

    return this.__parsed;
  }

  get generator(): string {
    return this.parsed.generator;
  }

  get creationDate(): string {
    return this.parsed.date;
  }

  get version(): string {
    return this.parsed.version;
  }

  get namespaces(): string {
    return this.parsed.namespaces;
  }

  get prefixNamespacePairs(): Array<{ prefix: string, uri: string }> {
    const namespaces = this.parsed.namespaces;
    return Object.keys(namespaces).map(
      (prefix) => ({ prefix, uri: namespaces[prefix] }));
  }
}
