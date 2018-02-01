/**
 * Wed-specific undo functionality.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "./undo"], function (require, exports, undo) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class extends the vanilla UndoGroup class by recording the
     * location of the caret when the group is created and when group
     * recording ends. This allows restoring the caret to sensible
     * positions before and after undoing or redoing.
     */
    var UndoGroup = /** @class */ (function (_super) {
        __extends(UndoGroup, _super);
        /**
         * @param desc The description of this group.
         *
         * @param editor The editor for which this undo group is created.
         */
        function UndoGroup(desc, editor) {
            var _this = _super.call(this, desc) || this;
            _this.editor = editor;
            _this.caretAsPathBefore = _this.getDataCaretAsPath();
            return _this;
        }
        UndoGroup.prototype.performUndo = function () {
            _super.prototype.performUndo.call(this);
            this.setDataCaretAsPath(this.caretAsPathBefore);
        };
        UndoGroup.prototype.performRedo = function () {
            _super.prototype.performRedo.call(this);
            if (this.caretAsPathAfter === undefined) {
                throw new Error("caretAsPathAfter is undefined, this indicates a corrupted state and thus an internal error");
            }
            this.setDataCaretAsPath(this.caretAsPathAfter);
        };
        /**
         * Get the current data caret position as a path.
         *
         * @returns A caret.
         */
        UndoGroup.prototype.getDataCaretAsPath = function () {
            var caret = this.editor.caretManager.getDataCaret(true);
            if (caret === undefined) {
                // Returning undefined for "the caret was undefined" would not
                // trap stupid mistakes in managing the data.
                return [undefined, undefined];
            }
            return [this.editor.dataUpdater.nodeToPath(caret.node), caret.offset];
        };
        /**
         * Set the data caret.
         *
         * @param caret A caret.
         */
        UndoGroup.prototype.setDataCaretAsPath = function (caret) {
            // [undefined, undefined] === the caret was undefined. We can't do anything.
            if (caret[0] === undefined && caret[1] === undefined) {
                return;
            }
            this.editor.caretManager.setCaret(this.editor.dataUpdater.pathToNode(caret[0]), caret[1]);
        };
        /**
         * This method can be used to record the caret position after the acts
         * recorded by this undo are performed. If the caret is recorded by means of
         * this method, then [[end]] will not record the caret position again. This
         * can be useful in cases for which it is not clear when an UndoGroup might
         * end. [[TextUndoGroup]] is a case in point. This method can be called any
         * number of times to update the caret position at the end of the group.
         */
        UndoGroup.prototype.recordCaretAfter = function () {
            this.caretAsPathAfter = this.getDataCaretAsPath();
        };
        UndoGroup.prototype.end = function () {
            if (this.caretAsPathAfter === undefined) {
                this.recordCaretAfter();
            }
        };
        return UndoGroup;
    }(undo.UndoGroup));
    exports.UndoGroup = UndoGroup;
    /**
     * Grouping of text operations should be limited in size. For instance, if the
     * user hits backspace to delete a whole sentence and then wants to undo this
     * operation. It is better to undo it in chunks instead of reinserting the whole
     * sentence. This class allows for limiting the length of such chunks.
     */
    var TextUndoGroup = /** @class */ (function (_super) {
        __extends(TextUndoGroup, _super);
        /**
         * @param desc The description of this group.
         *
         * @param editor The editor for which this undo group is created.
         *
         * @param undoList The list which will hold this group.
         *
         * @param limit The maximum number of undo operations that this group should
         * record.
         */
        function TextUndoGroup(desc, editor, undoList, limit) {
            var _this = _super.call(this, desc, editor) || this;
            _this.undoList = undoList;
            _this.limit = limit;
            return _this;
        }
        TextUndoGroup.prototype.record = function (undoToRecord) {
            if (this.list.length >= this.limit) {
                throw new Error("TextUndoGroup.record called beyond the limit");
            }
            _super.prototype.record.call(this, undoToRecord);
            if (this.list.length === this.limit) {
                this.undoList.endGroup();
            }
        };
        return TextUndoGroup;
    }(UndoGroup));
    exports.TextUndoGroup = TextUndoGroup;
});
//  LocalWords:  pathToNode nodeToPath Dubeau MPL Mangalam param UndoGroup
//  LocalWords:  TextUndoGroup caretAsPathAfter
//# sourceMappingURL=wundo.js.map