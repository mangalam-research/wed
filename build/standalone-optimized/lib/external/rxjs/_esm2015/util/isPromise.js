define(function(require,exports,module){

export function isPromise(value) {
    return value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
}
//# sourceMappingURL=isPromise.js.map
return module.exports;

});
