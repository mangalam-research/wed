import { Injectable } from "@angular/core";
import { alert } from "bootbox";
import { constructTree, Grammar } from "salve";
import * as slug from "slug";

import { ProcessingService } from "../dashboard/processing.service";
import { fixPrototype } from "../dashboard/util";
import { XMLFile } from "../dashboard/xml-file";
import { XMLFilesService } from "../dashboard/xml-files.service";
import { XMLTransformService } from "../dashboard/xml-transform.service";
// tslint:disable-next-line:no-require-imports
import concordance = require("./internal-schemas/concordance");
// tslint:disable-next-line:no-require-imports
import docUnannotated = require("./internal-schemas/doc-unannotated");
import { validate } from "./util";

export class TitleEqualityError extends Error {
  constructor(message: string) {
    super();
    this.name = "TitleEqualityError";
    this.message = message;
    fixPrototype(this, TitleEqualityError);
  }
}

export class ProcessingError extends Error {
  public readonly title: string;

  constructor(title: string, message: string) {
    super();
    this.title = "ProcessingError";
    this.message = message;
    this.title = title;
    fixPrototype(this, ProcessingError);
  }
}

// tslint:disable-next-line:no-any
function assertEqual(name: string, one: any, other: any): void {
  if (one !== other) {
    throw new TitleEqualityError(`${name} differ: ${one} vs ${other}`);
  }
}

class Title {
  constructor(readonly title: string,
              readonly genre: string,
              readonly author: string,
              readonly tradition: string,
              readonly school: string,
              readonly period: string) {}

  static fromCSV(text: string): Title {
    const parts = text!.split(",");
    if (parts.length !== 7) {
      throw new ProcessingError("Invalid Ref",
                                `ref does not contain 7 parts: ${text}`);
    }

    for (let ix = 0; ix < parts.length; ++ix) {
      parts[ix] = parts[ix].trim();
    }

    const [, title, genre, author, tradition, school, period] = parts;
    return new Title(title, genre, author, tradition, school, period);
  }

  assertEqual(other: Title): void {
    try {
      assertEqual("titles", this.title, other.title);
      assertEqual("genres", this.genre, other.genre);
      assertEqual("authors", this.author, other.author);
      assertEqual("schools", this.school, other.school);
      assertEqual("periods", this.period, other.period);
      assertEqual("traditions", this.tradition, other.tradition);
    }
    catch (ex) {
      if (ex instanceof TitleEqualityError) {
        throw new ProcessingError(
          "Differing Title",
          `the title ${this.title} appears more than once, with differing \
values: ${ex.message}`);
      }

      throw ex;
    }
  }
}

class CheckError {
  constructor(public readonly message: string) {}

  toString(): string {
    return this.message;
  }
}

function safeValidate(grammar: Grammar, document: Document): Promise<void> {
  return validate(grammar, document).then((errors) => {
    if (errors.length !== 0) {
      throw new ProcessingError(
        "Validation Error",
        errors.map((x) => `<p>${x.error.toString()}</p>`).join("\n"));
    }
  });
}

@Injectable()
export class ConcordanceTransformService extends XMLTransformService {
  private readonly parser: DOMParser = new DOMParser();

  // Caches for the grammars. We do this at the class level because these
  // objects are immutable.
  private static _concordanceGrammar: Grammar | undefined;
  private static _unannotatedGrammar: Grammar | undefined;

  constructor(private readonly processing: ProcessingService,
              private readonly xmlFiles: XMLFilesService) {
    super("Concordance to doc");
  }

  private get concordanceGrammar(): Grammar {
    if (ConcordanceTransformService._concordanceGrammar === undefined) {
      const clone = JSON.parse(JSON.stringify(concordance));
      ConcordanceTransformService._concordanceGrammar =
        constructTree(clone);
    }

    return ConcordanceTransformService._concordanceGrammar;
  }

