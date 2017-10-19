/**
 * A collection of stock modals for an editor instance.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "./build-info"], function (require, exports, module, buildInfo) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A collection of stock modals.
     */
    var StockModals = /** @class */ (function () {
        function StockModals(maker) {
            this.maker = maker;
            this.modals = new Map();
        }
        StockModals.prototype.getModal = function (name) {
            var modal = this.modals.get(name);
            if (modal === undefined) {
                modal = this.make(name);
                this.modals.set(name, modal);
            }
            return modal;
        };
        StockModals.prototype.make = function (name) {
            var modal = this.maker.makeModal();
            switch (name) {
                case "limitation":
                    modal.setTitle("Cannot proceed");
                    break;
                case "paste":
                    modal.setTitle("Invalid structure");
                    modal.setBody("<p>The data you are trying to paste appears to be \
XML. However, pasting it here will result in a structurally invalid document. \
Do you want to paste it as text instead? (If you answer negatively, the data \
won't be pasted at all.)<p>");
                    modal.addYesNo();
                    break;
                case "straddling":
                    modal.setTitle("Invalid modification");
                    modal.setBody("<p>The text selected straddles disparate \
elements of the document. You may be able to achieve what you want to do by \
selecting smaller sections.<p>");
                    modal.addButton("Ok", true);
                    break;
                case "help":
                    var docLink = this.maker.docLink;
                    modal.setTitle("Help");
                    modal.setBody("\n<p>Click <a href='" + docLink + "' target='_blank'>this link</a> to see\nwed's generic help. The link by default will open in a new tab.</p>\n<p>The key combinations with Ctrl below are done with Command in OS X.</p>\n<ul>\n  <li>Clicking the right mouse button on the document contents brings up a\ncontextual menu.</li>\n  <li>F1: help</li>\n  <li>Ctrl-[: Decrease the label visibility level.</li>\n  <li>Ctrl-]: Increase the label visibility level.</li>\n  <li>Ctrl-s: Save</li>\n  <li>Ctrl-x: Cut</li>\n  <li>Ctrl-v: Paste</li>\n  <li>Ctrl-c: Copy</li>\n  <li>Ctrl-z: Undo</li>\n  <li>Ctrl-y: Redo</li>\n  <li>Ctrl-/: Bring up a contextual menu.</li>\n  <li>Ctrl-f: Quick search forward.</li>\n  <li>Ctrl-b: Quick search backwards.</li>\n  <li>Ctrl-Shift-f: Search forward.</li>\n  <li>Ctrl-Shift-b: Search backwards.</li>\n</ul>\n<p class='wed-build-info'>Build descriptor: " + buildInfo.desc + "<br/>\nBuild date: " + buildInfo.date + "</p>");
                    modal.addButton("Close", true);
                    break;
                case "disconnect":
                    modal.setTitle("Disconnected from server!");
                    modal.setBody("It appears your browser is disconnected from the server. Editing is \
frozen until the connection is reestablished. Dismissing this dialog will \
retry saving. If the operation is successful, you'll be able to continue \
editing. If not, this message will reappear.");
                    modal.addButton("Retry", true);
                    break;
                case "editedByOther":
                    modal.setTitle("Edited by another!");
                    modal.setBody("Your document was edited by someone else since you last loaded or \
saved it. You must reload it before trying to edit further.");
                    modal.addButton("Reload", true);
                    break;
                case "tooOld":
                    modal.setTitle("Newer version!");
                    modal.setBody("There is a newer version of the editor. You must reload it before \
trying to edit further.");
                    modal.addButton("Reload", true);
                    break;
                default:
                    // This will err at compilation time if we forget a case above.
                    var badName = name;
                    // If we do get here by mistake, we get a runtime error.
                    throw new Error("cannot handle name " + badName);
            }
            return modal;
        };
        return StockModals;
    }());
    exports.StockModals = StockModals;
});
//  LocalWords:  MPL editedByOther tooOld href docLink wed's Ctrl ul li runtime
//  LocalWords:  badName

//# sourceMappingURL=stock-modals.js.map
