const gulp = require("gulp");
const path = require("path");
const gutil = require("gulp-util");
const Promise = require("bluebird");
const { options } = require("./config");
const { del, newer, checkOutputFile, exec, mkdirpAsync } = require("./util");

gulp.task("wed-metadata-prereq", ["copy-bin", "tsc-wed"]);

gulp.task("copy-schemas", () =>
          gulp.src("schemas/*.js", { base: "." }).pipe(gulp.dest("build")));

const jsonTasks = [];
function xmlToJsonChain(name, dest) {
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
    const fragment = "schemas/tei-meta-fragment.yml";
    const isNewer = yield newer([json, fragment], metaJson);

    if (!isNewer) {
      gutil.log(`Skipping generation of ${metaJson}`);
      return;
    }

    yield mkdirpAsync(path.dirname(metaJson));
    yield checkOutputFile("build/standalone/bin/wed-metadata",
                          ["--tei", "--merge", fragment].concat(json,
                                                                metaJson));
  }

  // tsc-wed is a necessary dependency because tei-to-generic-meta-json
  // needs to load compiled code.
  gulp.task(metaJsonTaskName, ["wed-metadata-prereq",
                               `compiled-to-json-${name}`],
            Promise.coroutine(meta));

  jsonTasks.push(metaJsonTaskName);
}

xmlToJsonChain("myTEI", "tei-metadata.json");
xmlToJsonChain("tei-math", "tei-math-metadata.json");

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

gulp.task("docbook-metadata", ["wed-metadata-prereq"],
          Promise.coroutine(function *task() {
            const fragment = "schemas/docbook-meta-fragment.yml";
            const metadata = "build/schemas/docbook-metadata.json";
            const isNewer = yield newer(fragment, metadata);

            if (!isNewer) {
              gutil.log(`Skipping generation of ${metadata}`);
              return;
            }

            yield mkdirpAsync(path.dirname(metadata));
            yield checkOutputFile("build/standalone/bin/wed-metadata",
                                  [fragment, metadata]);
          }));

gulp.task("build-schemas", ["copy-schemas",
                            "docbook-metadata"].concat(jsonTasks, "tei-doc"));
