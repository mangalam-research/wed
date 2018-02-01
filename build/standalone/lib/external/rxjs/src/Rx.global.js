define(function(require,exports,module){

(function (root, factory) {
  root.Rx = factory();
})(window || global || this, function () {
  return require('../dist/package/Rx');
});
return module.exports;

});
