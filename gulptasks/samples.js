"use strict";

import gulp from "gulp";
import glob from "glob";
import path from "path";
import gutil from "gulp-util";
import { options } from "./config";
import { newer, checkStatusFile, checkOutputFile, cprp } from "./util";
import Promise from "bluebird";

const samples = glob.sync("sample_documents/*.xml");
const sample_tasks = [];

for (let sample of samples) {
    const basename = path.basename(sample, path.extname(sample));
    const task_name = `build-sample-${basename}`;
    gulp.task(task_name, Promise.coroutine(function* () {
        const dest = "build/samples/" + path.basename(sample);
        const is_newer = yield newer([sample, "test/xml-to-xml-tei.xsl"],
                                      dest);
        if (!is_newer) {
            gutil.log("Skipping generation of " + dest);
            return;
        }

        const needs_saxon =
                  yield checkStatusFile(
                      "grep", ["http://www.tei-c.org/ns/1.0", sample]);
        if (needs_saxon) {
            yield checkOutputFile(options.saxon,
                                  [`-s:${sample}`, `-o:${dest}`,
                                   "-xsl:test/xml-to-xml-tei.xsl"]);
        }
        else {
            yield cprp(sample, dest);
        }
    }));
    sample_tasks.push(task_name);
}

gulp.task("build-samples", sample_tasks);
