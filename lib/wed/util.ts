/**
 * Various utilities for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

/**
 * Calculates the distance on the basis of two deltas. This would typically be
 * called with the difference of X coordinates and the difference of Y
 * coordinates.
 *
 * @param delta1 The first delta.
 *
 * @param delta2 The second delta.
 *
 * @returns The distance.
 */
export function distFromDeltas(delta1: number, delta2: number): number {
  // eslint-disable-next-line no-mixed-operators
  return Math.sqrt(delta1 * delta1 + delta2 * delta2);
}

/**
 * Measures the distance of a point from a rectangle. If the point is in the
 * rectangle or touches it, the distance is 0. In the nomenclature below, left
 * and right are on the X axis and top and bottom on the Y axis.
 *
 * @param x X coordinate of the point.
 *
 * @param y Y coordinate of the point.
 *
 * @param left Left coordinate of the rectangle.
 *
 * @param top Top coordinate of the rectangle.
 *
 * @param right Right coordinate of the rectangle.
 *
 * @param bottom Bottom coordinate of the rectangle.
 *
 * @returns The distance.
 */
export function distFromRect(x: number, y: number, left: number, top: number,
                             right: number, bottom: number): number {
  const topDelta = y - top;
  const leftDelta = x - left;
  const bottomDelta = y - bottom;
  const rightDelta = x - right;

  const above = topDelta < 0;
  const below = bottomDelta > 0;
  // Neologism used to avoid conflict with left above.
  const lefter = leftDelta < 0;
  const righter = rightDelta > 0;

  /* eslint-disable no-nested-ternary */
  const deltaX = lefter ? leftDelta : (righter ? rightDelta : 0);
  const deltaY = above ? topDelta : (below ? bottomDelta : 0);
  /* eslint-enable */

  return distFromDeltas(deltaX, deltaY);
}

/**
 * Measures the absolute horizontal and vertical distances of a point from a
 * rectangle. If the point is in the rectangle or touches it, the distance is
 * 0. In the nomenclature below, left and right are on the X axis and top and
 * bottom on the Y axis.
 *
 * @param x X coordinate of the point.
 *
 * @param y Y coordinate of the point.
 *
 * @param left Left coordinate of the rectangle.
 *
 * @param top Top coordinate of the rectangle.
 *
 * @param right Right coordinate of the rectangle.
 *
 * @param bottom Bottom coordinate of the rectangle.
 *
 * @returns The distance.
 */
export function distsFromRect(x: number, y: number, left: number, top: number,
                              right: number, bottom: number):
{x: number, y: number} {
  const topDelta = y - top;
  const leftDelta = x - left;
  const bottomDelta = y - bottom;
  const rightDelta = x - right;

  const above = topDelta < 0;
  const below = bottomDelta > 0;
  // Neologism used to avoid conflict with left above.
  const lefter = leftDelta < 0;
  const righter = rightDelta > 0;

  /* eslint-disable no-nested-ternary */
  const deltaX = lefter ? leftDelta : (righter ? rightDelta : 0);
  const deltaY = above ? topDelta : (below ? bottomDelta : 0);
  /* eslint-enable */

  return { x: Math.abs(deltaX), y: Math.abs(deltaY) };
}

/**
 * Escape character in CSS class that could cause trouble in CSS
 * selectors. *This is not a general solution.* It supports enough for the needs
 * of wed.
 *
 * @param cls The class
 *
 * @returns The escaped class.
 */
