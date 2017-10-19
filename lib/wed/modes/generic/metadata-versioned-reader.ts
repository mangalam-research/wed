/**
 * Reading facilities common to all readers that read specific versions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { EName } from "salve";

import { Metadata } from "./metadata";
import { Metadata as MetadataInterface } from "./metadata-as-json";
import { MetadataJSONReader } from "./metadata-json-reader";
import * as metadataSchema from "./metadata-schema.json";

// tslint:disable-next-line:completed-docs
export abstract class MetadataBase implements Metadata {
  readonly version: string;
  readonly generator?: string;
  readonly date?: string;

  protected readonly namespaceMappings: Record<string, string>;
  protected readonly reverseMappings: Record<string, string> =
    Object.create(null);
  protected descMap: Record<string, string> = Object.create(null);

  constructor(expectedVersion: string,
              protected readonly metadata: MetadataInterface) {
    if (metadata.version !== expectedVersion) {
      throw new Error(
        `incorrect version number: expected ${expectedVersion}, \
got ${metadata.version}`);
    }
    this.version = metadata.version;
    this.generator = metadata.generator;
    this.date = metadata.date;

    if (metadata.namespaces !== undefined) {
      this.namespaceMappings = metadata.namespaces;
    }
    else {
      this.namespaceMappings = Object.create(null);
    }

    if ("xml" in this.namespaceMappings) {
      throw new Error("xml mapping already defined");
    }

    // tslint:disable-next-line:no-http-string
    this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";

    // tslint:disable-next-line:forin
    for (const prefix in this.namespaceMappings) {
      const ns = this.namespaceMappings[prefix];
      // If prefix foo resolves to http://bar and bar resolves to the same URI
      // and foo is before bar, then foo wins.
      if (this.reverseMappings[ns] === undefined) {
        this.reverseMappings[ns] = prefix;
      }
    }
    this.reverseMappings[this.namespaceMappings[""]] = "";

    const elements = metadata.elements;
    if (elements !== undefined) {
      const descMap = this.descMap;

      for (const el of elements) {
        // Here, an undefined namespace is the tei namespace.
        const elNs = el.ns !== undefined ? el.ns :
          // tslint:disable-next-line:no-http-string
          "http://www.tei-c.org/ns/1.0";
        const elPrefix = this.reverseMappings[elNs];
        if (elPrefix === undefined) {
          throw new Error(`undefined namespace: ${elNs}`);
        }
        const name = elPrefix === "" ? el.name : `${elPrefix}:${el.name}`;
        descMap[name] = el.desc;
      }
    }
  }

  getNamespaceMappings(): Record<string, string> {
    return this.namespaceMappings;
  }

  shortDescriptionFor(name: EName): string | undefined {
    const unresolved = this.unresolveName(name);
    if (unresolved === undefined) {
      return undefined;
    }

    return this.descMap[unresolved];
  }

  abstract isInline(node: Element): boolean;
  abstract documentationLinkFor(name: EName): string | undefined;

  unresolveName(name: EName): string | undefined {
    const prefix = this.reverseMappings[name.ns];
    if (prefix === undefined) {
      return undefined;
    }

    return (prefix === "") ? name.name : `${prefix}:${name.name}`;
  }
}

/**
 * A constructor of [[MetadataBase]] objects.
 */
export interface MetadataBaseCtor {
  // tslint:disable-next-line:no-any
  new (...args: any[]): MetadataBase;
}

/**
 * A reader that reads a versioned format of the metadata.
 */
export class MetadataReaderBase extends MetadataJSONReader {
  public static readonly version: string = "1";

  constructor(protected readonly metadataClass: MetadataBaseCtor) {
    super(metadataSchema);
  }

  protected convert(object: Object): Metadata {
    return new this.metadataClass(object as MetadataInterface);
  }
}

//  LocalWords:  MPL expectedVersion xml tei elNs elPrefix el
