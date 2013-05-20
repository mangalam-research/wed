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
    this.getResolver = function () {
        return undefined;
    };

    // Modes must override this.
    this.makeDecorator = function (domlistener) {
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
