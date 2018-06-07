/**
 * A "GUI selector" is a CSS selector apt to be used in the GUI tree.
 */
export declare class GUISelector {
    readonly value: string;
    private static __cache;
    /**
     * @param value The value that the selector holds.
     */
    private constructor();
    /**
     * Make a GUI selector from a CSS selector, as-is.
     *
     * @param selector The value that the selector will hold.
     */
    static makeVerbatim(selector: string): GUISelector;
    /**
     * Make a GUI selector from a data selector. The limitations on the selector
     * are the same as for [["wed/domutil".toGUISelector]].
     *
     * @param selector A selector fit for selecting in the data tree.
     *
     * @param namespaces The namespace mappings to use to convert prefixes in the
     * selector.
     *
     * @returns A [[GUISelector]] corresponding to the parameters used.
     */
    static fromDataSelector(selector: string, namespaces: Record<string, string>): GUISelector;
}
