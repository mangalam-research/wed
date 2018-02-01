define(function(require,exports,module){

import { Observable } from '../../Observable';
import { race } from '../../operator/race';
Observable.prototype.race = race;
//# sourceMappingURL=race.js.map
return module.exports;

});
