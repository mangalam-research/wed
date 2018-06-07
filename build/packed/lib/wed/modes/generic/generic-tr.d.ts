import { EditorAPI, transformation } from "wed";
import Transformation = transformation.Transformation;
import NamedTransformationData = transformation.NamedTransformationData;
/**
 * @param forEditorAPI The editor for which to create transformations.
 */
export declare function makeTagTr(forEditor: EditorAPI): Record<string, Transformation<NamedTransformationData>>;
