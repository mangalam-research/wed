require.config({
    "baseUrl": "lib/",
    "paths": {
        "jquery": "external/jquery-2.1.1",
        "bootstrap": "external/bootstrap/js/bootstrap.min",
        "log4javascript": "external/log4javascript",
        "jquery.bootstrap-growl": "external/jquery.bootstrap-growl",
        "font-awesome": "external/font-awesome",
        "pubsub-js": "external/pubsub",
        "xregexp": "external/xregexp",
        "text": "requirejs/text",
        "localforage": "external/localforage",
        "async": "external/async",
        "angular": "external/angular",
        "bootbox": "external/bootbox"
    },
    "packages": [
        {
            "name": "lodash",
            "location": "external/lodash"
        }
    ],
    "shim": {
        "xregexp": {
            "exports": "XRegExp"
        },
        "bootstrap": {
            "deps": [
                "jquery"
            ],
            "exports": "jQuery.fn.popover"
        },
        "external/rangy/rangy-core": {
            "exports": "rangy"
        },
        "external/rangy/rangy-selectionsaverestore": {
            "deps": [
                "external/rangy/rangy-core"
            ],
            "exports": "rangy.modules.SaveRestore"
        },
        "jquery.bootstrap-growl": {
            "deps": [
                "jquery",
                "bootstrap"
            ],
            "exports": "jQuery.bootstrapGrowl"
        },
        "log4javascript": {
            "exports": "log4javascript"
        },
        "angular": {
            "deps": [
                "jquery"
            ],
            "exports": "angular"
        },
        "bootbox": {
            "deps": [
                "bootstrap"
            ],
            "exports": "bootbox"
        }
    },
    "config": {
        "wed/wed": {
            "schema": "../../../schemas/tei-simplified-rng.js",
            "mode": {
                "path": "wed/modes/generic/generic",
                "options": {
                    "meta": {
                        "path": "wed/modes/generic/metas/tei_meta",
                        "options": {
                            "metadata": "../../../../../schemas/tei-metadata.json"
                        }
                    }
                }
            }
        }
    },
    "waitSeconds": 12,
    "enforceDefine": true,
    "bundles": {
        "wed/wed": [
            "wed/log",
            "wed/onerror",
            "wed/savers/localforage",
            "wed/browsers"
        ]
    }
});