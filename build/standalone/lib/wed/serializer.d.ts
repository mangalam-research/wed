/**
 * Serialize an XML tree. This serializer implements only as much as wed
 * currently needs. Notably, this does not currently serialize comments, CDATA,
 * or processing instructions.
 *
 * @param root The root of the document.
 *
 * @returns The serialized document.
 */
export declare function serialize(root: Element | Document | DocumentFragment): string;
