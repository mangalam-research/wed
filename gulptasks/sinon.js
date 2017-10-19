const gulp = require("gulp");
const { wgetIfMissing } = require("./wget");

// We need this to download the version of sinon which is built for
// browsers.
gulp.task("download-sinon", ["npm"], () => {
  // eslint-disable-next-line global-require
  const { version } = require("../node_modules/sinon/package.json");

  return wgetIfMissing(`http://sinonjs.org/releases/sinon-${version}.js`,
                       "sinon.js");
});
