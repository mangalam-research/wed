/**
 * A meta for the TEI.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Meta as GenericMeta } from "wed/modes/generic/generic-meta";
import { Runtime } from "wed/runtime";
/**
 * Meta-information for a generic TEI schema.
 */
declare class TeiMeta extends GenericMeta {
    /**
     * @param runtime The runtime in which this meta is executing.
     * @param options The options to pass to the Meta.
     */
    constructor(runtime: Runtime, options: any);
    isInline(node: Element): boolean;
}
export { TeiMeta as Meta };
