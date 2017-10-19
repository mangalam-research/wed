/**
 * This module is responsible for validating the document being edited in wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { EventSet, Grammar } from "salve";
import { ErrorData, Validator as BaseValidator, WorkingState } from "salve-dom";
import * as dloc from "./dloc";
export declare const INCOMPLETE: WorkingState;
export declare const WORKING: WorkingState;
export declare const INVALID: WorkingState;
export declare const VALID: WorkingState;
export interface ModeValidator {
    validateDocument(): ErrorData[];
}
/**
 * A document validator.
 */
export declare class Validator extends BaseValidator {
    private readonly modeValidators;
    /**
     * @param schema A path to the schema to pass to salve for validation. This is
     * a path that will be interpreted by RequireJS. The schema must have already
     * been prepared for use by salve. See salve's documentation. Or this can be a
     * ``Grammar`` object that has already been produced from ``salve``'s
     * ``constructTree``.
     *
     * @param root The root of the DOM tree to validate. This root contains the
     * document to validate but is not **part** of it.
     *
     * @param modeValidators The mode-specific validators to use.
     */
    constructor(schema: Grammar, root: Element | Document, modeValidators: ModeValidator[]);
    /**
     * Runs document-wide validation specific to the mode passed to
     * the validator.
     */
    _runDocumentValidation(): void;
    /**
     * Returns the set of possible events for the location specified by the
     * parameters.
     *
     * @param loc Location at which to get possibilities.
     *
     * @param container Together with ``index`` this parameter is interpreted to
     * form a location as would be specified by ``loc``.
     *
     * @param index Together with ``container`` this parameter is interpreted to
     * form a location as would be specified by ``loc``.
     *
     * @param attributes Whether we are interested in the attribute events of the
     * node pointed to by ``container, index``. If ``true`` the node pointed to by
     * ``container, index`` must be an element, and the returned set will contain
     * attribute events.
     *
     * @returns A set of possible events.
     */
    possibleAt(loc: dloc.DLoc, attributes?: boolean): EventSet;
    possibleAt(container: Node, index: number, attributes?: boolean): EventSet;
    /**
     * Validate a DOM fragment as if it were present at the point specified in the
     * parameters in the DOM tree being validated.
     *
     * WARNING: This method will not catch unclosed elements. This is because the
     * fragment is not considered to be a "complete" document. Unclosed elements
     * or fragments that are not well-formed must be caught by other means.
     *
     * @param loc The location in the tree to start at.
     *
     * @param container The location in the tree to start at, if ``loc`` is not
     * used.
     *
     * @param index The location in the tree to start at, if ``loc`` is not used.
     *
     * @param toParse The fragment to parse.
     *
     * @returns An array of errors if there is an error. Otherwise returns false.
     */
    speculativelyValidate(loc: dloc.DLoc, toParse: Node | Node[]): ErrorData[] | false;
    speculativelyValidate(container: Node, index: number, toParse: Node | Node[]): ErrorData[] | false;
    /**
     * Validate a DOM fragment as if it were present at the point specified in the
     * parameters in the DOM tree being validated.
     *
     * WARNING: This method will not catch unclosed elements. This is because the
     * fragment is not considered to be a "complete" document. Unclosed elements
     * or fragments that are not well-formed must be caught by other means.
     *
     * @param loc The location in the tree to start at.
     *
     * @param container The location in the tree to start at.
     *
     * @param index The location in the tree to start at.
     *
     * @param toParse The fragment to parse. This fragment must not be part of the
     * tree that the validator normally validates. (It can be **cloned** from that
     * tree.) This fragment must contain a single top level element which has only
     * one child. This child is the element that will actually be parsed.
     *
     * @returns An array of errors if there is an error. Otherwise returns false.
     */
    speculativelyValidateFragment(loc: dloc.DLoc, toParse: Element): ErrorData[] | false;
    speculativelyValidateFragment(container: Node, index: number, toParse: Element): ErrorData[] | false;
}
