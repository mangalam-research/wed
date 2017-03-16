import { Chunk } from "./chunk";
import { ChunkedRecord } from "./chunked-record";

export class XMLFile extends ChunkedRecord {
  saved: "never" | Date = "never";
  pack: number | undefined = undefined;

  /**
   * Calling code is responsible for ensuring that ``chunk`` already exists in
   * the database.
   */
  constructor(name: string, chunk: string | Chunk) {
    super(name, chunk);
  }

  get recordType(): "XMLFile" {
    return "XMLFile";
  }
}
