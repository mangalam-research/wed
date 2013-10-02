/**
 * @module jquery.findandself
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
**/

(function( $ ){

  $.fn.findAndSelf = function(selector) {

      var $nodes = this.find(selector);

      if (this.is(selector))
          $nodes = $nodes.add(this);

      return $nodes;
  };
})( jQuery );
