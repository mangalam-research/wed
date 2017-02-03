import gulp from "gulp";
import path from "path";
import gutil from "gulp-util";
import Promise from "bluebird";
import { options } from "./config";
import { del, newer, checkOutputFile, exec, mkdirpAsync } from "./util";

gulp.task("copy-schemas", () =>
          gulp.src("schemas/*.js", { base: "." }).pipe(gulp.dest("build")));

const jsonTasks = [];
function xmlToJsonChain(name, dest, ns) {
  const xml = `schemas/${name}.xml`;
  const compiled = `schemas/out/${name}.compiled`;
  const json = `schemas/out/${name}.json`;
  const metaJson = `build/schemas/${dest}`;

  const rngTaskName = `compile-rng-${name}`;
  const compiledToJsonTaskName = `compiled-to-json-${name}`;
  const metaJsonTaskName = `convert-to-meta-json-${name}`;

  gulp.task(rngTaskName, Promise.coroutine(function *task() {
    const isNewer = yield newer(xml, compiled);
    if (!isNewer) {
      gutil.log(`Skipped running roma2 for ${compiled}.`);
      return;
    }

    yield exec(`roma2 --xsl=${options.tei} --compile --nodtd ` +
               `--noxsd ${xml} schemas/out`);
  }));

  function *compiledToJson() {
    const isNewer = yield newer(compiled, json);
    if (!isNewer) {
      gutil.log(`Skipped running saxon for ${json}.`);
      return;
    }
    exec(`${options.saxon} -xsl:` +
         "/usr/share/xml/tei/stylesheet/odds/odd2json.xsl" +
         ` -s:${compiled} -o:${json} callback=''`);
  }

  gulp.task(compiledToJsonTaskName, [rngTaskName],
            Promise.coroutine(compiledToJson));

  function *meta() {
    const nsArgs = [];

    for (const x of ns) {
      nsArgs.push("--ns", x);
    }

    const isNewer = yield newer(json, metaJson);

    if (!isNewer) {
      gutil.log(`Skipping generation of ${metaJson}`);
      return;
    }

    yield mkdirpAsync(path.dirname(metaJson));
    yield checkOutputFile("bin/tei-to-generic-meta-json",
                          ["--dochtml", "/build/schemas/tei-doc/"]
                          .concat(nsArgs, json, metaJson));
  }

  gulp.task(metaJsonTaskName, [`compiled-to-json-${name}`],
            Promise.coroutine(meta));

  jsonTasks.push(metaJsonTaskName);
}

const teiNs = ["tei=http://www.tei-c.org/ns/1.0"];

xmlToJsonChain("myTEI", "tei-metadata.json", teiNs);
xmlToJsonChain("tei-math", "tei-math-metadata.json",
               teiNs.concat([
                 "xlink=http://www.w3.org/1999/xlink",
                 "math=http://www.w3.org/1998/Math/MathML",
               ]));

gulp.task("tei-doc", ["compile-rng-myTEI"], Promise.coroutine(function *task() {
  const src = "schemas/out/myTEI.compiled";
  const dest = "build/schemas/tei-doc";

  const isNewer = yield newer(src, dest, true /* forceDestFile */);
  if (!isNewer) {
    gutil.log(`Skipping generation of ${dest}`);
    return;
  }

  yield del(dest);
  yield mkdirpAsync(dest);
  yield checkOutputFile(
    options.saxon,
    [`-s:${src}`, `-xsl:${options.odd2html}`,
     "STDOUT=false", "splitLevel=0", `outputDir=${dest}`]);
}));


gulp.task("build-schemas", ["copy-schemas"].concat(jsonTasks, "tei-doc"));
