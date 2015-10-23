"use strict";

import gulp from "gulp";
import path from "path";
import gulpNewer from "gulp-newer";
import gutil from "gulp-util";
import { options } from "./config";
import { newer, execFile, exec, stamp_path, touchAsync, mkdirpAsync, cprp }
from "./util";
import Promise from "bluebird";


// These are files which come from the custom template.
const default_template_excludes =
          ["static/styles/mangalam.css",
           "tmpl/layout.tmpl",
           "publish.js"];

gulp.task("jsdoc3-copy-default-template", () => {
    const dest = "build/jsdoc_template";
    // We build a source that covers all files in
    // options.jsdoc3_default_template, EXCEPT those files that come
    // from the custom template.
    const src = [path.join(options.jsdoc3_default_template, "**")].concat(
        default_template_excludes.map(
            (x) => `!${path.join(options.jsdoc3_default_template, x)}`));
    return gulp.src(src)
        .pipe(gulpNewer(dest))
        .pipe(gulp.dest(dest));
});

function* copy_if_newer_gen(src, dest) {
    const is_newer = yield newer(src, dest);
    if (!is_newer)
        return;

    yield mkdirpAsync(path.dirname(dest));
    yield cprp(src, dest);
}

gulp.task("jsdoc3-copy-custom-template",
          ["jsdoc3-copy-default-template"],
          Promise.coroutine(function* () {
              yield* copy_if_newer_gen(
                  "misc/jsdoc_template/mangalam.css",
                  "build/jsdoc_template/static/styles/mangalam.css");
              yield* copy_if_newer_gen(
                  "misc/jsdoc_template/layout.tmpl",
                  "build/jsdoc_template/tmpl/layout.tmpl");
              yield* copy_if_newer_gen(
                  "misc/jsdoc_template/publish.js",
                  "build/jsdoc_template/publish.js");
          }));

gulp.task("jsdoc3-doc", ["stamp-dir",
                         "jsdoc3-copy-default-template",
                         "jsdoc3-copy-custom-template"],
          Promise.coroutine(function *() {
              const stamp = stamp_path("jsdoc3");
              const is_newer = yield newer(["jsdoc.conf.json",
                                            "doc/api_intro.md",
                                            "lib/**/*.js",
                                            "build/jsdoc_template/**"],
                                           stamp);
              if (!is_newer) {
                  gutil.log("Skipping generation of jsdoc3 documentation.");
                  return;
              }

              yield execFile(options.jsdoc3,
                             ["-c", "jsdoc.conf.json",
                              "-d", "build/api",
                              "-r", "lib", "doc/api_intro.md"]);

              yield touchAsync(stamp);
          }));
