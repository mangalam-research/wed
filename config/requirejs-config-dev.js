require.config({
 baseUrl: '/build/standalone/lib/',
 paths: {
   'jquery': 'jquery-1.9.1',
   'bootstrap': 'bootstrap/js/bootstrap.min',
   'test': '../../../browser_test/'
 },
 shim: {
   'bootstrap': {
     deps: ["jquery"], 
     exports: "jQuery.fn.popover"
   },
   'bootstrap-contextmenu': {
     deps: ["bootstrap"],
     exports: "jQuery.fn.contextmenu"
   },
   'rangy/rangy-core': {
     exports: "rangy",
     init: function() { return this.rangy; }
   },
   'rangy/rangy-selectionsaverestore': {
     deps: ["rangy/rangy-core"],
     exports: "rangy.modules.SaveRestore"
   },
   'wed/jquery.findandself': {
     deps: ["jquery"], 
     exports: "jQuery.fn.findAndSelf"
   },
   'mocha/mocha': {
     exports: "mocha",
     init: function () { this.mocha.setup('bdd'); return this.mocha; }
   }
 },
 config: {
     'test/validator_test': {
         schema: 'test/simplified-rng.js',
         to_parse: '../../test-files/to_parse_converted.xml',
         percent_to_parse: '../../test-files/percent_to_parse_converted.xml'
     },
     'wed/wed': {
         schema: 'test/tei-simplified-rng.js',
         mode: 'wed/modes/generic/generic'
     }
 },
 enforceDefine: true
});
