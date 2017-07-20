import { Mode } from "wed/mode";
import { Transformation, TransformationData } from "wed/transformation";
import { Validator } from "wed/validator";
export interface Editor {
    validator: Validator;
    mode: Mode<any>;
    [key: string]: any;
}
/**
 * @param forEditor The editor for which to create transformations.
 */
export declare function makeTagTr(forEditor: Editor): Record<string, Transformation<TransformationData>>;
