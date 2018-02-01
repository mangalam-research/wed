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
export declare function distFromDeltas(delta1: number, delta2: number): number;
/**
 * Measures the distance of a point from a rectangle. If the point is in the
 * rectangle or touches it, the distance is 0. In the nomenclature below, left
 * and right are on the X axis and top and bottom on the Y axis.
 *
 * @param x The x coordinate of the point.
 *
 * @param y The y coordinate of the point.
 *
 * @param left The left coordinate of the rectangle.
 *
 * @param top The top coordinate of the rectangle.
 *
 * @param right The right coordinate of the rectangle.
 *
 * @param bottom The bottom coordinate of the rectangle.
 *
 * @returns The distance.
 */
export declare function distFromRect(x: number, y: number, left: number, top: number, right: number, bottom: number): number;
/**
 * Measures the absolute horizontal and vertical distances of a point from a
 * rectangle. If the point is in the rectangle or touches it, the distance is
 * 0. In the nomenclature below, left and right are on the X axis and top and
 * bottom on the Y axis.
 *
 * @param x The x coordinate of the point.
 *
 * @param y The y coordinate of the point.
 *
 * @param left The left coordinate of the rectangle.
 *
 * @param top The top coordinate of the rectangle.
 *
 * @param right The right coordinate of the rectangle.
 *
 * @param bottom The bottom coordinate of the rectangle.
 *
 * @returns The distance.
 */
export declare function distsFromRect(x: number, y: number, left: number, top: number, right: number, bottom: number): {
    x: number;
    y: number;
};
/**
 * Escape character in CSS class that could cause trouble in CSS
 * selectors. *This is not a general solution.* It supports enough for the needs
 * of wed.
 *
 * @param cls The class
 *
 * @returns The escaped class.
 */
export declare function escapeCSSClass(cls: string): string;
/**
 * Get the original element name of a node created for wed's data tree.
 *
 * @param el The element whose name we want.
 *
 * @returns The name.
 */
export declare function getOriginalName(el: Element): string;
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
export declare function classFromOriginalName(name: string, namespaces: Record<string, string>): string;
/**
 * Convert a string to a sequence of char codes. Each char code will be preceded
 * by the character ``x``. The char codes are converted to hexadecimal.
 *
 * This is meant to be used by wed's internal code.
 *
 * @private
 *
 * @param str The string to encode.
 *
 * @returns The encoded string.
 */
export declare function stringToCodeSequence(str: string): string;
/**
 * Convert a code sequence created with [[stringToCodeSequence]] to a string.
 *
 * This is meant to be used by wed's internal code.
 *
 * @private
 *
 * @param str The sequence to decode.
 *
 * @returns The decoded string.
 */
export declare function codeSequenceToString(str: string): string;
/**
 * Encode the difference between an original string, and a modified string. This
 * is a specialized function designed to handle the difference between the name
 * we want to set for an attribute, and the name that HTML actually records.
 *
 * This function records the difference as a series of steps to recover the
 * original string:
 *
 * - ``g[number]`` means take ``[number]`` characters from the modified string
 *   as they are.
 *
 * - ``m[number]`` means remove ``[number]`` characters from the modified
 *   string.
 *
 * - ``p[codes]`` means add the codes ``[codes]`` to the modified string.
 *
 * - ``u[number]`` means convert ``[number]`` characters from the modified
 *   string to uppercase.
 *
 * This is meant to be used by wed's internal code.
 *
 * @private
 *
 * @param orig The original.
 *
 * @param modified The modified string.
 *
 * @returns The difference, encoded as a string.
 */
export declare function encodeDiff(orig: string, modified: string): string;
/**
 * Decode the diff produced with [[encodeDiff]].
 *
 * This is meant to be used by wed's internal code.
 *
 * @private
 *
 * @param name The name, after encoding.
 *
 * @param diff The diff.
 *
 * @returns The decoded attribute name.
 */
export declare function decodeDiff(name: string, diff: string): string;
/**
 * Transforms an attribute name from wed's data tree to the original attribute
 * name before the data was transformed for use with wed. This reverses the
 * transformation done with [[encodeAttrName]].
 *
 * @param encoded The encoded name.
 *
 * @returns A structure containing the decoded name the optional qualifier.
 */
