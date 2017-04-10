const gulp = require("gulp");
const gutil = require("gulp-util");
const Promise = require("bluebird");
const { options } = require("./config");
const { newer, checkOutputFile, stampPath, touchAsync } = require("./util");

gulp.task("jsdoc3-doc", ["stamp-dir"], Promise.coroutine(function *task() {
  const stamp = stampPath("jsdoc3");
  const isNewer = yield newer(["jsdoc.conf.json", "doc/api_intro.md",
                               "lib/**/*.js"], stamp);
  if (!isNewer) {
    gutil.log("Skipping generation of jsdoc3 documentation.");
    return;
  }

  yield checkOutputFile(options.jsdoc3, ["-c", "jsdoc.conf.json",
                                         "-d", "build/api",
                                         "-r", "lib", "-R", "doc/api_intro.md"]);

  yield touchAsync(stamp);
}));
