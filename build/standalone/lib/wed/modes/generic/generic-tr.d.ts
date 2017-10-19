import { Transformation, TransformationData } from "wed/transformation";
import { Editor } from "wed/wed";
/**
 * @param forEditor The editor for which to create transformations.
 */
export declare function makeTagTr(forEditor: Editor): Record<string, Transformation<TransformationData>>;
