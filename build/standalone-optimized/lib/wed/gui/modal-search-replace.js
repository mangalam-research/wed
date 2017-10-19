define(["require", "exports", "module", "./search-replace"], function (require, exports, module, search_replace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Direction = search_replace_1.Direction;
    var ModalSearchReplace = (function () {
        function ModalSearchReplace(editor, scroller, direction) {
            this.search = new search_replace_1.SearchReplace(editor, scroller, direction);
            this.modal = editor.makeModal();
        }
        return ModalSearchReplace;
    }());
    exports.ModalSearchReplace = ModalSearchReplace;
});

//# sourceMappingURL=modal-search-replace.js.map
