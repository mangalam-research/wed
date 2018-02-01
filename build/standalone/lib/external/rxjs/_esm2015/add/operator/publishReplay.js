define(function(require,exports,module){

import { Observable } from '../../Observable';
import { publishReplay } from '../../operator/publishReplay';
Observable.prototype.publishReplay = publishReplay;
//# sourceMappingURL=publishReplay.js.map
return module.exports;

});
