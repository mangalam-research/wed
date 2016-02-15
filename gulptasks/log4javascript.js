"use strict";

import gulp from "gulp";
import path from "path";
import { internals, options } from "./config";
import { wget_if_missing } from "./wget";
import { exec, del, touchAsync, newer, mkdirpAsync } from "./util";
import Promise from "bluebird";
import gutil from "gulp-util";

const log4javascript_base = path.basename(internals.log4javascript_url);
const full_path = path.join("downloads", log4javascript_base);

gulp.task("download-log4javascript",
          () => wget_if_missing(
              internals.log4javascript_url,
              log4javascript_base));

gulp.task("copy-log4javascript", ["download-log4javascript"],
          Promise.coroutine(function* () {
              const dest =
                        "build/standalone/lib/external/log4javascript.js";
              const destdir = path.dirname(dest);

              const is_newer = yield newer(full_path, dest);

              if (!is_newer) {
                  gutil.log("Skipping copy of log4javascript");
                  return;
              }

              // We need the mkdir -p in case there is more than one
              // directory missing in that path. unzip will only
              // create the last directory in the path passed to -d.
              yield mkdirpAsync(destdir);
              yield exec(`unzip -d ${destdir} ${full_path} ` +
                         `log4javascript-*/js/*.js`);

              const from = options.dev ?
                        "log4javascript_uncompressed.js" :
                        "log4javascript.js";

	      yield exec(
                  `mv ${destdir}/log4javascript-*/js/${from} ${dest}`);

              yield del(`${destdir}/log4javascript-*`);
              yield touchAsync(dest);
          }));
