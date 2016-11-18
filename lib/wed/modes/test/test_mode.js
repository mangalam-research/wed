/**
 * @module modes/test/test_mode
 * @desc A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/test/test_mode*/
function (require, exports, module) {
'use strict';

var util = require("wed/util");
var log = require("wed/log");
var Mode = require("wed/modes/generic/generic").Mode;
var oop = require("wed/oop");
var Action = require("wed/action").Action;
var transformation = require("wed/transformation");
var rangy = require("rangy");
var tei_meta = require("wed/modes/generic/metas/tei_meta");
var domutil = require("wed/domutil");
var Validator = require("./test_mode_validator").Validator;
var TestDecorator = require("./test_decorator").TestDecorator;
var _ = require("lodash");

var LOCAL_OPTIONS = ["ambiguous_fileDesc_insert",
                     "fileDesc_insert_needs_input",
                     "hide_attributes"];

/**
 * This mode is purely designed to help test wed, and nothing
 * else. Don't derive anything from it and don't use it for editing.
 *
 * @class
 * @extends module:modes/generic/generic~Mode
 * @param {Object} options The options for the mode.
 */
function TestMode (options) {
    var opts = _.omit(options, LOCAL_OPTIONS);
    Mode.call(this, opts);
    this._test_mode_options = _.pick(options, LOCAL_OPTIONS);

    if (this.constructor !== TestMode)
        throw new Error("this is a test mode; don't derive from it!");

    this._wed_options.metadata = {
        name: "Test",
        authors: ["Louis-Dominique Dubeau"],
        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
        license: "MPL 2.0",
        copyright:
        "2013, 2014 Mangalam Research Center for Buddhist Languages"
    };
    this._wed_options.label_levels = {
        max: 2,
        initial: 1
    };

    if (options.hide_attributes)
        this._wed_options.attributes = "hide";
}

oop.inherit(TestMode, Mode);

TestMode.prototype.init = function (editor) {
    Mode.prototype.init.call(this, editor);
    this._typeahead_action = new TypeaheadAction(
        this._editor, "Test typeahead", undefined,
        "<i class='fa fa-plus fa-fw'></i>", true);

    this._draggable = editor.makeModal({draggable: true});
    this._resizable = editor.makeModal({resizable: true});
    this._draggable_resizable = editor.makeModal({
        resizable: true,
        draggable: true,
    });

    this._draggable_action = new DraggableModalAction(
        this._editor, "Test draggable", undefined, undefined, true);
    this._resizable_action = new ResizableModalAction(
         this._editor, "Test resizable", undefined, undefined, true);
    this._draggable_resizable_action = new DraggableResizableModalAction(
         this._editor, "Test draggable resizable", undefined, undefined, true);
};

TestMode.prototype.getContextualActions = function (type, tag, container,
                                                    offset) {
    if (this._test_mode_options.fileDesc_insert_needs_input &&
        tag === "fileDesc" && type === "insert")
        return [new transformation.Transformation(
            this._editor, "insert", "foo", undefined, undefined, true,
            // We don't need a real handler because it will not be called.
            function () {})];

    var ret = Mode.prototype.getContextualActions.call(this, type, tag,
                                                      container, offset);

    if (this._test_mode_options.ambiguous_fileDesc_insert &&
        tag === "fileDesc" && type === "insert")
        // We just duplicate the transformation.
        ret = ret.concat(ret);

    if (tag === "ref" && (type === "insert" || type === "wrap")) {
        ret.push(this._typeahead_action, this._draggable_action,
                 this._resizable_action, this._draggable_resizable_action);
    }

    return ret;
};


TestMode.prototype.makeDecorator = function () {
    var obj = Object.create(TestDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this._meta, this._options].concat(args);
    TestDecorator.apply(obj, args);
    return obj;
};


TestMode.prototype.getValidator = function () {
    return new Validator(this._editor.gui_root, this._editor.data_root);
};


function TypeaheadAction() {
    Action.apply(this, arguments);
}

oop.inherit(TypeaheadAction, Action);

TypeaheadAction.prototype.execute = function (data) {
    var editor = this._editor;

    var substringMatcher = function(strs) {
        return function findMatches(q, cb) {
            var re = new RegExp(q, 'i');

            var matches = [];
            for (var i = 0, str; (str = strs[i]); ++i) {
                if (re.test(str))
                    matches.push({ value: str });
            }

            cb(matches);
        };
    };

    var test_data = [];
    for (var i = 0; i < 100; ++i)
        test_data.push("Test " + i);

    var options = {
        options: {
            autoselect: true,
            hint: true,
            highlight: true,
            minLength: 1
        },
        datasets: [{
            source: substringMatcher(test_data)
        }]
    };

    var pos = editor.computeContextMenuPosition(undefined, true);
    var typeahead =
            editor.displayTypeaheadPopup(pos.left, pos.top, 300,
                                         "Test", options,
                                 function (obj) {
        if (obj)
            editor.type(obj.value);
    });
    typeahead.hideSpinner();
    var range = editor.getSelectionRange();

    // This is purposely not as intelligent as what real mode would
    // need.
    if (range && !range.collapsed)
        typeahead.setValue(range.toString());
};

function DraggableModalAction() {
    Action.apply(this, arguments);
}

oop.inherit(DraggableModalAction, Action);

DraggableModalAction.prototype.execute = function (data) {
    var editor = this._editor;
    var modal = editor.mode._draggable;
    modal.modal();
};

function ResizableModalAction() {
    Action.apply(this, arguments);
}

oop.inherit(ResizableModalAction, Action);

ResizableModalAction.prototype.execute = function (data) {
    var editor = this._editor;
    var modal = editor.mode._resizable;
    modal.modal();
};

function DraggableResizableModalAction() {
    Action.apply(this, arguments);
}

oop.inherit(DraggableResizableModalAction, Action);

DraggableResizableModalAction.prototype.execute = function (data) {
    var editor = this._editor;
    var modal = editor.mode._draggable_resizable;
    modal.modal();
};


exports.Mode = TestMode;

});

//  LocalWords:  domutil metas tei oop util Mangalam MPL
//  LocalWords:  Dubeau
