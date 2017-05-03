import { Injectable } from "@angular/core";

import { XMLFile } from "./xml-file";

@Injectable()
export abstract class XMLTransformService {
  constructor(readonly name: string) {}
  /**
   * Peforms the transformation on the file.
   *
   * @param input The file to transform.
   *
   * @returns A promise that resolves when the transformation is done.
   */
  abstract perform(input: XMLFile): Promise<{}>;
}
