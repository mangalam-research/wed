import { Injectable } from "@angular/core";
import * as modeList from "wed/mode-map";

@Injectable()
export class ModesService {
  private map: {[name: string]: string} = modeList.modes;

  get modes(): string[] {
    return Object.keys(this.map);
  }
}
