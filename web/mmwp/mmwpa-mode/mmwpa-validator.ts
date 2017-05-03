import { ValidationError } from "salve";
import { ErrorData } from "salve-dom";

import { ModeValidator } from "wed/validator";

import { DepCheck } from "./dep-check";
import { getText } from "./util";

function indexOf(something: {}, item: {}): number {
  return Array.prototype.indexOf.call(something, item);
}

export class MMWPAValidator implements ModeValidator {
  constructor(private readonly dataRoot: Document) {}

  validateDocument(): ErrorData[] {
    const ret = [];
    const tree = this.dataRoot as Document;
    const ss = tree.getElementsByTagName("s");
    const citIds: Record<string, boolean> = Object.create(null);

    // We perform a check for duplicate ids of cit and s here. Duplicate word
    // ids are handled by the DepCheck objects.
    for (const cit of
         Array.prototype.slice.call(tree.getElementsByTagName("cit"))) {
      const citId = cit.getAttribute("id");
      if (citId !== null && citId in citIds) {
        const parent = cit.parentNode;
        ret.push({
                   error: new ValidationError(
                     `duplicate citation id: ${citId}`),
                   node: parent,
                   index: indexOf(parent.childNodes, cit),
                 });
      }
      else {
        citIds[citId] = true;
      }

      const sIds: Record<string, boolean> = Object.create(null);
      for (const s of
           Array.prototype.slice.call(cit.getElementsByTagName("s"))) {
        const sId = s.getAttribute("id");
        if (sId !== null && sId in sIds) {
          ret.push({
                     error: new ValidationError(
                       `duplicate sentence id: ${sId}`),
                     node: cit,
                     index: indexOf(cit.childNodes, s),
                   });
        }
        else {
          sIds[sId] = true;
        }
      }
    }

    for (const s of Array.prototype.slice.call(ss)) {
      ret.push(...this.validateSentence(s));
    }

    return ret;
  }

  private validateSentence(s: Element): ErrorData[] {
    const concCheck = new DepCheck("conc", s, "conc.head");
    const depCheck = new DepCheck("dep", s, "dep.head");
    let child = s.firstElementChild;
    const ret = [];
    while (child !== null) {
      const id = child.getAttribute("id");
      if (id !== null && !isNaN(Number(id))) {
        const concErr = concCheck.addNode(child);
        const depErr = depCheck.addNode(child);
        if (concErr !== undefined) {
          ret.push({
                     error: concErr,
                     node: s,
                     index: indexOf(s.childNodes, child),
                   });
        }

        if (depErr !== undefined) {
          ret.push({
                     error: depErr,
                     node: s,
                     index: indexOf(s.childNodes, child),
                   });
        }
      }

      const text = getText(child);

      if (text[0] === "-") {
        const prev = child.previousElementSibling;
        let error: string | undefined;
        // Joined with previous word in compound.
        if (prev === null) {
          error = `is at start of sentence: ${text}`;
        }
        else {
          const prevText = getText(prev);
          if (prevText[prevText.length - 1] !== "-") {
            error = `previous word is not compounded: ${text}`;
          }
        }

        if (error !== undefined) {
          ret.push({
                     error: new ValidationError(
                       `word is compounded with previous but ${error}`),
                     node: s,
                     index: indexOf(s.childNodes, child),
                   });
        }
      }

      if (text[text.length - 1] === "-") {
        const next = child.nextElementSibling;
        let error: string | undefined;
        if (next === null) {
          error = `is at end of sentence: ${text}`;
        }
        else if (getText(next)[0] !== "-") {
          error = `next word is not compounded: ${text}`;
        }

        if (error !== undefined) {
          ret.push({
                     error: new ValidationError(
                       `word is compounded with next but ${error}`),
                     node: s,
                     index: indexOf(s.childNodes, child),
                   });
        }
      }

      child = child.nextElementSibling;
    }

    // We cannot move forth if we already have errors.
    if (ret.length !== 0) {
      return ret;
    }

    ret.push(...concCheck.check());
    ret.push(...depCheck.check());

    return ret;
  }

}
