/**
 * @module kitchen-sink
 * @desc A demo module for wed
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define(function (require) {
"use strict";

var wed = require("wed/wed");
var $ = require("jquery");
var URI = require("urijs/URI");
var lr = require("last-resort");
var onerror = require("wed/onerror");

// This installs last-resort on our current window and registers with it
// wed's error handler.
var onError = lr.install(window);
onError.register(onerror.handler);

var uri = new URI();
var query = uri.query(true);
var mode = query.mode;
var file = query.file;
var schema = query.schema;
var localstorage = query.localstorage;
var options_param = query.options;
var nodemo = query.nodemo;

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
                case "@docbook":
                    options.schema = "../../../schemas/docbook.js";
                    options.mode = {
                        path: 'wed/modes/generic/generic',
                        options: {
                            meta: {
                                path: 'wed/modes/generic/metas/docbook_meta',
                                options: undefined
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

            // We don't want a demo dialog to show up in testing.
            if (!nodemo) {
                if (!localstorage) {
                    options.demo =
                        "You will not be able to save your modifications.";
                }
                else {
                    options.demo =
                        "Your modifications will be saved in local storage.";
                }
            }
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
