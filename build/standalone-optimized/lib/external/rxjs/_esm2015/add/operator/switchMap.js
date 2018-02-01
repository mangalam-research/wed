define(function(require,exports,module){

import { Observable } from '../../Observable';
import { switchMap } from '../../operator/switchMap';
Observable.prototype.switchMap = switchMap;
//# sourceMappingURL=switchMap.js.map
return module.exports;

});
