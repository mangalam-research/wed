"use strict";

import gulp from "gulp";
import path from "path";
import { internals } from "./config";
import { wget_if_missing } from "./wget";
import Promise from "bluebird";
import { exec, touchAsync, del, newer, mkdirpAsync } from "./util";
import gutil from "gulp-util";

//
// Even though it would be possible to put the git url inside the
// package.json file and load this package like all other npm
// packages, the bug at https://github.com/npm/npm/issues/4191
// prevents this. Each time npm executes it fetches a fresh copy of
// the package from the repository, which changes the time stamps on
// the files and causes the gulpfile to perform extra work
// unnecessarily.
//

const base =
          `typeahead.js-bootstrap-css-${
path.basename(internals.typeahead_bootstrap_url)}`;

const full_path = path.join("downloads", base);

gulp.task("download-typeaheadjs.css",
          () => wget_if_missing(internals.typeahead_bootstrap_url, base));

gulp.task("copy-typeaheadjs.css", ["download-typeaheadjs.css"],
          Promise.coroutine(function*() {
              const dest =
                        "build/standalone/lib/" +
                        "external/typeaheadjs.css";
              const destdir = path.dirname(dest);

              const is_newer = yield newer(full_path, dest);

              if (!is_newer) {
                  gutil.log("Skipping copy of typeaheadjs.css");
                  return;
              }

              // We need the mkdir -p in case there is more than one
              // directory missing in that path. unzip will only
              // create the last directory in the path passed to -d.
              yield mkdirpAsync(destdir);
              yield exec(`unzip -o -j -DD -d ${destdir} ${full_path} ` +
                         `${path.basename(base, ".zip")}/` +
                         `${path.basename(dest)}`);
}));
