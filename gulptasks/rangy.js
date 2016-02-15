"use strict";

import gulp from "gulp";
import path from "path";
import { internals, options } from "./config";
import { wget_if_missing } from "./wget";
import Promise from "bluebird";
import { exec, del, newer, touchAsync, mkdirpAsync } from "./util";
import gutil from "gulp-util";

const full_path = path.join("downloads", internals.rangy_file);

gulp.task("download-rangy",
          () => wget_if_missing(
              'https://rangy.googlecode.com/files/' + internals.rangy_file,
              internals.rangy_file));

gulp.task("copy-rangy", ["download-rangy"], Promise.coroutine(function* () {
    const dest = "build/standalone/lib/external/rangy";

    const is_newer = yield newer(full_path, dest,
                                 true /* force_dest_file */);

    if (!is_newer) {
        gutil.log("Skipping copy of rangy");
        return;
    }

    yield mkdirpAsync(dest);
    yield del(`${dest}/*`);
    yield exec(`tar -xzf ${full_path} --strip-components=1 -C ${dest}`);

    if (!options.dev)
        yield exec(`mv ${dest}/uncompressed/* ${dest}`);

    yield del(`${dest}/uncompressed`);
    // Cannot use touchAsync on a directory!
    yield exec(`touch ${dest}`);
}));
