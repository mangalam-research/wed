export abstract class RecordCommon {
  // id must remain unset for IndexedDB to work properly. If it is set,
  // the value of the primary key will be taken as literally "undefined".
  id?: number;
  name: string;
  recordVersion: number = 1;
  uploaded: Date = new Date();
  downloaded: "never" | Date = "never";
  notes: string = "";
  abstract recordType: string;

  constructor(name: string) {
    this.name = name;
  }

  copyInto(into: RecordCommon): void {
    if ("id" in this) {
      into.id = this.id;
    }
    into.name = this.name;
    into.recordVersion = this.recordVersion;
    into.uploaded = this.uploaded;
    into.downloaded = this.downloaded;
    into.notes = this.notes;
  }
}