  private get unannotatedGrammar(): Grammar {
    if (ConcordanceTransformService._unannotatedGrammar === undefined) {
      const clone = JSON.parse(JSON.stringify(docUnannotated));
      ConcordanceTransformService._unannotatedGrammar =
        constructTree(clone);
    }

    return ConcordanceTransformService._unannotatedGrammar;
  }

  perform(input: XMLFile): Promise<XMLFile[]> {
    this.processing.start(1);
    return input.getData().then((data) => {
      const doc = this.parser.parseFromString(data, "text/xml");
      if (doc.documentElement.tagName === "parseerror") {
        throw new Error(`could not parse ${input.name}`);
      }

      const titles: Record<string, Title> = Object.create(null);
      const titleToLines: Record<string, Element[]> = Object.create(null);
      return safeValidate(this.concordanceGrammar, doc)
        .then(() => {
          this.gatherTitles(doc, titles, titleToLines);
          const query = doc.querySelector("concordance>heading>query")!
            .textContent!;
          const path = doc.querySelector("concordance>heading>corpus")!
            .textContent!;
          const pathParts = path.split("/");
          const base = pathParts[pathParts.length - 1];
          const transformed: { outputName: string, doc: Document }[] = [];
          const errors: CheckError[] = [];
          for (const title of Object.keys(titles)) {
            const titleInfo = titles[title];
            const lines = titleToLines[title];
            const outputName =
              `${title}_${slug(query, "_")}_${slug(base, "_")}.xml`;
            const result = this.transformTitle(titleInfo, lines);
            if (!(result instanceof Document)) {
              errors.push(...result);
            }
            else {
              transformed.push({ outputName, doc: result });
            }
          }

          // If there are any errors we don't want to move forward.
          if (errors.length !== 0) {
            throw new ProcessingError(
              "Invalid data",
              errors.map((x) => `<p>${x.toString()}</p>`).join("\n"));
          }

          const promises: Promise<{titleDoc: Document,
                                   outputName: string}>[] = [];
          for (const { outputName, doc: titleDoc } of transformed) {
            promises.push(
              this.xmlFiles.getRecordByName(outputName)
                .then((record) => {
                  if (record !== undefined) {
                    throw new ProcessingError(
                      "File Name Error", `This would overwrite: ${outputName}`);
                  }
                })
                .then(() => safeValidate(this.unannotatedGrammar, titleDoc))
                .then(() => ({ titleDoc, outputName })));
          }

          return Promise.all(promises);
        })
        .then((results) => {
          return Promise.all(
            results.map(({ outputName, titleDoc }) =>
                        this.xmlFiles.makeRecord(
                          outputName,
                          titleDoc.documentElement.outerHTML)
                        .then((record) => this.xmlFiles.updateRecord(record))));

        });
    }).then((files) => {
      this.processing.increment();
      this.processing.stop();
      return files;
    }).catch((err) => {
      this.processing.increment();
      this.processing.stop();
      if (err instanceof ProcessingError) {
        this.reportFailure(err.title !== undefined ? err.title : "Error",
                           err.message);
        throw err;
      }

      this.reportFailure("Internal failure", err.toString());
      throw err;
    });
  }

  private gatherTitles(doc: Document, titles: Record<string, Title>,
                       titleToLines: Record<string, Element[]>): void {
    for (const line of Array.from(doc.getElementsByTagName("line"))) {
      const ref = line.querySelector("ref");
      if (ref === null) {
        throw new ProcessingError("Invalid Line",
                                  `line without a ref: ${line.outerHTML}`);
      }
      const refText = ref.textContent!;
      const newTitle = Title.fromCSV(refText);
      const title = newTitle.title;
      if (!(title in titles)) {
        titles[title] = newTitle;
      }
      else {
        titles[title].assertEqual(newTitle);
      }

      let lines: Element[] = titleToLines[title];
      if (lines === undefined) {
        lines = titleToLines[title] = [];
      }

      lines.push(line);
    }
  }

