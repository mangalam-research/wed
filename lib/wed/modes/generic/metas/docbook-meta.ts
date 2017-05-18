/**
 * A meta for the DocBook schema.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Meta as GenericMeta } from "wed/modes/generic/generic-meta";
import { Runtime } from "wed/runtime";

/**
 * Meta-information for a generic DocBook schema.
 */
class DocBookMeta extends GenericMeta {
    /**
     * @param runtime The runtime in which this meta is executing.
     *
     * @param options The options to pass to the Meta.
     */
  // tslint:disable-next-line:no-any
  constructor(runtime: Runtime, options: any) {
    super(runtime, options);

    // Provide a default mapping if there is no mapping loaded.
    if (this.namespaceMappings == null) {
      this.namespaceMappings = Object.create(null);
      // tslint:disable:no-http-string
      this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";
      this.namespaceMappings[""] = "http://docbook.org/ns/docbook";
      this.namespaceMappings.svg = "http://www.w3.org/2000/svg";
      this.namespaceMappings.mml = "http://www.w3.org/1998/Math/MathML";
      this.namespaceMappings.xlink = "http://www.w3.org/1999/xlink";
      // tslint:enable:no-http-string
    }
  }
}

export { DocBookMeta as Meta };

//  LocalWords:  oMath dynamicContent textLang soCalled roleName seg
//  LocalWords:  pubPlace ptr placeName persName pc origPlace orgName
//  LocalWords:  origDate num msName monogr Mangalam metas tei Dubeau
//  LocalWords:  MPL oop util namespace stylesheets isEndNote
//  LocalWords:  isFootNote xsl biblStruct titlePage floatingText sp
//  LocalWords:  bibl docAuthor mml altIdentifier listBibl biblScope
//  LocalWords:  editionStmt att br del emph expan genName geogName
//  LocalWords:  gi ident idno
