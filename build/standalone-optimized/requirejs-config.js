require.config({
    "baseUrl": "lib/",
    "paths": {
        "browser_test": "../../../browser_test",
        "jquery": "external/jquery-1.9.1",
        "bootstrap": "external/bootstrap/js/bootstrap.min",
        "log4javascript": "external/log4javascript",
        "jquery.bootstrap-growl": "external/jquery.bootstrap-growl",
        "font-awesome": "external/font-awesome",
        "wed/log": "wed/wed",
        "wed/oop": "wed/wed",
        "wed/lib/simple_event_emitter": "wed/wed",
        "wed/saver": "wed/wed",
        "salve/name_resolver": "wed/wed",
        "salve/util": "wed/wed",
        "salve/oop": "wed/wed",
        "salve/hashstructs": "wed/wed",
        "salve/set": "wed/wed",
        "salve/validate": "wed/wed",
        "wed/util": "wed/wed",
        "wed/validator": "wed/wed",
        "wed/domutil": "wed/wed",
        "wed/jquery.findandself": "wed/wed",
        "wed/domlistener": "wed/wed",
        "wed/mutation_domlistener": "wed/wed",
        "wed/updater_domlistener": "wed/wed",
        "wed/refman": "wed/wed",
        "wed/action": "wed/wed",
        "wed/transformation": "wed/wed",
        "wed/undo": "wed/wed",
        "wed/wundo": "wed/wed",
        "wed/jqutil": "wed/wed",
        "wed/tree_updater": "wed/wed",
        "wed/gui_updater": "wed/wed",
        "wed/undo_recorder": "wed/wed",
        "wed/key": "wed/wed",
        "wed/key_constants": "wed/wed",
        "wed/lib/conditioned": "wed/wed",
        "wed/gui/modal": "wed/wed",
        "wed/gui/context_menu": "wed/wed",
        "wed/exceptions": "wed/wed",
        "wed/onerror": "wed/wed",
        "wed/build-info": "wed/wed",
        "wed/onbeforeunload": "wed/wed",
        "wed/wed": "wed/wed",
        "wed/mode": "wed/wed",
        "wed/decorator": "wed/wed",
        "wed/modes/generic/generic_decorator": "wed/wed",
        "wed/modes/generic/generic_tr": "wed/wed",
        "wed/modes/generic/generic": "wed/wed",
        "wed/modes/generic/generic_meta": "wed/wed"
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