export declare function decodeAttrName(encoded: string): {
    name: string;
    qualifier: string | undefined;
};
/**
 * Transforms an attribute name from its unencoded form in the original XML data
 * (before transformation for use with wed) to its encoded name.
 *
 * The first thing this algorithm does is compute a difference between the
 * original XML name and how HTML will record it. The issue here is that XML
 * allows more characters in a name than what HTML allows and doing
 * ``setAttribute(name, value)`` will silently convert ``name`` to something
 * HTML likes. The issue most frequently encountered is that uppercase letters
 * are encoded as lowercase. This is especially vexing seeing as XML allows the
 * attribute names ``x`` and ``X`` to exist as different attributes, whereas
 * HTML does not. For HTML ``x`` and ``X`` are the same attribute. This function
 * records any differences between the original name and the way HTML records it
 * with a diff string that is appended to the final name after a dash. If
 * nothing appears after the final dash, then the HTML name and the XML name are
 * the same.
 *
 * A sequence of three dashes or more is converted by adding another dash. (So
 * sequences of single dash, or a pair of dashes remain unchanged. But all
 * sequences of 3 dashes or more gets an additional dash.)
 *
 * A colon (``:``) is converted to three dashes ``---``.
 *
 * After transformation above the name is prepended with ``data-wed-`` and it is
 * appended with the diff described above.
 *
 * Examples:
 *
 * - ``foo:bar`` becomes ``data-wed-foo---bar-``. Note how the diff is
 *    empty, because ``foo:bar`` can be represented as-is in HTML.
 *
 * - ``MOO:aBc---def`` becomes ``data-wed-moo---abc----def-u3g2u1``. Note the
 *   diff suffix, which allows restoring the orignal case.
 *
 * When ``qualifier`` is used, the qualifier is added just after ``data-wed-``
 * and is prepended and appended with a dash. So ``foo:bar`` with the qualifier
 * ``ns`` would become ``data-wed--ns-foo---bar-``. The addition of a dash in
 * front of the qualifier makes it impossible to confuse an encoding that has a
 * qualifier from one that does not, as XML attribute names are not allowed to
 * start with a dash.
 *
 * @param name The unencoded name (i.e. the attribute name as it is in XML).
 *
 * @param qualifier An optional qualifier.
 *
 * @returns The encoded name.
 */
export declare function encodeAttrName(name: string, qualifier?: string): string;
/**
 * Determines whether a ``data-wed-`` attribute corresponds to an XML attribute.
 */
export declare function isXMLAttrName(name: string): boolean;
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
export declare function getOriginalAttributes(node: Element): Record<string, string>;
/**
 * Generates a new generic element id. This id is guaranteed to be unique for
 * the current run of wed. The ids generated by this function are meant to be
 * eventually replaced by something more permanent.
 *
 * @returns An element id.
 */
export declare function newGenericID(): string;
/**
 * @param ev A DOM event.
 *
 * @returns ``true`` if Control, Alt or Meta were held when the event was
 * created. Otherwise, ``false``.
 */
export declare function anySpecialKeyHeld(ev: Event): boolean;
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
export declare function seleniumLog(...args: any[]): void;
/**
 * **This function is meant to be used in debugging.** Gets a stack trace. This
 * is only as cross-platform as needed for the platforms we support.
 *
 * Support for IE 9 is missing because it was designed by baboons.
 */
export declare function stackTrace(): string;
/**
 * Convert a "pattern object" to a string that can be shown to the user. This
 * function is meant to be used for "complex" name patterns that we may get from
 * salve. Note that a "pattern object" is the result of calling ``toObject()``
 * on the pattern. The goal of this function is to convert the pattern object to
 * a string that would be interpretable by the end user.
 *
 * An explanation about how this handles namespaces and wildcard patterns is in
 * order. In a Relax NG schema the name pattern ``*`` in the compact notation is
 * equivalent to ``<anyName/>`` in the expanded notation. And ``foo:*`` is
 * equivalent to ``<nsName ns="uri_of_foo">`` where ``uri_of_foo`` is the URI
 * that has been associated with ``foo`` in the compact schema. It would be nice
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
export declare function convertPatternObj(obj: any, resolver: any): string;
export declare function readFile(file: File): Promise<string>;
/**
 * This is required to work around a problem when extending built-in classes
 * like ``Error``. Some of the constructors for these classes return a value
 * from the constructor, which is then picked up by the constructors generated
 * by TypeScript (same with ES6 code transpiled through Babel), and this messes
 * up the inheritance chain.
 *
 * See https://github.com/Microsoft/TypeScript/issues/12123.
 */
export declare function fixPrototype(obj: any, parent: Function): void;
export declare function suppressUnhandledRejections<P extends Promise<any>>(p: P): P;