export function escapeCSSClass(cls: string): string {
  // We should investigate replacing this with CSS.escape whenever the spec for
  // that function becomes stable.
  return cls.replace(/([\][\\/!"#$%&'()*+,.:;<=>?@^`{|}~])/g, "\\$1");
}

/**
 * Get the original element name of a node created for wed's data tree.
 *
 * @param el The element whose name we want.
 *
 * @returns The name.
 */
export function getOriginalName(el: Element): string {
  // The original name is the first class name of the element that was created.
  return el.classList[0];
}

/**
 * Makes a class string for a node in wed's data tree. The string is meant to be
 * used for the corresponding node in wed's GUI tree.
 *
 * @param name The original element name.
 *
 * @param namespaces The namespaces that are known. This is used to convert
 * element name prefixes to namespace URIs.
 *
 * @returns The class string.
 */
export function classFromOriginalName(name: string,
                                      namespaces: Record<string, string>):
string {
  // Special case if we want to match all
  if (name === "*") {
    return "._real";
  }

  let [prefix, localName] = name.split(":");

  if (localName === undefined) {
    localName = prefix;
    prefix = "";
  }

  const ns = namespaces[prefix];
  if (ns === undefined) {
    throw new Error(`prefix ${prefix} is not defined in namespaces`);
  }

  // We do not output `.${escapeCSSClass(name)}` because that's redundant for a
  // search.
  return `._local_${escapeCSSClass(localName)}\
._xmlns_${escapeCSSClass(ns)}._real`;
}

/**
 * Transforms an attribute name from wed's data tree to the original attribute
 * name before the data was transformed for use with wed. This reverses the
 * transformation done with [[encodeAttrName]].
 *
 * @param name The encoded name.
 *
 * @returns The decoded name.
 */
export function decodeAttrName(name: string): string {
  // The slice skips "data-wed-"
  return name.slice(9).replace(/---/, ":").replace(/---(-+)/g, "--$1");
}

/**
 * Transforms an attribute name from its unencoded form in the
 * original XML data (before transformation for use with wed) to its
 * encoded name.
 *
 * A sequence of three dashes or more is converted by adding another dash. (So
 * sequences of single dash, or a pair of dashes remain unchanged. But all
 * sequences of 3 dashes or more gets an additional dash.)
 *
 * A colon (``:``) is converted to three dashes ``---``.
 *
 * After transformation above the name is prepended with ``data-wed-``.
 *
 * So ``foo:bar`` would become ``data-wed-foo---bar``.
 *
 * When ``qualifier`` is used, the qualifier is added just after ``data-wed-``
 * and is prepended and appended with a dash. So ``foo:bar`` with the qualifier
 * ``ns`` would become ``data-wed--ns-foo---bar``.
 *
 * @param name The unencoded name.
 *
 * @param qualifier An optional qualifier.
 *
 * @returns The encoded name.
 */
export function encodeAttrName(name: string, qualifier?: string): string {
  const sanitized = name.replace(/--(-+)/g, "---$1").replace(/:/, "---");
  qualifier = qualifier === undefined ? "" : `-${qualifier}-`;
  return `data-wed-${qualifier}${sanitized}`;
}

/**
 * Determines whether a ``data-wed-`` attribute corresponds to an XML attribute.
 */
export function isXMLAttrName(name: string): boolean {
  return /^data-wed-(?!-)/.test(name);
}

/**
 * Gets all the attributes of the node that were "original" attributes in the
 * XML document being edited, by opposition to those attributes that exist only
 * for HTML rendering.
 *
 * @param node The node to process.
 *
 * @returns An object whose keys are attribute names and values are attribute
 * values.
 */
export function getOriginalAttributes(node: Element): Record<string, string> {
  const original: Record<string, string> =
    Object.create(null) as Record<string, string>;
  const attributes = node.attributes;
  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i];
    const localName = attr.localName!;
    if (isXMLAttrName(localName)) {
      original[decodeAttrName(localName)] = attr.value;
    }
  }
  return original;
}

let nextID = 0;

/**
 * Generates a new generic element id. This id is guaranteed to be unique for
 * the current run of wed. The ids generated by this function are meant to be
 * eventually replaced by something more permanent.
 *
 * @returns An element id.
 */
export function newGenericID(): string {
  return `WED-ID-${++nextID}`;
}

/**
 * @param ev A DOM event.
 *
 * @returns ``true`` if Control, Alt or Meta were held when the event was
 * created. Otherwise, ``false``.
 */
export function anySpecialKeyHeld(ev: Event): boolean {
  const anyEv = ev as KeyboardEvent;
  return anyEv.altKey || anyEv.ctrlKey || anyEv.metaKey;
}

/**
 * **This function is meant to be used in debugging.** It creates a
 * ``selenium_log`` object on ``window`` which is an array that contains the
 * series of ``obj`` passed to this function. Remember that ultimately
 * ``selenium_log`` is going to be serialized by Selenium. So go easy on what
 * you put in there and be aware that Selenium may have bugs that prevent
 * serialization of certain objects.
 *
 * @param args Objects to log.
 */
/* tslint:disable:no-any no-unsafe-any */
export function seleniumLog(...args: any[]): void {
  const w = window as any;
  if (w.selenium_log === undefined) {
    w.selenium_log = [];
  }

  w.selenium_log.push.apply(w.selenium_log, args);
}

function _exceptionStackTrace(err: any): string {
  try {
    throw err;
  }
  catch (e) {
    return e.stack;
  }
}
/* tslint:enable */

/**
 * **This function is meant to be used in debugging.** Gets a stack trace. This
 * is only as cross-platform as needed for the platforms we support.
 *
 * Support for IE 9 is missing because it was designed by baboons.
 */
export function stackTrace(): string {
  const err = new Error();
  if (err.stack != null) {
    return err.stack;
  }

  // If the stack is not filled already (true of IE 10, 11) then raise an
  // exception to fill it.
  return _exceptionStackTrace(err);
}

/**
 * Convert a "pattern object" to a string that can be shown to the user. This
 * function is meant to be used for "complex" name patterns that we may get from
 * salve. Note that a "pattern object" is the result of calling ``toObject()``
 * on the pattern. The goal of this function is to convert the pattern object to
 * a string that would be intepretable by the end user.
 *
 * An explanation about how this handles namespaces and wildcard patterns is in
 * order. In a Relax NG schema the name pattern ``*`` in the compact notation is
 * equivalent to ``<anyName/>`` in the expanded notation. And ``foo:*`` is
 * equivalent to ``<nsName ns="uri_of_foo">`` where ``uri_of_foo`` is the URI
 * that has been assocated with ``foo`` in the compact schema. It would be nice
 * if the function here could reuse this notation, but we cannot. Consider the
 * case where an Relax NG schema in the compact notation wants to declare a name
 * pattern which means "any name in the default namespace". In XML we express a
 * name in the default namespace currently in effect by simply not prefixing it
 * with a namespace name: whereas ``foo:bar`` is the ``bar`` element in the
 * ``foo`` namespace, ``bar`` is the ``bar`` element in the default
 * namespace. The pattern "any element in namespace foo" is represented with
 * ``foo:*``, however we cannot use ``*`` to mean "any element in the default
 * namespace", because ``*`` means "any name in any namespace whatsoever". The
 * compact notation forces the author of the schema to use a prefix for the
 * default namespace. And because of this, ``*`` means unambiguously "any
 * element in any namespace".
 *
 * So the ``*`` in the Relax NG schema becomes ``*:*`` here. "Any element in the
 * default namespace" is represented by ``*``. Thus ``foo:*`` and ``*`` can
 * stand in the same relation to one another as ``foo:bar`` and ``bar``.
 *
 * @param obj The "pattern object" to convert.
 * @param resolver The resolver to use to convert URIs to prefixes.
 * @returns The string representing the pattern.
 */
/* tslint:disable:no-any no-unsafe-any */
export function convertPatternObj(obj: any, resolver: any): string {
  // NameChoice
  if (obj.a != null && obj.b != null) {
    return `(${convertPatternObj(obj.a, resolver)}) or \
(${convertPatternObj(obj.b, resolver)})`;
  }

  let ret: string;

  // AnyName
  if (obj.pattern === "AnyName") {
    ret = "*:*";
  }
  else {
    // Name and NsName
    if (obj.ns === undefined) {
      throw new Error("unexpected undefined obj.ns");
    }

    if (obj.name !== undefined) {
      ret = resolver.unresolveName(obj.ns, obj.name);
      // Cannot unresolve, use the expanded name.
      if (ret === undefined) {
        ret = `{${obj.ns}}${obj.name}`;
      }
    }
    else {
      const ns = resolver.prefixFromURI(obj.ns);
      // If ns is undefined, we cannot resolve the URI, so we
      // display the expanded name.
      if (ns === undefined) {
        ret = `{${obj.ns}}`;
      }
      else {
        // An empty ns happens if the URI refers to the default
        // namespace.
        ret = (ns !== "") ? (`${ns}:`) : ns;
      }
      ret += "*";
    }
  }

  if (obj.except != null) {
    ret += ` except (${convertPatternObj(obj.except, resolver)})`;
  }
  return ret;
}
/* tslint:enable */

export function readFile(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * This is required to work around a problem when extending built-in classes
 * like ``Error``. Some of the constructors for these classes return a value
 * from the constructor, which is then picked up by the constructors generated
 * by TypeScript (same with ES6 code transpiled through Babel), and this messes
 * up the inheritance chain.
 *
 * See https://github.com/Microsoft/TypeScript/issues/12123.
 */
// tslint:disable:no-any
export function fixPrototype(obj: any, parent: Function): void {
  const oldProto: Function = Object.getPrototypeOf !== undefined ?
    Object.getPrototypeOf(obj) : (obj as any).__proto__;

  if (oldProto !== parent) {
    if (Object.setPrototypeOf !== undefined) {
      Object.setPrototypeOf(obj, parent.prototype);
    }
    else {
      (obj as any).__proto__ = parent.prototype;
    }
  }
}

export function suppressUnhandledRejections<P extends Promise<any>>(p: P): P {
  const pAsAny: any = p as any;
  if (pAsAny.suppressUnhandledRejections as boolean) {
    pAsAny.suppressUnhandledRejections();
  }

  return p;
}
// tslint:enable:no-any

//  LocalWords:  Mangalam MPL Dubeau util CSS wed's unencoded
