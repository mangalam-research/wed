import md5 = require("blueimp-md5");
import { readFile } from "./store-util";

export class Chunk {
  readonly id: string;
  readonly file: File;
  readonly recordVersion: number = 1;

  // tslint:disable-next-line:variable-name
  private __data: Promise<string>;

  static makeChunk(file: File | string): Promise<Chunk> {
    if (typeof file === "string") {
      return Promise.resolve(new Chunk(md5(file), new File([file], ""), file));
    }

    return readFile(file)
      .then((data) => new Chunk(md5(data), file, data));
  }

  private constructor(id: string, file: File, data: string) {
    this.file = file;
    this.id = id;
    this.__data = Promise.resolve(data);
  }

  getData(): Promise<string> {
    if (!this.__data) {
      this.__data = readFile(this.file);
    }

    return this.__data;
  }

  get recordType(): "Chunk" {
    return "Chunk";
  }
}