  private transformTitle(titleInfo: Title,
                         lines: Element[]): Document | CheckError[] {
    const title = titleInfo.title;
    let citId = 1;
    const doc = this.parser.parseFromString(
      "<doc xmlns='http://mangalamresearch.org/ns/mmwp/doc'/>",
      "text/xml");
    const docEl = doc.firstElementChild!;
    docEl.setAttribute("version", "1");
    docEl.setAttribute("title", title);
    docEl.setAttribute("genre", titleInfo.genre);
    docEl.setAttribute("author", titleInfo.author);
    docEl.setAttribute("tradition", titleInfo.tradition);
    docEl.setAttribute("school", titleInfo.school);
    docEl.setAttribute("period", titleInfo.period);
    const errors: CheckError[] = [];
    for (const line of lines) {
      const cit = this.makeCitFromLine(doc, line, citId++);
      // A few checks that validation cannot catch.
      errors.push(...this.checkCit(cit));
      if (errors.length === 0) {
        this.convertMarkedToWord(doc, cit);
        // Clean the text.
        this.cleanText(cit);
        this.breakIntoWords(doc, cit);
        this.cleanDashes(cit, line);
        docEl.appendChild(cit);
      }
    }

    if (errors.length !== 0) {
      return errors;
    }

    return doc;
  }

  private makeCitFromLine(doc: Document, line: Element,
                          citId: number): Element {
    const cit = doc.createElement("cit");
    cit.setAttribute("id", String(citId));
    const pageNumber = line.querySelector("page\\.number");
    if (pageNumber !== null) {
      cit.setAttribute("ref", pageNumber.textContent!);
    }
    let child = line.firstChild;

    // Convert <line> to <cit>. Remove <ref> and <page.number> and drop all
    // other tags (but keep their contents).
    //
    // We cannot immediately convert notvariant and normalised to word because
    // some of these elements may be part of the content unwrapped.
    //
    while (child !== null) {
      switch (child.nodeType) {
      case Node.TEXT_NODE:
        cit.appendChild(child.cloneNode(true));
        break;
      case Node.ELEMENT_NODE:
        const tagName = (child as Element).tagName;
        if (["ref", "page.number"].indexOf(tagName) !== -1) {
          // Do nothing: this effectively strips these elements and what they
          // contain.
        }
        else if (["notvariant", "normalised"].indexOf(tagName) !== -1) {
          cit.appendChild(child.cloneNode(true));
        }
        else {
          // This effectively unwraps the children.
          let grandChild = child.firstChild;
          while (grandChild !== null) {
            cit.appendChild(grandChild.cloneNode(true));
            grandChild = grandChild.nextSibling;
          }
        }
        break;
      default:
        break;
      }

      child = child.nextSibling;
    }

    return cit;
  }

  private checkCit(cit: Element): CheckError[] {
    const text = cit.textContent!;
    const ret: CheckError[] = [];
    if (/'\s/.test(text)) {
      ret.push(new CheckError("errant avagraha in: " + cit.innerHTML));
    }

    return ret;
  }

  private convertMarkedToWord(doc: Document, cit: Element): void {
    // Convert <notvariant> and <normalised> to <word>.
    let elChild = cit.firstElementChild;
    while (elChild !== null) {
      const next = elChild.nextElementSibling;
      const tagName = elChild.tagName;
      if (tagName === "notvariant") {
        const word = doc.createElement("word");
        word.textContent = elChild.textContent;
        word.setAttribute("lem", elChild.textContent!);
        cit.insertBefore(word, elChild);
      }
      else if (tagName === "normalised") {
        const word = doc.createElement("word");
        word.textContent = elChild.getAttribute("orig");
        word.setAttribute("lem", elChild.textContent!);
        cit.insertBefore(word, elChild);
      }
      else {
        throw new Error(`unexpected element ${tagName}`);
      }

      cit.removeChild(elChild);
      elChild = next;
    }
  }

  /**
   * Perform a DOM normalization and clean the text of the node.
   */
  private cleanText(node: Node): void {
    node.normalize();
    this._cleanText(node);
  }

