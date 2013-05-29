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
        return undefined;
    };

    // Modes must override this.
    this.makeDecorator = function () {
        return undefined;
    };

    // Modes must override this.
    this.getTransformationRegistry = function () {
        return undefined;
    };

    // Modes must override this.
    this.getContextualMenuItems = function () {
        return [];
    };

    this.destroy = function () {
    };
}).call(Mode.prototype);

exports.Mode = Mode;

});
