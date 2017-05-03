declare module "slugify" {
  // tslint:disable-next-line: class-name
  interface slugify {
    extend(mapping: {[name: string]: string}): void;
  }
  function slugify(str: string, replacement?: string): string;
  export = slugify;
}

// For wed

declare module "wed/modes/generic/generic" {
  import { Action } from "wed/action";
  import { Mode as ModeInterface } from "wed/mode";

  export type Editor = any;

  export declare class Mode implements ModeInterface {
    constructor(editor: Editor, options: any);
    protected editor: Editor;
    getContextualActions(type: string | string[], tag: string, container: Node,
                         offset: number): Action<{}>[];
  }
}
