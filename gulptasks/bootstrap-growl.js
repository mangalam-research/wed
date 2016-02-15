"use strict";

import gulp from "gulp";
import path from "path";
import { internals, options } from "./config";
import { wget_if_missing } from "./wget";
import Promise from "bluebird";
import { exec, touchAsync, del, newer, mkdirpAsync } from "./util";
import gutil from "gulp-util";

const bootstrap_growl_base =
          `bootstrap-growl-${path.basename(internals.bootstrap_growl_url)}`;
const full_path = path.join("downloads", bootstrap_growl_base);

gulp.task("download-bootstrap-growl",
          () => wget_if_missing(internals.bootstrap_growl_url,
                                bootstrap_growl_base));

gulp.task("copy-bootstrap-growl", ["download-bootstrap-growl"],
          Promise.coroutine(function*() {
              const dest =
                        "build/standalone/lib/" +
                        "external/jquery.bootstrap-growl.js";
              const destdir = path.dirname(dest);

              const is_newer = yield newer(full_path, dest);

              if (!is_newer) {
                  gutil.log("Skipping copy of bootstrap-growl");
                  return;
              }

              // We need the mkdir -p in case there is more than one
              // directory missing in that path. unzip will only
              // create the last directory in the path passed to -d.
              yield mkdirpAsync(destdir);
              yield exec(`unzip -o -d ${destdir} ${full_path}`);

              const from = options.dev ?
                        "jquery.bootstrap-growl.js" :
                        "jquery.bootstrap-growl.min.js";

              yield exec(
                  `mv ${destdir}/bootstrap-growl-*/${from} ${dest}`);

              yield del(`${destdir}/bootstrap-growl-*`);
              yield touchAsync(dest);
}));
