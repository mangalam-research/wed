define(function(require,exports,module){

import { Observable } from '../../Observable';
import { distinctUntilKeyChanged } from '../../operator/distinctUntilKeyChanged';
Observable.prototype.distinctUntilKeyChanged = distinctUntilKeyChanged;
//# sourceMappingURL=distinctUntilKeyChanged.js.map
return module.exports;

});
