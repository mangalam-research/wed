/**
 * Reading facilities for version 2 of the metadata format.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { EName } from "salve";
import { util } from "wed";

import { compile, Context, DocPattern } from "./doc-pattern";
import { Dochtml, Inline, Metadata } from "./metadata-as-json";
import { MetadataBase, MetadataReaderBase } from "./metadata-versioned-reader";

/**
 * Execution context for the [[DocPattern]] objects we evaluate with
 * [[MetadataV2]].
 */
class MetadataContext implements Context {
  /**
   * @param name The value to return when we interpolate the symbol "name".
   */
  constructor(private readonly name: string) {}

  resolveName(name: string): string {
    if (name === "name") {
      return this.name;
    }

    throw new Error(`cannot resolve: ${name}`);
  }
}

// tslint:disable-next-line:completed-docs
class MetadataV2 extends MetadataBase {
  private readonly inline: Inline | undefined;
  private readonly dochtml: Dochtml | undefined;
  private readonly docPattern: DocPattern | undefined;
  constructor(metadata: Metadata) {
    super("2", metadata);

    if (metadata.namespaces === undefined) {
      throw new Error("namespaces are not optional in version 2");
    }

    // The parent class already does this check but we need it to get TS to know
    // what specific type metadata.inline is.
    if (metadata.version !== "2") {
      throw new Error("need version 2");
    }

    this.inline = metadata.inline;
    if (this.inline !== undefined && this.inline.method !== "name") {
      throw new Error("only the 'name' method is supported for inlines");
    }

    this.dochtml = metadata.dochtml;
    if (this.dochtml !== undefined) {
      if (this.dochtml.method !== "simple-pattern") {
        throw new Error(
          "only the 'simple-pattern' method is supported for dochtml");
      }
      this.docPattern = compile(this.dochtml.pattern);
    }
  }

  isInline(node: Element): boolean {
    if (this.inline === undefined) {
      return false;
    }

    // We need to normalize the name to fit the names we have below.
    const originalName = util.getOriginalName(node);
    const parts = originalName.split(":");
    if (parts.length === 1) {
      parts[1] = parts[0];
      parts[0] = "tei";
    }

    const name = parts.join(":");
    const result = this.inline.rules[name];
    if (result === undefined) {
      return false;
    }

    return result;
  }

  documentationLinkFor(name: EName): string | undefined {
    const docPattern = this.docPattern;
    if (docPattern === undefined) {
      return undefined;
    }

    const unresolved = this.unresolveName(name);
    if (unresolved === undefined) {
      return undefined;
    }

    return docPattern.execute(new MetadataContext(unresolved));
  }
}

/**
 * A reader that reads version 2 of the metadata format.
 */
export class MetadataReaderV2 extends MetadataReaderBase {
  public static readonly version: string = "2";

  constructor() {
    super(MetadataV2);
  }
}

//  LocalWords:  MPL inlines tei
