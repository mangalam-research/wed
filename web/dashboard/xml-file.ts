import { RecordCommon } from "./record-common";

export class XMLFile extends RecordCommon {
  public data: string;
  public saved: "never" | Date = "never";
  public pack: number | undefined = undefined;

  constructor(name: string, data: string) {
    super(name);
    this.name = name;
    this.data = data;
  }

  get recordType(): "XMLFile" {
    return "XMLFile";
  }
}
