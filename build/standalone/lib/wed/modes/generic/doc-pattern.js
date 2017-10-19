/**
 * Facilities for interpreting the patterns passed in dochtml in
 * metadata files.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A literal value in a pattern.
     */
    var Literal = /** @class */ (function () {
        /**
         * @param value The value to which this literal resolves to.
         */
        function Literal(value) {
            this.value = value;
        }
        Literal.prototype.execute = function () {
            return this.value;
        };
        return Literal;
    }());
    /**
     * A concatenation operation.
     */
    var Concat = /** @class */ (function () {
        /**
         * @param values The patterns to concatenate.
         */
        function Concat(values) {
            this.values = values;
        }
        Concat.prototype.execute = function (context) {
            return this.values.map(function (value) { return value.execute(context); }).join("");
        };
        return Concat;
    }());
    /**
     * An interpolation like ``${foo}``.
     */
    var Interpolation = /** @class */ (function () {
        /**
         * @param name The name to interpolate.
         */
        function Interpolation(name) {
            this.name = name;
        }
        Interpolation.prototype.execute = function (context) {
            return context.resolveName(this.name);
        };
        return Interpolation;
    }());
    /**
     * A substitution operation, like in ``${foo:s("a","b")}``.
     */
    var Substitution = /** @class */ (function () {
        function Substitution(pattern, substitution, child) {
            this.pattern = pattern;
            this.substitution = substitution;
            this.child = child;
        }
        Substitution.prototype.execute = function (context) {
            var value = this.child.execute(context);
            return value.replace(this.pattern, this.substitution);
        };
        return Substitution;
    }());
    /**
     * Compile a string pattern to a [[DocPattern]] object.
     *
     * @param pattern The pattern to compile.
     *
     * @returns The compiled pattern.
     */
    function compile(pattern) {
        var parts = pattern.split(/(\$\{|\})/);
        var patterns = [];
        var interpolating = false;
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            // tslint:disable-next-line:no-invalid-template-strings
            if (part === "${") {
                if (interpolating) {
                    throw new Error("nested interpolations are invalid");
                }
                interpolating = true;
            }
            else if (part === "}") {
                if (!interpolating) {
                    throw new Error("errant interpolation closure");
                }
                interpolating = false;
            }
            else if (interpolating) {
                var _a = part.split(":", 1), name_1 = _a[0], transform = _a[1];
                if (transform === undefined) {
                    patterns.push(new Interpolation(name_1));
                }
                else {
                    if (transform[0] === "s") {
                        var paramList = transform.slice(1);
                        if (paramList[0] !== "(" || paramList[paramList.length - 1] !== ")") {
                            throw new Error("transform parameters must be in parentheses");
                        }
                        // We slice to drop the parentheses.
                        var params = paramList.slice(1, -1).split(",").map(function (x) { return x.trim(); });
                        if (params.length !== 2) {
                            throw new Error("an s transform takes 2 parameters");
                        }
                        for (var _b = 0, params_1 = params; _b < params_1.length; _b++) {
                            var param = params_1[_b];
                            if (param[0] !== "\"" || param[param.length - 1] !== "\"") {
                                throw new Error("parameter must be a string wrapped in double quotes: " + param);
                            }
                        }
                        // Drop the wrapping quotes.
                        params = params.map(function (x) { return x.slice(1, -1); });
                        patterns.push(new Substitution(params[0], params[1], new Interpolation(name_1)));
                    }
                    else {
                        throw new Error("unknown transform " + transform);
                    }
                }
            }
            else {
                patterns.push(new Literal(part));
            }
        }
        if (interpolating) {
            throw new Error("an interpolation was not closed");
        }
        return new Concat(patterns);
    }
    exports.compile = compile;
});
//  LocalWords:  dochtml MPL unresolvable param

//# sourceMappingURL=doc-pattern.js.map
