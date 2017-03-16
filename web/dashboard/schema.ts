import { Chunk } from "./chunk";
import { ChunkedRecord } from "./chunked-record";

export class Schema extends ChunkedRecord {
  /**
   * Calling code is responsible for ensuring that ``chunk`` already exists in
   * the database.
   */
  constructor(name: string, chunk: string | Chunk) {
    super(name, chunk);
  }

  get recordType(): "Schema" {
    return "Schema";
  }
}
