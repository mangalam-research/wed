import { InputTrigger } from "./input-trigger";
import { Key } from "./key";
export declare type Editor = any;
/**
 * Makes an input trigger that splits and merges consecutive elements.
 *
 * @param editor The editor for which to create the input trigger.
 *
 * @param elementName A CSS selector that determines which element we want to
 * split or merge. For instance, to operate on all paragraphs, this parameter
 * could be ``"p"``.
 *
 * @param splitKey The key which splits the element.
 *
 * @param mergeWithPreviousKey The key which merges the element with its
 * previous sibling.
 *
 * @param mergeWithNextKey The key which merges the element with its next
 * sibling.
 *
 * @returns The input trigger.
 */
export declare function makeSplitMergeInputTrigger(editor: Editor, elementName: string, splitKey: Key, mergeWithPreviousKey: Key, mergeWithNextKey: Key): InputTrigger;
