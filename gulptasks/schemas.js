"use strict";

import gulp from "gulp";
import path from "path";
import gutil from "gulp-util";
import { options } from "./config";
import { del, newer, checkOutputFile, exec, mkdirpAsync } from "./util";
import Promise from "bluebird";

gulp.task("copy-schemas", () => {
    return gulp.src("schemas/*.js", { base: "."})
        .pipe(gulp.dest("build"));
});

const json_tasks = [];
function xml_to_json_chain(name, dest, ns) {
    const xml = `schemas/${name}.xml`;
    const compiled = `schemas/out/${name}.compiled`;
    const json = `schemas/out/${name}.json`;
    const meta_json = `build/schemas/${dest}`;

    const rng_task_name = `compile-rng-${name}`;
    const compiled_to_json_task_name = `compiled-to-json-${name}`;
    const meta_json_task_name = `convert-to-meta-json-${name}`;

    gulp.task(rng_task_name, Promise.coroutine(function *() {
        const is_newer = yield newer(xml, compiled);
        if (!is_newer) {
            gutil.log(`Skipped running roma2 for ${compiled}.`);
            return;
        }

        yield exec(`roma2 --xsl=${options.tei} --compile --nodtd ` +
                   `--noxsd ${xml} schemas/out`);
    }));

    function* compiled_to_json() {
        const is_newer = yield newer(compiled, json);
        if (!is_newer) {
            gutil.log(`Skipped running saxon for ${json}.`);
            return;
        }
        exec(`${options.saxon} -xsl:` +
             `/usr/share/xml/tei/stylesheet/odds/odd2json.xsl` +
             ` -s:${compiled} -o:${json} callback=''`);
    }

    gulp.task(compiled_to_json_task_name, [rng_task_name],
              Promise.coroutine(compiled_to_json));

    function *meta() {
        const ns_args = [];

        for (let x of ns)
            ns_args.push("--ns", x);

        const is_newer = yield newer(json, meta_json);

        if (!is_newer) {
            gutil.log("Skipping generation of " + meta_json);
            return;
        }

        yield mkdirpAsync(path.dirname(meta_json));
        yield checkOutputFile("bin/tei-to-generic-meta-json",
                              ["--dochtml", "/build/schemas/tei-doc/"]
                              .concat(ns_args, json, meta_json));
    }

    gulp.task(meta_json_task_name, [`compiled-to-json-${name}`],
              Promise.coroutine(meta));

    json_tasks.push(meta_json_task_name);
}

const tei_ns = ["tei=http://www.tei-c.org/ns/1.0"];

xml_to_json_chain("myTEI", "tei-metadata.json", tei_ns);
xml_to_json_chain("tei-math", "tei-math-metadata.json",
                  tei_ns.concat([
                      "xlink=http://www.w3.org/1999/xlink",
                      "math=http://www.w3.org/1998/Math/MathML"
                  ]));

gulp.task("tei-doc", ["compile-rng-myTEI"], Promise.coroutine(function* () {
    const src = "schemas/out/myTEI.compiled";
    const dest = "build/schemas/tei-doc";

    const is_newer = yield newer(src, dest, true /* force_dest_file */);
    if (!is_newer) {
        gutil.log("Skipping generation of " + dest);
        return;
    }

    yield del(dest);
    yield mkdirpAsync(dest);
    yield checkOutputFile(options.saxon,
                          [`-s:${src}`, `-xsl:${options.odd2html}`,
                           "STDOUT=false", "splitLevel=0", `outputDir=${dest}`]);
}));


gulp.task("build-schemas", ["copy-schemas"].concat(json_tasks, "tei-doc"));
