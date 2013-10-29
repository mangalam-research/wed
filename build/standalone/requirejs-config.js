require.config({
    "baseUrl": "lib/",
    "paths": {
        "browser_test": "../../../browser_test",
        "jquery": "external/jquery-1.9.1",
        "bootstrap": "external/bootstrap/js/bootstrap.min",
        "log4javascript": "external/log4javascript",
        "jquery.bootstrap-growl": "external/jquery.bootstrap-growl",
        "font-awesome": "external/font-awesome"
    },
    "shim": {
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
        }
    },
    "config": {
        "wed/wed": {
            "schema": "../../../schemas/tei-simplified-rng.js",
            "mode": {
                "path": "wed/modes/generic/generic",
                "options": {
                    "meta": "wed/modes/generic/metas/tei_meta"
                }
            }
        }
    },
    "enforceDefine": true
});
