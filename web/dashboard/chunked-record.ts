import { Chunk } from "./chunk";
import { RecordCommon } from "./record-common";
import { db } from "./store";

export abstract class ChunkedRecord extends RecordCommon {
  // tslint:disable-next-line:variable-name
  private __data: Promise<string> | undefined;
  private savedChunk: string;

  /**
   * Calling code is responsible for ensuring that ``chunk`` already exists in
   * the database.
   */
  constructor(name: string, chunk: string | Chunk) {
    super(name);
    this.chunk = (typeof chunk === "string") ? chunk : chunk.id;

    Object.defineProperty(this, "__data", {
      configurable: true,
      enumerable: false,
      writable: true,
    });
 }

  set chunk(id: string) {
    if (this.savedChunk !== id) {
      this.savedChunk = id;
      this.__data = undefined;
    }
  }

  get chunk(): string {
    return this.savedChunk;
  }

  getData(): Promise<string> {
    if (this.__data === undefined) {
      this.__data = db.chunkIdToData(this.chunk);
    }

    return this.__data;
  }
}
