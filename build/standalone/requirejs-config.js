require.config({
    "baseUrl": "lib/",
    "paths": {
        "test-files": "../../test-files/",
        "jquery": "external/jquery",
        "bootstrap": "external/bootstrap/js/bootstrap.min",
        "log4javascript": "external/log4javascript",
        "font-awesome": "external/font-awesome",
        "xregexp": "external/xregexp",
        "text": "requirejs/text",
        "optional": "requirejs/optional",
        "localforage": "external/localforage",
        "async": "external/async",
        "angular": "external/angular",
        "bootbox": "external/bootbox",
        "typeahead": "external/typeahead.bundle.min",
        "urijs": "external/urijs",
        "interact": "external/interact.min",
        "merge-options": "external/merge-options",
        "is-plain-obj": "external/is-plain-obj",
        "bluebird": "external/bluebird",
        "last-resort": "external/last-resort",
        "rangy": "external/rangy/rangy-core",
        "salve": "external/salve",
        "salve-dom": "external/salve-dom",
        "bootstrap-notify": "external/bootstrap-notify",
        "dexie": "external/dexie.min",
        "bluejax": "external/bluejax",
        "bluejax.try": "external/bluejax.try",
        "slug": "external/slug",
        "rxjs": "external/Rx",
        "ajv": "external/ajv.min"
    },
    "packages": [
        {
            "name": "lodash",
            "location": "external/lodash"
        }
    ],
    "map": {
        "*": {
            "bootstrap": "wed/patches/bootstrap",
            "last-resort": "wed/glue/last-resort",
            "wed/modes/generic/metadata-schema.json": "text!wed/modes/generic/metadata-schema.json",
            "wed/wed-options-schema.json": "text!wed/wed-options-schema.json"
        },
        "wed/glue/last-resort": {
            "last-resort": "last-resort"
        },
        "wed/patches/bootstrap": {
            "bootstrap": "bootstrap"
        },
        "bootbox": {
            "jquery": "bootstrap"
        }
    },
    "shim": {
        "bootstrap": {
            "deps": [
                "jquery"
            ],
            "exports": "jQuery.fn.popover",
            "init": function init($) {
        "use strict";
        return $;
      }
        },
        "angular": {
            "deps": [
                "jquery"
            ],
            "exports": "angular"
        },
        "typeahead": {
            "deps": [
                "jquery"
            ],
            "exports": "Bloodhound"
        }
    },
    "waitSeconds": 12,
    "enforceDefine": true
});
