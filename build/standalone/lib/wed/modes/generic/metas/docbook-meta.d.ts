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
declare class DocBookMeta extends GenericMeta {
    /**
     * @param runtime The runtime in which this meta is executing.
     *
     * @param options The options to pass to the Meta.
     */
    constructor(runtime: Runtime, options: any);
}
export { DocBookMeta as Meta };
