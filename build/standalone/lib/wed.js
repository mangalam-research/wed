var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
define(["require", "exports", "./wed/convert", "./wed/domtypeguards", "./wed/domutil", "./wed/editor", "./wed/exceptions", "./wed/input-trigger-factory", "./wed/key", "./wed/key-constants", "./wed/labelman", "./wed/object-check", "./wed/runtime", "./wed/saver", "./wed/transformation", "./wed/tree-updater", "./wed/util", "./wed/action", "./wed/decorator", "./wed/dloc", "./wed/domlistener", "./wed/editor", "./wed/gui-selector", "./wed/mode", "./wed/undo", "./wed/validator", "./wed/gui/button", "./wed/gui/context-menu", "./wed/gui/modal", "./wed/gui/tooltip", "./wed/gui/typeahead-popup"], function (require, exports, convert, domtypeguards, domutil, editor_1, exceptions, inputTriggerFactory, key, keyConstants, labelman, objectCheck, runtime_1, saver, transformation, treeUpdater, util, action_1, decorator_1, dloc_1, domlistener_1, editor_2, gui_selector_1, mode_1, undo_1, validator_1, button_, contextMenu_, modal_, tooltip_, typeaheadPopup_) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    convert = __importStar(convert);
    domtypeguards = __importStar(domtypeguards);
    domutil = __importStar(domutil);
    exceptions = __importStar(exceptions);
    inputTriggerFactory = __importStar(inputTriggerFactory);
    key = __importStar(key);
    keyConstants = __importStar(keyConstants);
    labelman = __importStar(labelman);
    objectCheck = __importStar(objectCheck);
    saver = __importStar(saver);
    transformation = __importStar(transformation);
    treeUpdater = __importStar(treeUpdater);
    util = __importStar(util);
    button_ = __importStar(button_);
    contextMenu_ = __importStar(contextMenu_);
    modal_ = __importStar(modal_);
    tooltip_ = __importStar(tooltip_);
    typeaheadPopup_ = __importStar(typeaheadPopup_);
    exports.convert = convert;
    exports.domtypeguards = domtypeguards;
    exports.domutil = domutil;
    exports.exceptions = exceptions;
    exports.inputTriggerFactory = inputTriggerFactory;
    exports.key = key;
    exports.keyConstants = keyConstants;
    exports.labelman = labelman;
    exports.objectCheck = objectCheck;
    exports.Runtime = runtime_1.Runtime;
    exports.saver = saver;
    exports.transformation = transformation;
    exports.treeUpdater = treeUpdater;
    exports.util = util;
    function makeEditor(widget, options) {
        return new editor_1.Editor(widget, options);
    }
    exports.makeEditor = makeEditor;
    exports.Action = action_1.Action;
    exports.Decorator = decorator_1.Decorator;
    exports.DLoc = dloc_1.DLoc;
    exports.DLocRoot = dloc_1.DLocRoot;
    exports.DOMListener = domlistener_1.DOMListener;
    exports.version = editor_2.version;
    exports.GUISelector = gui_selector_1.GUISelector;
    exports.BaseMode = mode_1.BaseMode;
    exports.UndoMarker = undo_1.UndoMarker;
    exports.Validator = validator_1.Validator;
    var gui;
    (function (gui) {
        gui.button = button_;
        gui.contextMenu = contextMenu_;
        gui.modal = modal_;
        gui.tooltip = tooltip_;
        gui.typeaheadPopup = typeaheadPopup_;
    })(gui = exports.gui || (exports.gui = {}));
});
//  LocalWords:  domutil DLocRoot runtime MPL
//# sourceMappingURL=wed.js.map