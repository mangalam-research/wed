//
// Adapted from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat

if (!String.prototype.repeat) {
  // eslint-disable-next-line no-extend-native
  String.prototype.repeat = function repeat(count) {
    "use strict";

    // == null will be true if `this` is undefined or null.
    if (this == null) {
      throw new TypeError("can't convert " + this + " to object");
    }

    var str = "" + this;
    count = +count;

    if (isNaN(count)) {
      count = 0;
    }

    if (count < 0) {
      throw new RangeError("repeat count must be non-negative");
    }

    if (count === Infinity) {
      throw new RangeError("repeat count must be less than infinity");
    }

    count = Math.floor(count);
    if (!str.length || !count) {
      return "";
    }

    /* eslint-disable no-bitwise */
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError("repeat count must not overflow maximum string size");
    }

    var rpt = "";
    while (true) { // eslint-disable-line no-constant-condition
      if (count & 1) {
        rpt += str;
      }
      count >>>= 1;
      if (!count) {
        break;
      }
      str += str;
    }

    return rpt;
  };
}
