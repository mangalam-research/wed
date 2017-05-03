import { Action } from "wed/action";
import { isText } from "wed/domtypeguards";
import * as generic from "wed/modes/generic/generic";
import { Transformation, TransformationData } from "wed/transformation";
import { ModeValidator } from "wed/validator";
import * as mmwpaTr from "./mmwpa-tr";
import { MMWPAValidator } from "./mmwpa-validator";

// We're going to be using any a lot here because we are interfacing with wed,
// which is not a typescript project, so...

// tslint:disable:no-any

type Editor = any;

class MMWPAMode extends generic.Mode {
  // tslint:disable-next-line:variable-name
  protected wedOptions: any;

  private readonly numberSentencesTr: Transformation<TransformationData>;
  private readonly numberWordsTr: Transformation<TransformationData>;
  private readonly unnumberWordsTr: Transformation<TransformationData>;

  constructor(editor: Editor, options: any) {
    super(editor, options);

    this.wedOptions.metadata = {
      name: "MMWP Annotation Mode",
      authors: ["Louis-Dominique Dubeau"],
      description: "This is a mode for use with MMWP.",
      license: "MPL 2.0",
      copyright: "Mangalam Research Center for Buddhist Languages",
    };

    this.wedOptions.label_levels.max = 2;
    this.wedOptions.attributes = "edit";

    this.numberSentencesTr = new Transformation(
      editor, "transform", "Number the sentences", mmwpaTr.numberSentences);
    this.numberWordsTr = new Transformation(
      editor, "transform", "Number the words", mmwpaTr.numberWords);
    this.unnumberWordsTr = new Transformation(
      editor, "transform", "Unnumber the words", mmwpaTr.unnumberWords);
  }

  getContextualActions(transformationType: string | string[], tag: string,
                       container: Node, offset: number): Action<{}>[] {
    const el = (isText(container) ? container.parentNode :
                container) as Element;

    if (!(transformationType instanceof Array)) {
      transformationType = [transformationType];
    }

    const ret = super.getContextualActions(transformationType, tag, container,
                                           offset);
    if (transformationType.indexOf("wrap-content") !== -1 &&
        el.tagName === "cit") {
      ret.push(this.numberSentencesTr);
    }

    if (transformationType.indexOf("wrap-content") !== -1 &&
        el.tagName === "s") {
      ret.push(this.numberWordsTr, this.unnumberWordsTr);
    }

    return ret;
  }

  getAttributeCompletions(attribute: Attr): string[] {
    const el = attribute.ownerElement;
    if ((el.tagName === "word") &&
        ["conc.head", "dep.head"].indexOf(attribute.name) !== -1) {
      const s = el.parentNode! as Element;
      const ids = [];
      let child = s.firstElementChild;
      while (child !== null) {
        // We cannot refer to ourselves.
        if (child !== el) {
          const id = child.getAttribute("id");
          if (id !== null) {
            ids.push(id);
          }
        }
        child = child.nextElementSibling;
      }
      return ids;
    }

    return [];
  }

  getValidator(): ModeValidator {
    return new MMWPAValidator(this.editor.data_root);
  }

}

// tslint:disable-next-line:variable-name
export const Mode = MMWPAMode;
