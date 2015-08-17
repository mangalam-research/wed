/**
 * @module kitchen-sink
 * @desc A demo module for wed
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define(["wed/wed", "jquery"], function (wed, $) {
// NOTE: PURL MUST HAVE BEEN LOADED WITH A <script> TAG.
var purled = purl();
var mode = purled.param('mode');
var file = purled.param('file');
var schema = purled.param('schema');
var localstorage = purled.param('localstorage');
var options_param = purled.param('options');

if (file !== undefined && localstorage !== undefined)
    throw new Error("file and localstorage defined: use one or " +
                    "the other");

function launch(text, file, options) {
    options = options || {};
    if (text && file)
        throw new Error("text and file cannot be both defined");
    var deps = [];
    if (file)
        deps.push("text!" + file);
    require(deps, function (file_content) {
        if (file_content)
            text = file_content;
        $(function () {
            var widget = document.getElementById("widget");
            if (mode)
                options.mode = { path: mode };

            if (schema) {
                switch (schema) {
                case "@math":
                    options.schema = "/build/schemas/tei-math-rng.js";
                    options.mode = {
                        path: 'wed/modes/generic/generic',
                        options: {
                            meta: {
                                path: 'wed/modes/generic/metas/tei_meta',
                                options: {
                                    metadata:
                                    '../../../../../schemas/tei-math-metadata.json'
                                }
                            }
                        }
                    };
                    break;
                default:
                    options.schema = schema;
                }
            }

            if (options_param === "noautoinsert")
                options.mode.options = { autoinsert: false };

            if (options_param === "ambiguous_fileDesc_insert")
                options.mode.options = { ambiguous_fileDesc_insert: true };

            if (options_param === "fileDesc_insert_needs_input")
                options.mode.options = { fileDesc_insert_needs_input: true };

            if (options_param === "hide_attributes")
                options.mode.options = { hide_attributes: true };

            window.wed_editor = new wed.Editor();
            window.wed_editor.init(widget, options, text);
        });
    });
}

if (localstorage) {
    // Show the link...
    var file_management_link = document.getElementById("fm-link");
    file_management_link.style.display = "";
    require(["localforage", "wed/savers/localforage"], function (
        localforage, wed_localforage) {
        wed_localforage.config();
        localforage.getItem(localstorage).then(function (value) {
            launch(value.data, undefined, {
                save: {
                    path: "wed/savers/localforage",
                    options: {
                        name: localstorage
                    }
                }
            });
        });
    });
}
else
    launch(undefined, file);

});
