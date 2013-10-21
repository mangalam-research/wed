/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
require.config({
 baseUrl: '/build/standalone/lib/',
 paths: {
   'jquery': 'jquery-1.9.1',
   'bootstrap': 'bootstrap/js/bootstrap.min'
 },
 shim: {
   'bootstrap': {
     deps: ["jquery"],
     exports: "jQuery.fn.popover",
     init: function () { jQuery.noConflict() }
   },
   'rangy/rangy-core': {
     exports: "rangy",
     init: function() { return this.rangy; }
   },
   'rangy/rangy-selectionsaverestore': {
     deps: ["rangy/rangy-core"],
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
