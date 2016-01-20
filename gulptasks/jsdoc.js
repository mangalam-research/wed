"use strict";

import gulp from "gulp";
import gutil from "gulp-util";
import { options } from "./config";
import { newer, checkOutputFile, stamp_path, touchAsync } from "./util";
import Promise from "bluebird";

gulp.task("jsdoc3-doc", ["stamp-dir"],
          Promise.coroutine(function *() {
              const stamp = stamp_path("jsdoc3");
              const is_newer = yield newer(["jsdoc.conf.json",
                                            "doc/api_intro.md",
                                            "lib/**/*.js"],
                                           stamp);
              if (!is_newer) {
                  gutil.log("Skipping generation of jsdoc3 documentation.");
                  return;
              }

              yield checkOutputFile(options.jsdoc3,
                                    ["-c", "jsdoc.conf.json",
                                     "-d", "build/api",
                                     "-r", "lib", "-R", "doc/api_intro.md"]);

              yield touchAsync(stamp);
          }));
