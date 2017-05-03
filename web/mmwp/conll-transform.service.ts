import { Injectable } from "@angular/core";
import { alert } from "bootbox";
import { constructTree, Grammar } from "salve";

import { ProcessingService } from "../dashboard/processing.service";
import { fixPrototype, triggerDownload } from "../dashboard/util";
import { XMLFile } from "../dashboard/xml-file";
import { XMLTransformService } from "../dashboard/xml-transform.service";
// tslint:disable-next-line:no-require-imports
import docAnnotated = require("./internal-schemas/doc-annotated");
import { MMWPAValidator } from "./mmwpa-mode/mmwpa-validator";
import { getText } from "./mmwpa-mode/util";
import { validate } from "./util";

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

export class Word {
  public prev: Word | null = null;
  public next: Word | null = null;
  constructor(public readonly el: Element) {}

  /**
   * Populate the fields prev and next.
   */
  link(map: Record<string, Word>): void {
    const prev = this.el.previousElementSibling;
    if (prev !== null) {
      this.prev = map[prev.getAttribute("id")!];
    }

    const next = this.el.nextElementSibling;
    if (next !== null) {
      this.next = map[next.getAttribute("id")!];
    }
  }

  get id(): string {
    const id = this.el.getAttribute("id");
    if (id === null) {
      throw new Error("no id available; this should not happen");
    }

    return id;
  }

  get text(): string {
    return getText(this.el);
  }

  get nextRaw(): string {
    const text = this.text;
    if (text[text.length - 1] === "-") {
      return text.slice(0, text.length - 1) + this.next!.nextRaw;
    }

    return text;
  }

  get prevRaw(): string {
    const text = this.text;
    if (text[0] === "-") {
      return this.prev!.prevRaw + text.slice(1);
    }

    return text;
  }

  get raw(): string | undefined {
    const text = this.text;
    const withPrev = text[0] === "-";
    const withNext = text[text.length - 1] === "-";
    if (withPrev || withNext) {
      if (withPrev && !withNext) {
        return this.prevRaw;
      }
      else if (!withPrev && withNext) {
        return this.nextRaw;
      }
      else {
        return this.prev!.prevRaw + text.slice(1, text.length - 1) +
          this.next!.nextRaw;
      }
    }

    return "";
  }

  getAttribute(name: string): string | null {
    return this.el.getAttribute(name);
  }
}

@Injectable()
export class CoNLLTransformService extends XMLTransformService {
  private readonly parser: DOMParser = new DOMParser();

  // Caches for the grammars. We do this at the class level because these
  // objects are immutable.
  private static _annotatedGrammar: Grammar | undefined;

  constructor(private readonly processing: ProcessingService) {
    super("Annotated document to CoNLL");
  }

  get annotatedGrammar(): Grammar {
    if (CoNLLTransformService._annotatedGrammar === undefined) {
      const clone = JSON.parse(JSON.stringify(docAnnotated));
      CoNLLTransformService._annotatedGrammar = constructTree(clone);
    }

    return CoNLLTransformService._annotatedGrammar;
  }

  perform(input: XMLFile): Promise<string> {
    this.processing.start(1);
    return input.getData().then((data) => {
      const doc = this.parser.parseFromString(data, "text/xml");
      if (doc.documentElement.tagName === "parseerror") {
        throw new Error(`could not parse ${input.name}`);
      }

      return validate(this.annotatedGrammar, doc, new MMWPAValidator(doc))
        .then((errors) => {
          if (errors.length !== 0) {
            throw new ProcessingError(
              "Validation Error",
              errors.map((x) => `<p>${x.error.toString()}</p>`).join("\n"));
          }

          const transformed = this.transform(doc);
          const name = input.name.replace(/\.xml$/, ".txt");
          triggerDownload(name, transformed);
          return transformed;
        })
        .then((transformed) => {
          this.processing.increment();
          this.processing.stop();
          return transformed;
        })
        .catch((err) => {
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
    });
  }

  private transform(doc: Document): string {
    const buf = [];
    const docEl = doc.getElementsByTagName("doc")[0].cloneNode() as Element;

    // We take advantage of the DOM's serialization machinery to produce the
    // opening tag. However, we need to drop the closing tag or transform the
    // empty tag into non-empty to serve our purpose here.
    const docXML = docEl.outerHTML.replace(/<\/doc>$/, "").replace(/\/>$/, ">");
    buf.push(docXML, "\n");

    const sEls = doc.getElementsByTagName("s");
    for (const sEl of Array.prototype.slice.call(sEls)) {
      const wordEls = sEl.getElementsByTagName("word");
      const words = [];
      const idToWord: Record<string, Word> = Object.create(null);
      for (const wordEl of Array.prototype.slice.call(wordEls)) {
        const word = new Word(wordEl);
        words.push(word);
        idToWord[word.id] = word;
      }

      for (const word of words) {
        word.link(idToWord);
      }

      // Recover the compound information.
      for (const word of words) {
        buf.push(word.id, "\t",
                 word.text, "\t",
                 word.raw, "\t",
                 word.getAttribute("lem"), "\t",
                 word.getAttribute("case"), "\t",
                 word.getAttribute("sem.type"), "\t",
                 word.getAttribute("sem.field"), "\t",
                 word.getAttribute("uncertainty"), "\t",
                 word.getAttribute("conc.rel"), "\t",
                 word.getAttribute("conc.head"), "\t",
                 word.getAttribute("dep.rel"), "\t",
                 word.getAttribute("dep.head"), "\n");
      }
    }
    buf.push("</doc>\n");

    return buf.join("");
  }

  reportFailure(title: string, message: string): void {
    alert({
      title,
      message,
    });
  }
}
