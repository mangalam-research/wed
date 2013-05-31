define(function (require, exports, module) {
'use strict';

function Mode () {
    this._editor = undefined;
}

(function () {
    this.init = function (editor) {
        this._editor = editor;
    };

    // Modes must override this.
    this.getAbsoluteResolver = function () {
        throw new Error("getAbsoluteResolver must be overriden.");
    };

    // Modes must override this.
    this.makeDecorator = function () {
        throw new Error("makeDecorator must be overriden.");
    };

    // Modes must override this.
    this.getTransformationRegistry = function () {
        throw new Error("getTransformationRegistry must be overriden.");
    };

    // Modes can override this.
    this.getContextualMenuItems = function () {
        return [];
    };

    /**
     * @method
     * @name Mode#nodesAroundEditableContents
     * @param {Node} element This is the element to examine.
     * @returns {Array.<Node>} An array of two elements. The first is
     * the node before editable contents, the second the node
     * after. Either node can be null if there is nothig before or
     * after editable contents. Both are null if there is nothing
     * around the editable content.
     */
    this.nodesAroundEditableContents = function (element) {
        throw new Error("nodesAroundEditableContents must be overriden.");
    };
}).call(Mode.prototype);

exports.Mode = Mode;

});
