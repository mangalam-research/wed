/**
 * Reading facilities for version 1 of the metadata format.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { EName } from "salve";

import { Metadata } from "./metadata-as-json";
import { MetadataBase, MetadataReaderBase } from "./metadata-versioned-reader";

// tslint:disable-next-line:completed-docs
class MetadataV1 extends MetadataBase {
  constructor(metadata: Metadata) {
    super("1", metadata);
  }

  isInline(_node: Element): boolean {
    return false;
  }

  documentationLinkFor(name: EName): string | undefined {
    const root = this.metadata.dochtml;
    if (root === undefined) {
      return undefined;
    }

    let unresolved = this.unresolveName(name);
    if (unresolved === undefined) {
      return undefined;
    }

    // The TEI odd2html stylesheet creates file names of the form
    // prefix_local-name.html. So replace the colon with an underscore.
    unresolved = unresolved.replace(":", "_");

    return `${root}ref-${unresolved}.html`;
  }
}

/**
 * A reader that reads version 1 of the metadata format.
 */
export class MetadataReaderV1 extends MetadataReaderBase {
  public static readonly version: string = "1";

  constructor() {
    super(MetadataV1);
  }
}

//  LocalWords:  MPL TEI html stylesheet
