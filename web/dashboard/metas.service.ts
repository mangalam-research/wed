import { Injectable } from "@angular/core";
import * as metaMap from "wed/meta-map";

@Injectable()
export class MetasService {
  private map: {[name: string]: string} = metaMap.metas;
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

  get metas(): string[] {
    return Object.keys(this.map);
  }

  metaToPath(meta: string | undefined): string | undefined {
    if (meta === undefined) {
      return undefined;
    }

    return this.map[meta];
  }

  pathToMeta(path: string | undefined): string | undefined {
    if (path === undefined) {
      return undefined;
    }

    return this.reverse[path];
  }
}
