const gulp = require("gulp");
const glob = require("glob");
const path = require("path");
const gutil = require("gulp-util");
const Promise = require("bluebird");
const { options } = require("./config");
const { newer, checkStatusFile, checkOutputFile, cprp } = require("./util");

const samples = glob.sync("sample_documents/*.xml");
const sampleTasks = [];

for (const sample of samples) {
  const basename = path.basename(sample, path.extname(sample));
  const taskName = `build-sample-${basename}`;
  gulp.task(taskName, Promise.coroutine(function *task() {
    const dest = `build/samples/${path.basename(sample)}`;
    const isNewer = yield newer([sample, "lib/tests/xml-to-xml-tei.xsl"], dest);
    if (!isNewer) {
      gutil.log(`Skipping generation of ${dest}`);
      return;
    }

    const needsSaxon = yield checkStatusFile(
      "grep", ["http://www.tei-c.org/ns/1.0", sample]);
    if (needsSaxon) {
      yield checkOutputFile(options.saxon, [`-s:${sample}`, `-o:${dest}`,
                                            "-xsl:lib/tests/xml-to-xml-tei.xsl"]);
    }
    else {
      yield cprp(sample, dest);
    }
  }));
  sampleTasks.push(taskName);
}

gulp.task("build-samples", sampleTasks);
