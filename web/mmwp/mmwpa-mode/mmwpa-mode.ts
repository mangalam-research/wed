// import * as $ from "jquery";
// import * as util from "wed/util";
// import * as log from "wed/log";
import * as generic from "wed/modes/generic/generic";
// import * as dloc from "wed/dloc";
// import { MMWPADecorator } from "./mmwpa-decorator";
// import * as transformation from "wed/transformation";
// import { Toobar } from "./mmwpa-toolbar";
// import * as mmwpaMeta from "./mmwpa-meta";
// import * as domutil from "wed/domutil";
// import * as mmwpaTr from "./mmwpa-tr";
// import * as mmwpaActions from "./mmwpa-actions";
// import { Validator } from "./mmwpa-validator";

// We're going to be using any a lot here because we are interfacing with wed,
// which is not a typescript project, so...

// tslint:disable:no-any

// tslint:disable-next-line:variable-name
const GenericMode = generic.Mode as { new (...args: any[]): Object };

class MMWPMode extends GenericMode {
  // tslint:disable-next-line:variable-name
  protected _wed_options: any;
  constructor(editor: any, options: any) {
    super(editor, options);

    this._wed_options.metadata = {
      name: "MMWP Mode",
      authors: ["Louis-Dominique Dubeau"],
      description: "This is a mode for use with MMWP.",
      license: "MPL 2.0",
      copyright: "Mangalam Research Center for Buddhist Languages",
    };

    this._wed_options.label_levels.max = 2;
    this._wed_options.attributes = "edit";
  }
}

// tslint:disable-next-line:variable-name
export const Mode = MMWPMode;
