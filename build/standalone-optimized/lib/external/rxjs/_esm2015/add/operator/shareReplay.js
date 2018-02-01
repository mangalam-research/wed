define(function(require,exports,module){

import { Observable } from '../../Observable';
import { shareReplay } from '../../operator/shareReplay';
Observable.prototype.shareReplay = shareReplay;
//# sourceMappingURL=shareReplay.js.map
return module.exports;

});
