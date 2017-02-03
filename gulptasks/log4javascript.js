import gulp from "gulp";
import path from "path";
import Promise from "bluebird";
import gutil from "gulp-util";
import { internals, options } from "./config";
import { wgetIfMissing } from "./wget";
import { exec, del, touchAsync, newer, mkdirpAsync } from "./util";

const log4javascriptBase = path.basename(internals.log4javascriptUrl);
const fullPath = path.join("downloads", log4javascriptBase);

gulp.task("download-log4javascript",
          () => wgetIfMissing(internals.log4javascriptUrl, log4javascriptBase));

gulp.task("copy-log4javascript", ["download-log4javascript"],
          Promise.coroutine(function *task() {
            const dest = "build/standalone/lib/external/log4javascript.js";
            const destdir = path.dirname(dest);

            const isNewer = yield newer(fullPath, dest);

            if (!isNewer) {
              gutil.log("Skipping copy of log4javascript");
              return;
            }

            // We need the mkdir -p in case there is more than one directory
            // missing in that path. unzip will only create the last directory
            // in the path passed to -d.
            yield mkdirpAsync(destdir);
            yield exec(`unzip -d ${destdir} ${fullPath} ` +
                       "log4javascript-*/js/*.js");

            const from = options.dev ? "log4javascript_uncompressed.js" :
                    "log4javascript.js";

            yield exec(`mv ${destdir}/log4javascript-*/js/${from} ${dest}`);

            yield del(`${destdir}/log4javascript-*`);
            yield touchAsync(dest);
          }));
