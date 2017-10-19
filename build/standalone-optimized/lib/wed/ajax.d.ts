/**
 * Ajax utilities for wed.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as bluejax from "bluejax";
import "bootstrap";
export declare function make(baseOpts: any): {
    ajax: bluejax.AjaxCall;
    ajax$: bluejax.AjaxCall$;
};
