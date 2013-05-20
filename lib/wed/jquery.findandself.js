(function( $ ){

  $.fn.findAndSelf = function(selector) {  

      var $nodes = this.find(selector);

      if (this.is(selector))
          $nodes = $nodes.add(this);

      return $nodes;
  };
})( jQuery );
