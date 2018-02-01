define(function(require,exports,module){

export const empty = {
    closed: true,
    next(value) { },
    error(err) { throw err; },
    complete() { }
};
//# sourceMappingURL=Observer.js.map
return module.exports;

});
