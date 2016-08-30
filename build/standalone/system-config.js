/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */

SystemJS.config({
 baseURL: 'lib/',
 pluginFirst: true,
 paths: {
   'browser_test/*': '/browser_test/*',
   'test-files/*': '/build/test-files/*',
   jquery: 'external/jquery.js',
   bootstrap: 'external/bootstrap/js/bootstrap.min.js',
   log4javascript: 'external/log4javascript.js',
   'jquery.bootstrap-growl': 'external/jquery.bootstrap-growl.js',
   'font-awesome': 'external/font-awesome.js',
   'pubsub-js': 'external/pubsub.js',
   xregexp: 'external/xregexp.js',
   text: 'system/text.js',
   localforage: 'external/localforage.js',
   async: 'external/async.js',
   angular: 'external/angular.js',
   bootbox: 'external/bootbox.js',
   typeahead: 'external/typeahead.bundle.min.js',
   'urijs/*': 'external/urijs/*.js',
   interact: 'external/interact.min.js',
   'merge-options': 'external/merge-options.js',
   'is-plain-obj': 'external/is-plain-obj.js',
   lodash: 'external/lodash/main.js',
   optional: 'system/optional.js',
 },
 packages: {
     '': {
         defaultExtension: "js",
         format: 'amd',
         meta: {
             "system/optional.js": {
                 format: "cjs",
             },
             'external/rangy/rangy-selectionsaverestore.js': {
                 format: 'global',
                 deps: ["external/rangy/rangy-core"],
             },
             'system/text.js': {
                 format: 'cjs'
             },
             'external/xregexp*.js': {
                 format: 'cjs',
             },
             'external/bootstrap/*.js': {
                 format: 'global',
                 deps: ["jquery"],
                 exports: "jQuery.fn.popover",
             },
             'external/jquery.bootstrap-growl.js': {
                 format: 'global',
                 deps: ["jquery", "bootstrap"],
             },
             'external/log4javascript.js': {
                 format: 'amd',
                 scriptLoad: true,
                 exports: "log4javascript"
             },
             'external/angular*.js': {
                 // AngularJS can use jQuery optionally. However, in our application
                 // we MUST have jQuery loaded and available for Angular to use it.
                 format: 'global',
                 deps: ["jquery"],
                 exports: "angular"
             },
             'external/bootbox*.js': {
                 format: 'global',
                 deps: ["bootstrap"],
                 exports: "bootbox"
             },
             'external/typeahead*.js': {
                 format: 'global',
                 deps: ['jquery'],
                 exports: 'Bloodhound'
             }
         }
     },
 },
 // waitSeconds: 12,
 // enforceDefine: true
});

System.set(System.normalizeSync("wed/config.js"), System.newModule({
    config: {
        schema: '../../../schemas/tei-simplified-rng.js',
        mode: {
            path: 'wed/modes/generic/generic',
            options: {
                meta: {
                    path: 'wed/modes/generic/metas/tei_meta',
                    options: {
                        metadata: '../../../../../schemas/tei-metadata.json'
                    }
                }
            }
        },
        // You certainly do not want this in actual deployment.
        ajaxlog: {
            url: "/build/ajax/log.txt"
        },
        // You certainly do not want this in actual deployment.
        save: {
            path: 'wed/savers/ajax',
            options: {
                url: "/build/ajax/save.txt"
            }
        }
    }
}));

//  LocalWords:  popup onerror findandself jQuery Dubeau MPL Mangalam
//  LocalWords:  txt tei ajax jquery
