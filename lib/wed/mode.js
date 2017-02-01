/**
 * @module mode
 * @desc The base class for modes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:mode */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");
var pubsub = require("./lib/pubsub");

/**
 * @classdesc A mode for wed should be implemented as a module which exports a
 * class derived from this class.
 *
 * It is illegal to call any methods on objects of this class before
 * the object emits {@link module:lib/pubsub#event:WED_MODE_READY
 * WED_MODE_READY}.
 *
 * @constructor
 * @param {Object} options The options for the mode. Each mode defines
 * what fields this object contains.
 *
 * @emits module:lib/pubsub#WED_MODE_READY
 */
function Mode (options) {
    // These fields are all "protected". Derived classes may change them.
    this._editor = undefined;
    this._options = options || {};
    this._wed_options = {
        label_levels: {
            max: 1,
            initial: 1
        }
    };
}

/**
 * This method is meant to be called by objects of this class to
 * signal that they are ready to be used.
 *
 * @emits module:lib/pubsub#WED_MODE_READY
 */
Mode.prototype._ready = function () {
    pubsub.publish(pubsub.WED_MODE_READY, this);
};

/**
 * This is called by the editor when a mode is ready to be
 * initialized. The mode could use this to add a toolbar above the
 * editor or add listeners to key events, etc.
 *
 * @param {module:wed~Editor} editor The editor onto which the mode is
 * being associated.
 */
Mode.prototype.init = function (editor) {
    this._editor = editor;
};

/**
 * Gets the options that the mode wants wed to use with this mode.
 *
 * @returns {Object} The options. Callers are not allowed to modify
 * the value returned.
 */
Mode.prototype.getWedOptions = function () {
    return this._wed_options;
};

/**
 * <p>This method returns a name resolver that is setup to resolve
 * names outside the context of an XML tree. It is sometimes useful to
 * use qualified names that do not depend on how a specific XML
 * document is structured, this method provides for such
 * functionality.</p>
 *
 * <p>Modes must override this method.</p>
 *
 * @returns {module:salve/name_resolver~NameResolver}
 */
Mode.prototype.getAbsoluteResolver = function () {
    throw new Error("getAbsoluteResolver must be overriden.");
};

/**
 * <p>Modes must override this method.</p>
 *
 * @returns {module:decorator~Decorator} The decorator that this mode
 * will use.
 */
Mode.prototype.makeDecorator = function () {
    throw new Error("makeDecorator must be overriden.");
};

/**
 * Modes must implement this method to specify what transformations
 * they allow based on state. The implementation should rely on the
 * <code>container</code> and <code>offset</code> position rather than
 * use the caret because the editor may be seeking information about
 * possible actions near to the caret.
 *
 * @param {Array.<string>|string} type The type or types of
 * transformations to return.
 * @param {string} tag The tag name we are interested in.
 * @param {Node} container The position in the data tree.
 * @param {integer} offset The position in the data tree.
 * @returns {Array.<module:action~Action>} An array
 * of actions.
 */
Mode.prototype.getContextualActions = function (type, tag, container, offset) {
    throw new Error("getContextualActions must be overriden");
};

/**
 * Get additional stylesheets to use to render the HTML.
 *
 * @returns {Array.<string>} An array of paths to the stylesheets to
 * load for this mode. These elements will be passed to RequireJS'
 * <code>require.toUrl</code> so they can be paths like those passed
 * to require or could be URLs.
 */
Mode.prototype.getStylesheets = function () {
    return [];
};

/**
 * @param {Node} element This is the element to examine.
 * @returns {Array.<Node>} An array of two elements. The first is the
 * node before editable contents, the second is the node after. Either
 * node can be null if there is nothing before or after editable
 * contents. Both are null if there is nothing around the editable
 * content.
 */
Mode.prototype.nodesAroundEditableContents = function (element) {
    var start = null;
    var start_ix;
    var end = null;
    var end_ix;

    var child = element.firstChild;
    var child_ix = 0;
    while(child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.classList.contains("_start_wrapper")) {
                start_ix = child_ix;
                start = child;
            }

            if (child.classList.contains("_end_wrapper")) {
                end_ix = child_ix;
                end = child;

                // We want the first end_wrapper we hit. There is no
                // need to continue.
                break;
            }
        }

        child = child.nextSibling;
        child_ix++;
    }

    if (start_ix !== undefined && end_ix !== undefined &&
       end_ix <= start_ix)
        throw new Error("end wrapper element unexpectedly appears before " +
                        "start wrapper element, or is also a start wrapper " +
                        "element");

    return [start, end];
};

/**
 * This method can be overriden by modes to provide the editor with
 * different placeholders for different elements. The default
 * implementation returns a default placeholder for all elements.
 *
 * @param {Node} element This is the element for which to make a
 * placeholder.
 * @returns {Node} A placeholder for the element.
 */
Mode.prototype.makePlaceholderFor = function(element) {
    return domutil.makePlaceholder();
};

/**
 * Returns a short description for an element. The element should be
 * named according to the mappings reported by the resolve returned by
 * {@link module:mode~Mode#getAbsoluteResolver
 * getAbsoluteResolver}. The default implementation returns
 * ``undefined`` for everything.
 *
 * While this API provides for the case where descriptions have not
 * been loaded yet or cannot be loaded, this class does not allow such
 * eventuality to occur. Derived classes could allow it.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The description. If the value
 * returned is ``undefined``, then description is not available. If the
 * value returned is ``null``, the description has not been loaded
 * yet.
 */
Mode.prototype.shortDescriptionFor = function (name) {
    return undefined;
};

/**
 * Returns a URL to the documentation for an element. The element should be
 * named according to the mappings reported by the resolve returned by
 * {@link module:mode~Mode#getAbsoluteResolver
 * getAbsoluteResolver}. The default implementation returns
 * ``undefined`` for everything.
 *
 * While this API provides for the case such URL have not been loaded
 * yet or cannot be loaded, this class does not allow such eventuality
 * to occur. Derived classes could allow it.
 *
 * @param {string} name The name of the element.
 * @returns {string|null|undefined} The URL. If the value returned is
 * ``undefined``, then the URL is not available. If the value returned is
 * ``null``, the URL has not been loaded yet.
 */
Mode.prototype.documentationLinkFor = function (name) {
    return undefined;
};

/**
 * Allows the mode to perform mode-specific checks on the
 * document. This method will be called by wed to obtain a
 * mode-specific validator to give to wed's own
 * validator. Mode-specific validators are meant to provide checks
 * that **cannot** be provided by a schema. It would be conceivable
 * for instance to call a schematron processor.
 *
 * The default implementation has no mode-specific checks and thus not
 * return a validator.
 *
 * @returns {module:mode_validator~ModeValidator|null} The validator
 * if this mode has one, or ``null`` if the mode does not.
 */
Mode.prototype.getValidator = function () {
    return null;
};




exports.Mode = Mode;

});

//  LocalWords:  RequireJS stylesheets subarrays overriden html MPL
//  LocalWords:  Mangalam Dubeau domutil
