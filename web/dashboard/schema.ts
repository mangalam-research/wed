import md5 = require("blueimp-md5");

import { RecordCommon } from "./record-common";

export class Schema extends RecordCommon {
  public data: string;
  public sum: string;

  constructor(name: string, data: string) {
    super(name);
    this.data = data;
    this.sum = md5(data);
  }

  get recordType(): "Schema" {
    return "Schema";
  }
}