  /**
   * Perform the cleaning only. We separate this from [[cleanText]] because the
   * DOM normalization operation is already recursive and thus it is not useful,
   * in the context of this function, to *invoke* it recursively.
   */
  private _cleanText(node: Node): void {
    let child = node.firstChild;
    while (child !== null) {
      const next = child.nextSibling;
      switch (child.nodeType) {
      case Node.TEXT_NODE:
        child.textContent = child.textContent!.replace(/\//g, "|");
        child.textContent = child.textContent.replace(/\*\*/g, "");
        child.textContent = child.textContent.replace(/\s*-[-\s]*/g, "-");
        child.textContent = child.textContent.replace(/\s+/g, " ");
        // The transformations can result in empty text nodes. Remove them. This
        // prevents denormalizing the text.
        if (child.textContent === "") {
          node.removeChild(child);
        }
        break;
      case Node.ELEMENT_NODE:
        this._cleanText(child);
        break;
      default:
        throw new Error(`unexpected node type: ${child.nodeType}`);
      }
      child = next;
    }
  }

  private breakIntoWords(doc: Document, cit: Element): void {
    // Break the text nodes into words to be wrapped in <word>.
    let child = cit.firstChild;
    while (child !== null) {
      const next = child.nextSibling;
      if (child.nodeType === Node.TEXT_NODE) {
        // Node containing only spaces, skip.
        if (/^\s+$/.test(child.textContent!)) {
          child = next;
          continue;
        }

        const parts = child.textContent!.split(/( )/);
        for (const part of parts) {
          if (part === "") {
            // Do nothing. This is created when we have a text node that starts
            // with a space or ends with a space.
          }
          else if (part === " ") {
            cit.insertBefore(doc.createTextNode(" "), child);
          }
          else {
            const compoundParts = part.split("-");
            if (compoundParts.length === 1) {
              const word = doc.createElement("word");
              word.textContent = part;
              cit.insertBefore(word, child);
            }
            else {
              for (let compoundPartsIx = 0;
                   compoundPartsIx < compoundParts.length;
                   ++compoundPartsIx) {
                const compoundPart = compoundParts[compoundPartsIx];

                // We skip the empty parts. After the processing done by earlier
                // steps, these may happen at the start or end of a part. It is
                // important that we don't just filter them out because they
                // affect the tests done on the index below.
                if (compoundPart === "") {
                  continue;
                }
                const word = doc.createElement("word");
                const text: string[] = [];
                if (compoundPartsIx !== 0) {
                  text.push("-");
                }
                text.push(compoundPart);
                if (compoundPartsIx !== compoundParts.length - 1) {
                  text.push("-");
                }
                word.textContent = text.join("");
                cit.insertBefore(word, child);
              }
            }
          }
        }

        cit.removeChild(child);
      }
      child = next;
    }
  }

  private cleanDashes(cit: Element, line: Element): void {
    // At this point we may have <word> elements that have a - at one end
    // without the corresponding - at the corresponding end in a sibling
    // word. We need to fix this.
    let elChild = cit.firstElementChild;
    while (elChild !== null) {
      const next = elChild.nextElementSibling;

      const tagName = elChild.tagName;
      if (tagName !== "word") {
        throw new Error(`unexpected element: ${tagName}`);
      }

      const text = elChild.textContent!;
      if (text[text.length - 1] === "-") {
        if (next === null) {
          throw new Error(
            `word with trailing dash has no following sibling: \
${line.innerHTML}`);
        }

        if (next.textContent![0] !== "-") {
          next.textContent = `-${next.textContent}`;
        }
      }
      else if (next !== null) {
        if (next.textContent![0] === "-") {
          elChild.textContent = `${elChild.textContent}-`;
        }
      }

      if (text[0] === "-") {
        if (elChild.previousElementSibling === null) {
          throw new Error(
            `word with leading dash has no preceding sibling: \
${line.innerHTML}`);
        }
      }

      elChild = next;
    }
  }

  reportFailure(title: string, message: string): void {
    alert({
      title,
      message,
    });
  }
}
