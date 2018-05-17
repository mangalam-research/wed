// This rigmarole is needed to work around eslint limitations.  The base
// configuration for this repo is ES5 because that's what is in index.js. The
// gulpfile is ES6, so to get it to use a different configuration we shove it
// into a different directory where there can be a different configuration file.
// And here we are...
/* global require */

"use strict";

require("./gulptasks/gulpfile.js");
