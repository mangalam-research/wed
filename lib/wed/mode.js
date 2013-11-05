/**
 * @module mode
 * @desc The base class for modes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:mode */ function (require, exports, module) {
'use strict';

var domutil = require("./domutil");

/**
 * @classdesc A mode for wed should be implemented as a module which exports a
 * class derived from this class.
 *
 * @constructor
 * @param {Object} options The options for the mode. Each mode defines
 * what fields this object contains.
 */
function Mode (options) {
    this._editor = undefined;
    this._options = options || {};
}

/**
 * This static method must be used by the wed editor to allow the mode
 * to resolve those options which are paths to modules to be loaded
 * dynamically to their respective modules. For instance if a mode
 * expects an option <code>meta</code> to be a path to a module which
 * implements meta information, this function would resolve this path
 * to the actual module. This is a potentially asynchronous operation,
 * hence the need for a callback.
 *
 * @param {Object} options The options for the mode. Each mode defines
 * what fields this object contains.
 * @param {Function} callback A callback to call once the options have
 * been resolved.
 */
Mode.optionResolver = function (options, callback) {
    callback(options);
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
 * <p>This method returns a name resolver that is setup to resolve
 * names outside the context of an XML tree. It is sometimes useful to
 * use qualified names that do not depend on how a specific XML
 * document is structured, this method provides for such
 * functionality.</p>
 *
 * <p>Modes must override this method.</p>
 *
 * @returns {module:name_resolver~NameResolver}
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
 * Modes may override this method if they want to add elements to
 * contextual menus that are presented for text.
 *
 * @returns {Array.<Array>} An array of arrays. The subarrays have two
 * members: a menu item title, and a function to invoke when the item
 * is selected.
 */
Mode.prototype.getContextualMenuItems = function () {
    return [];
};

/**
 * Modes may implement this method if they want to override what
 * transformations they allow based on state. The default
 * implementation merely passes the call to the transformations
 * registry of the mode. The implementation should rely on the
 * <code>container</code> and <code>offset</code> position rather than
 * use the caret because the editor may be seeking information about
 * possible actions near to the caret.
 *
 * @param {Array.<String>|String} type The type or types of
 * transformations to return.
 * @param {String} tag The tag name we are interested in.
 * @param {Node} container The position in the data tree.
 * @param {Integer} offset The position in the data tree.
 * @returns {Array.<module:action~Action>} An array
 * of actions.
 */
Mode.prototype.getContextualActions = function (type, tag, container, offset) {
    return this._tr.getTagTransformations(type, tag);
};

/**
 * Get additional stylesheets to use to render the HTML.
 *
 * @returns {Array.<String>} An array of paths to the stylesheets to
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
 * node before editable contents, the second the node after. Either
 * node can be null if there is nothing before or after editable
 * contents. Both are null if there is nothing around the editable
 * content.
 */
Mode.prototype.nodesAroundEditableContents = function (element) {
    throw new Error("nodesAroundEditableContents must be overriden.");
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

exports.Mode = Mode;

});

//  LocalWords:  RequireJS stylesheets subarrays overriden html MPL
//  LocalWords:  Mangalam Dubeau domutil
