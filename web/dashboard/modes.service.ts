import { Injectable } from "@angular/core";
import * as modeList from "wed/mode-map";

@Injectable()
export class ModesService {
  private map: Record<string, string> = modeList.modes;
  private reverse: Record<string, string> = Object.create(null);

  constructor() {
    for (const key of Object.keys(this.map)) {
      const path = this.map[key];
      if (path in this.reverse) {
        throw new Error(`ambiguous mapping for ${path}`);
      }
      this.reverse[path] = key;
    }
  }

  get modes(): string[] {
    return Object.keys(this.map);
  }

  /**
   * Adds a mode to the list of builtin modes.
   */
  addMode(name: string, path: string): void {
    if (name in this.map) {
      throw new Error(`overwriting mode ${name}`);
    }

    this.map[name] = path;

    if (path in this.reverse) {
      throw new Error(`ambiguous mapping for ${path}`);
    }
    this.reverse[path] = name;
  }

  modeToPath(mode: string): string {
    return this.map[mode];
  }

  pathToMode(path: string): string {
    return this.reverse[path];
  }
}
