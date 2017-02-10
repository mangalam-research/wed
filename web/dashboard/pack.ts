import { RecordCommon } from "./record-common";

export interface PackPayload {
  schema: string;
  mode: string;
  meta: string;
  metadata: string;
}

export class Pack extends RecordCommon implements PackPayload {
  public schema: string;
  public mode: string;
  public meta: string;
  public metadata: string;

  constructor(name: string, payload?: PackPayload) {
    super(name);
    if (payload) {
      this.schema =  payload.schema;
      this.mode = payload.mode;
      this.meta = payload.meta;
      this.metadata = payload.metadata;
    }
  }

  get recordType(): "Pack" {
    return "Pack";
  }
}
