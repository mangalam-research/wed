/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
require.config({
 baseUrl: '/build/standalone/lib/',
 paths: {
   'browser_test': '../../../browser_test',
   'jquery': 'external/jquery-1.9.1',
   'bootstrap': 'external/bootstrap/js/bootstrap.min',
   'log4javascript': 'external/log4javascript',
   'jquery.bootstrap-growl': 'external/jquery.bootstrap-growl',
   'font-awesome': 'external/font-awesome'
 },
 shim: {
   'bootstrap': {
     deps: ["jquery"],
     exports: "jQuery.fn.popover",
     init: function () { jQuery.noConflict() }
   },
   'external/rangy/rangy-core': {
     exports: "rangy",
     init: function() { return this.rangy; }
   },
   'external/rangy/rangy-selectionsaverestore': {
     deps: ["external/rangy/rangy-core"],
     exports: "rangy.modules.SaveRestore"
   },
   'jquery.bootstrap-growl': {
     deps: ["jquery", "bootstrap"],
     exports: "jQuery.bootstrapGrowl"
   },
   'log4javascript': {
       exports: "log4javascript"
   }
 },
 config: {
     'wed/wed': {
         schema: 'browser_test/tei-simplified-rng.js',
         mode: {
             path: 'wed/modes/generic/generic',
             options: {
                 meta: 'wed/modes/generic/metas/tei_meta'
             }
         },
         // You certainly do not want this in actual deployment.
         ajaxlog: {
             url: "/build/ajax/log.txt"
         },
         // You certainly do not want this in actual deployment.
         save: {
             url: "/build/ajax/save.txt"
         }
     }
 },
 enforceDefine: true
});

//  LocalWords:  popup onerror findandself jQuery Dubeau MPL Mangalam
//  LocalWords:  txt tei ajax jquery
