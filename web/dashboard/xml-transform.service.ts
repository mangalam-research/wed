import { Injectable } from "@angular/core";

import { XMLFile } from "./xml-file";

@Injectable()
export abstract class XMLTransformService {
  constructor(readonly name: string) {}
  abstract perform(input: XMLFile): void;
}
