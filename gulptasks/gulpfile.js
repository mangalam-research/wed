import "babel-polyfill";
import gulp from "gulp";
import gulpNewer from "gulp-newer";
import gulpFilter from "gulp-filter";
import less from "gulp-less";
import rename from "gulp-rename";
import changed from "gulp-changed";
import es from "event-stream";
import vinylFile from "vinyl-file";
import Promise from "bluebird";
import path from "path";
import gutil from "gulp-util";
import glob from "glob";
import shell from "shell-quote";
import requireDir from "require-dir";
import rjs from "requirejs";
import wrapAmd from "gulp-wrap-amd";
import eslint from "gulp-eslint";
import replace from "gulp-replace";
import versync from "versync";
import webpack from "webpack";
import { ArgumentParser } from "argparse";
import gulpTslint from "gulp-tslint";
import * as tslint from "tslint";
import gulpTs from "gulp-typescript";
import * as ts from "typescript";
import sourcemaps from "gulp-sourcemaps";
import webWebpackConfig from "../web/webpack.config";
import * as config from "./config";
import { sameFiles, del, newer, exec, checkOutputFile, touchAsync, cprp,
         cprpdir, spawn, existsInFile, sequence, mkdirpAsync, fs, stampPath }
from "./util";

// Try to load local configuration options.
let localConfig = {};
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  localConfig = require("../gulp.local");
}
catch (e) {
  if (e.code !== "MODULE_NOT_FOUND") {
    throw e;
  }
}

const parser = new ArgumentParser({ addHelp: true });

// eslint-disable-next-line guard-for-in
for (const prop in config.optionDefinitions) {
  const optionOptions = config.optionDefinitions[prop];
  const localOverride = localConfig[prop];
  if (localOverride !== undefined) {
    optionOptions.defaultValue = localOverride;
  }

  const optionName = prop.replace(/_/g, "-");
  parser.addArgument([`--${optionName}`], optionOptions);
}

// We have this here so that the help message is more useful than
// without. At the same time, this positional argument is not
// *required*.
parser.addArgument(["target"], {
  help: "Target to execute.",
  nargs: "?",
  defaultValue: "default",
});

const options = config.options = parser.parseArgs(process.argv.slice(2));

// We purposely import the files there at this point so that the
// configuration is set once and for all before they execute. Doing
// this allows having code that depends on the configuration values.
requireDir(".");


gulp.task("config", () => {
  const dest = "build/config";
  // In effect, anything in localConfigPath overrides the same file in
  // config.
  const configPath = "config";
  const localConfigPath = "local_config";
  return gulp.src(path.join(configPath, "**"), { nodir: true })
    .pipe(es.map((file, callback) =>
                 vinylFile.read(
                   path.join(localConfigPath, file.relative),
                   { base: localConfigPath },
                   (err, override) => callback(null, err ? file : override))))
  // We do not use newer here as it would sometimes have
  // unexpected effects.
    .pipe(changed(dest, { hasChanged: changed.compareSha1Digest }))
    .pipe(gulp.dest(dest));
});

const buildDeps = ["build-standalone", "build-bundled-doc"];
if (options.optimize) {
  buildDeps.push("build-standalone-optimized");
}
gulp.task("build", buildDeps);

gulp.task("build-only-standalone", ["copy-wed-source", "tsc-wed"]);

gulp.task("copy-wed-source", () => {
  const dest = "build/standalone/";
  return gulp.src(["lib/**/*", "!**/*_flymake.*", "!**/flycheck*",
                   "!**/*.{less,ts}"], { base: "." })
    .pipe(gulpNewer(dest))
    .pipe(gulp.dest(dest));
});

const moduleFix = /^(define\(\["require", "exports")(.*?\], function \(require, exports)(.*)$/m;
function tsc(project) {
  // The .once nonsense is to work around a gulp-typescript bug
  //
  // See: https://github.com/ivogabe/gulp-typescript/issues/295
  //
  // For the fix see:
  // https://github.com/ivogabe/gulp-typescript/issues/295#issuecomment-197299175
  //
  const result = project.src()
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(project())
        .once("error", function onError() {
          this.once("finish", () => {
            process.exit(1);
          });
        });

  const dest = "build/standalone/lib";
  return es.merge(result.js
                  //
                  // This ``replace`` to work around the problem that ``module``
                  // is not defined when compiling to "amd". See:
                  //
                  // https://github.com/Microsoft/TypeScript/issues/13591
                  //
                  // We need to compile to "amd" for now.
                  //
                  .pipe(replace(moduleFix, "$1, \"module\"$2, module$3"))
                  .pipe(sourcemaps.write("."))
                  .pipe(gulp.dest(dest)),
                  result.dts.pipe(gulp.dest(dest)));
}

const wedProject = gulpTs.createProject("lib/tsconfig.json");
const wedProgram = tslint.Linter.createProgram("lib/tsconfig.json");
gulp.task("tsc-wed", () => tsc(wedProject));

gulp.task("build-standalone-optimized-web", (callback) => {
  webpack(webWebpackConfig, (err, stats) => {
    if (err) {
      callback(new gutil.PluginError("webpack", err));
      return;
    }

    const errors = stats.toJson().errors;
    if (errors.length) {
      callback(new gutil.PluginError("webpack", errors.join("")));
      return;
    }

    gutil.log("[webpack]", stats.toString({ colors: true }));
    callback();
  });
});

const webProject = gulpTs.createProject("web/tsconfig.json");
const webProgram = tslint.Linter.createProgram("web/tsconfig.json");
const webTestProgram = tslint.Linter.createProgram("web/test/tsconfig.json");
gulp.task("tsc-web", () => tsc(webProject));

gulp.task("copy-js-web",
          () => gulp.src("web/**/*.{js,html,css}")
          .pipe(gulp.dest("build/standalone/lib/")));

gulp.task("build-standalone-web", ["tsc-web", "copy-js-web"]);

gulp.task("build-only-standalone-config", ["config"], () => {
  const dest = "build/standalone";
  return gulp.src("build/config/requirejs-config-dev.js")
    .pipe(rename("requirejs-config.js"))
    .pipe(gulpNewer(dest))
    .pipe(gulp.dest(dest));
});

const lessInc = "lib/wed/less-inc/";

gulp.task("stamp-dir", () => mkdirpAsync(config.internals.stampDir));

gulp.task("build-only-standalone-less",
          ["stamp-dir", "build-only-standalone", "copy-bootstrap"],
          (callback) => {
            const dest = "build/standalone/";
            const stamp = stampPath("less");
            const incFiles = `${lessInc}**/*.less`;

            // We have to filter out the included files from the less
            // transformation but we do include them literally in the final
            // package so that modes developed by users of wed can use them.
            const filter = gulpFilter(["lib/**/*", `!${incFiles}`],
                                      { restore: true });
            // This is a bit of a compromise. This will actually run less for
            // *all* less files if *any* of the less files changes.
            gulp.src(["lib/**/*.less", incFiles, "!**/*_flymake.*"],
                     { base: "." })
              .pipe(gulpNewer(stamp))
              .pipe(filter)
              .pipe(less({ paths: lessInc }))
              .pipe(filter.restore)
              .pipe(gulp.dest(dest))
              .on("end", () => {
                touchAsync(stamp).asCallback(callback);
              });
          });

gulp.task("npm", ["stamp-dir"], Promise.coroutine(function *task() {
  const stamp = stampPath("npm");

  const isNewer = yield newer(["package.json", "npm-shrinkwrap.json"], stamp);

  if (!isNewer) {
    gutil.log("Skipping npm.");
    return;
  }

  yield mkdirpAsync("node_modules");
  yield exec("npm install");
  yield touchAsync(stamp);
}));

const copyTasks = [];
function npmCopyTask(...args) {
  // Package is reserved. So `pack`.
  let name;
  let src;
  let dest;
  let pack;
  // It is always possible to past an options object as the last argument.
  const last = args[args.length - 1];
  let copyOptions;
  if (typeof last === "object") {
    copyOptions = last;
    args.pop();
  }
  else {
    copyOptions = {};
  }

  if (args.length === 3) {
    // All arguments passed: just unpack.
    [name, src, dest] = args;
    pack = `node_modules/${src.split("/", 1)[0]}`;
  }
  else if (args.length === 2) {
    const [arg1, arg2] = args;
    // There are two possibilities.
    if (/[/*]/.test(arg1)) {
      // Arg1 is path-like: we interpret it as a source, arg2 is then dest. Task
      // name and package names are derived from arg1.
      src = arg1;
      dest = arg2;
      name = src.split("/", 1)[0];
      pack = `node_modules/${name}`;
    }
    else {
      // Arg1 is not path-like: we interpret it as a task and
      // package name. Arg2 is the source. We assume `dest` is
      // `'external'`;
      name = arg1;
      src = arg2;
      dest = "external";
      pack = `node_modules/${name}`;
    }
  }
  else if (args.length === 1) {
    // Only one argument. It is the source. We derive the task and
    // package names from it. And we assume dest is '`external`'.
    [src] = args;
    dest = "external";
    name = src.split("/", 1)[0];
    pack = `node_modules/${name}`;
  }

  const completeSrc = [`node_modules/${src}`];
  const completeDest = `build/standalone/lib/${dest}`;

  // We want to match everything except the package directory
  // itself.
  const filter = gulpFilter(file => !/node_modules\/$/.test(file.base));

  //
  // For the ``newer`` computation, we have to depend on the actual
  // file to be copied and on the package directory itself. The fact
  // is that when npm installs a package, it preserves the
  // modification dates on the files. Consider:
  //
  // - June 1st: I ran make.
  //
  // - June 2nd: the package that contains ``src`` has a new version released.
  //
  // - June 3rd: I run make clean and make again. So ``dest`` has a stamp of
  //   June 3rd.
  //
  // - June 4th: I upgrade the package that contains ``src``. I run make but it
  //   does not update ``dest`` because ``src`` has a timestamp of June 2nd or
  //   earlier.
  //
  // Therefore I have to depend on the package itself too.
  //

  const fullName = `copy-${name}`;
  const stamp = stampPath(fullName);
  gulp.task(fullName, ["stamp-dir", "npm"], (callback) => {
    let stream = gulp.src([pack].concat(completeSrc), {
      allowEmpty: false,
    });

    if (copyOptions.rename) {
      stream = stream.pipe(rename(copyOptions.rename));
    }

    stream = stream.pipe(gulpNewer(stamp))
    // Remove the package from the stream...
      .pipe(filter);

    if (copyOptions.wrapAmd) {
      stream = stream.pipe(wrapAmd({ exports: "module.exports" }));
    }

    stream.pipe(gulp.dest(completeDest))
      .on("end", () => touchAsync(stamp).asCallback(callback));
  });

  copyTasks.push(fullName);
}

npmCopyTask("jquery/dist/jquery.js");

npmCopyTask("bootstrap/dist/**/*", "external/bootstrap");

npmCopyTask("font-awesome/{css,fonts}/**/*", "external/font-awesome");

npmCopyTask("text-plugin", "requirejs-text/text.js", "requirejs");

npmCopyTask("requirejs/require.js", "requirejs");

npmCopyTask("optional-plugin", "requirejs-optional/optional.js", "requirejs");

npmCopyTask("typeahead", "typeahead.js/dist/typeahead.bundle.min.js");

npmCopyTask("pubsub", "pubsub-js/src/pubsub.js");

npmCopyTask("localforage/dist/localforage.js");

npmCopyTask("async/lib/async.js");

npmCopyTask("bootbox/bootbox*.js");

npmCopyTask("urijs/src/**", "external/urijs");

npmCopyTask("lodash", "lodash-amd/{modern/**,main.js,package.json}",
            "external/lodash");

npmCopyTask("classlist", "classlist-polyfill/src/index.js",
            { rename: "classList.js" });

npmCopyTask("salve/salve*");

npmCopyTask("salve-dom/salve-dom*");

npmCopyTask("interact.js/dist/interact.min.js");

npmCopyTask("merge-options", "merge-options/index.js",
            { rename: "merge-options.js", wrapAmd: true });

npmCopyTask("is-plain-obj", "is-plain-obj/index.js",
            { rename: "is-plain-obj.js", wrapAmd: true });

npmCopyTask("bluebird/js/browser/bluebird.js");

npmCopyTask("last-resort/dist/last-resort.js**");

npmCopyTask("rangy/lib/**", "external/rangy");

npmCopyTask("bootstrap-notify/bootstrap-notify*.js");

npmCopyTask("typeahead.js-bootstrap-css/typeaheadjs.css");

npmCopyTask("dexie/dist/dexie{,.min}.js{.map,}");

npmCopyTask("core-js/client/shim.min.js", { rename: "core-js.min.js" });

npmCopyTask("zone.js/dist/zone.js");

npmCopyTask("bluejax/index.js", { rename: "bluejax.js" });

npmCopyTask("bluejax.try/index.js", { rename: "bluejax.try.js" });

npmCopyTask("blueimp-md5/js/md5.js", { rename: "blueimp-md5.js" });

npmCopyTask("slug/slug-browser.js", { rename: "slug.js" });

gulp.task("build-info", Promise.coroutine(function *task() {
  const dest = "build/standalone/lib/wed/build-info.js";
  const isNewer = yield newer(["lib/**", "!**/*_flymake.*"], dest);
  if (!isNewer) {
    return;
  }

  yield mkdirpAsync(path.dirname(dest));

  yield exec("node misc/generate_build_info.js --unclean " +
             `--module > ${dest}`);
}));

function *generateModes(x) {
  const common = `wed/modes/${x}/`;
  yield `${common}${x}`;
  yield `${common}${x}_mode`;
}

gulp.task("generate-mode-map", Promise.coroutine(function *task() {
  const dest = "build/standalone/lib/wed/mode-map.js";
  const isNewer = yield newer(["lib/wed/modes/**", "!**/*_flymake.*"], dest);
  if (!isNewer) {
    return;
  }

  yield mkdirpAsync(path.dirname(dest));

  const modeDirs = yield fs.readdirAsync("lib/wed/modes");
  const modes = {};
  modeDirs.forEach((x) => {
    for (const mode of generateModes(x)) {
      try {
        fs.accessSync(path.join("./lib", `${mode}.js`));
        modes[x] = mode;
        break;
      }
      catch (e) {} // eslint-disable-line no-empty
    }
  });

  const exporting = { modes };

  yield fs.writeFileAsync(dest, `define(${JSON.stringify(exporting)});`);
}));

gulp.task("generate-meta-map", Promise.coroutine(function *task() {
  const dest = "build/standalone/lib/wed/meta-map.js";
  const isNewer = yield newer(["lib/wed/modes/**/metas/*_meta.js",
                               "!**/*_flymake.*"], dest);
  if (!isNewer) {
    return;
  }

  yield mkdirpAsync(path.dirname(dest));

  const modeDirs = glob.sync("lib/wed/modes/**/metas/*_meta.js");
  const metas = {};
  modeDirs.forEach((x) => {
    // Drop initial "lib/" and final ".js"
    x = x.substring(4, x.length - 3);
    const name = x.replace(/^.*\/(.*?)_meta$/, "$1");
    metas[name] = x;
  });

  const exporting = { metas };

  yield fs.writeFileAsync(dest, `define(${JSON.stringify(exporting)});`);
}));

function htmlTask(suffix) {
  gulp.task(`build-html${suffix}`, () => {
    const dest = `build/standalone${suffix}`;
    return gulp.src(["web/*.html", "web/dashboard/index.html",
                     "web/mmwp/index.html"],
                    { base: "web" })
      .pipe(gulpNewer(dest))
      .pipe(gulp.dest(dest));
  });
}

htmlTask("");
htmlTask("-optimized");

gulp.task("build-standalone",
          [].concat(
            "build-only-standalone",
            "build-standalone-web",
            "build-only-standalone-less",
            "build-only-standalone-config",
            "copy-log4javascript",
            copyTasks,
            "build-schemas",
            "build-samples",
            "build-html",
            "build-info",
            "generate-mode-map",
            "generate-meta-map"),
          () => mkdirpAsync("build/ajax"));

gulp.task("build-bundled-doc", ["build-standalone"],
          Promise.coroutine(function *task() {
            // The strategy here is to remove everything except what is in the
            // help.rst ifle, which becomes index.rst and is modified to deal
            // with a theme bug.

            const stamp = stampPath("bundled-doc");
            const buildBundledDoc = "build/bundled-doc";
            const standaloneDoc = "build/standalone/doc";

            const isNewer = yield newer("doc/**/*", stamp);

            if (!isNewer) {
              gutil.log("Skipping generation of bundled documentation.");
              return;
            }

            yield del([buildBundledDoc, standaloneDoc]);
            yield cprp("doc", buildBundledDoc);

            // help.rst becomes our index.rst.
            yield cprp("doc/help.rst", path.join(buildBundledDoc, "index.rst"));

            // Then we keep only the index and make that.
            yield del(["*.rst", "!index.rst"], { cwd: buildBundledDoc });
            yield exec(`make -C ${buildBundledDoc} html`);
            yield fs.renameAsync(path.join(buildBundledDoc, "_build/html"),
                                 standaloneDoc);
            yield touchAsync(stamp);
          }));

gulp.task(
  "build-optimized-config", ["config"],
  Promise.coroutine(function *task() {
    const script = "misc/create_optimized_config.js";
    const origConfig = "build/config/requirejs-config-dev.js";
    const buildConfig = "requirejs.build.js";
    const optimizedConfig = "build/standalone-optimized/requirejs-config.js";

    const isNewer = yield newer([script, origConfig, buildConfig],
                                optimizedConfig);
    if (!isNewer) {
      return;
    }

    yield mkdirpAsync(path.dirname(optimizedConfig));
    yield exec(`node ${script} ${origConfig} > ${optimizedConfig}`);
  }));

function *buildStandaloneOptimized() {
  const stamp = stampPath("standalone-optimized");
  const newStamp = `${stamp}.new`;

  yield exec("find build/standalone -printf \"%p %t %s\n\" | " +
             `sort > ${newStamp}`);

  const same = yield sameFiles(stamp, newStamp);
  if (!same) {
    yield new Promise((resolve, reject) => {
      rjs.optimize(["requirejs.build.js"], resolve, reject);
    })
      .catch(err => del("build/standalone-optimized/")
             .then(() => {
               throw err;
             }));
    yield fs.moveAsync(newStamp, stamp, { clobber: true });
  }
}

gulp.task("build-standalone-optimized", [
  "stamp-dir",
  "build-standalone",
  "build-html-optimized",
  "build-optimized-config",
  "build-test-files",
  "build-standalone-optimized-web",
], Promise.coroutine(buildStandaloneOptimized));

gulp.task("rst-doc", () =>
          gulp.src("*.rst", { read: false })
          // eslint-disable-next-line array-callback-return
          .pipe(es.map((file, callback) => {
            const dest = `${file.path.substr(
                  0, file.path.length - path.extname(file.path).length)}.html`;
            exec(`${options.rst2html} ${file.path}` +
                 ` ${dest}`).asCallback(callback);
          })));

gulp.task("default", ["build"]);

gulp.task("doc", ["rst-doc", "jsdoc3-doc"]);

// We make this a different task so that the check can be performed as
// early as possible.
gulp.task("gh-pages-check", Promise.coroutine(function *task() {
  let [out] = yield checkOutputFile("git",
                                    ["rev-parse", "--abbrev-ref", "HEAD"]);
  out = out.trim();
  if (out !== "master" && !options.force_gh_pages_build) {
    throw new Error(`***
Not on master branch. Don't build gh-pages-build on
a branch other than master.
***`);
  }

  if (!options.unsafe_deployment) {
    // We use this only for the side effect it has:
    // it fails of the current working directory is
    // unclean.
    yield exec("node ./misc/generate_build_info.js > /dev/null");
  }
}));

function *ghPages() {
  const dest = "gh-pages";
  const merged = "build/merged-gh-pages";
  yield fs.emptyDirAsync(dest);
  yield del(merged);
  yield cprp("doc", merged);

  // Yep we invoke make on the documentation.
  yield exec(`make -C ${merged} html`);

  yield exec(`cp -rp ${merged}/_build/html/* build/api ${dest}`);

  const destBuild = `${dest}/build`;
  yield mkdirpAsync(destBuild);
  yield cprpdir(["build/samples", "build/schemas", "build/standalone",
                 "build/standalone-optimized"], destBuild);

  for (const tree of ["standalone", "standalone-optimized"]) {
    const rjsConfig = `${dest}/build/${tree}/requirejs-config.js`;
    const globalConfig = `${dest}/build/${tree}/lib/global-config.js`;
    yield fs.moveAsync(rjsConfig, `${rjsConfig}.t`);
    yield exec("node misc/modify_config.js -d paths.browser_test " +
               `${rjsConfig}.t > ${rjsConfig}`);

    yield fs.moveAsync(globalConfig, `${globalConfig}.t`);
    yield exec("node misc/modify_config.js -d config.ajaxlog -d config.save " +
               `${globalConfig}.t > ${globalConfig}`);

    yield del([`${rjsConfig}.t`,
               `${globalConfig}.t`,
               `${dest}/build/${tree}/test.html`,
               `${dest}/build/${tree}/mocha_frame.html`,
               `${dest}/build/${tree}/wed_test.html`]);
  }
}

gulp.task("gh-pages", ["gh-pages-check", "default", "doc"],
          Promise.coroutine(ghPages));

gulp.task("copy-test-files", () => {
  const dest = "build/test-files";
  gulp.src("browser_test/convert_test_data/**", { base: "browser_test" })
    .pipe(gulpNewer(dest))
    .pipe(gulp.dest(dest));
});

const convertHTMLDirs = ["dloc", "guiroot", "tree_updater"]
        .map(x => `browser_test/${x}_test_data`);
const convertXMLDirs = glob.sync("browser_test/*_test_data")
        .filter(x => x !== "browser_test/convert_test_data" &&
                convertHTMLDirs.indexOf(x) === -1);

gulp.task("convert-xml-test-files", (callback) => {
  const promises = [];
  gulp.src(convertXMLDirs.map(x => `${x}/**`),
           { base: "browser_test", read: false, nodir: true })
    .on("data", (file) => {
      const p = Promise.coroutine(function *dataPromise() {
        const ext = path.extname(file.relative);
        const destName = path.join(
          "build/test-files",
          file.relative.substring(0, file.relative.length - ext.length));
        const dest = `${destName}_converted.xml`;

        const tei = yield existsInFile(file.path,
                                       /http:\/\/www.tei-c.org\/ns\/1.0/);

        let isNewer;
        let xsl;
        if (tei) {
          xsl = "test/xml-to-xml-tei.xsl";
          isNewer = yield newer([file.path, xsl], dest);
        }
        else {
          isNewer = yield newer(file.path, dest);
        }

        if (!isNewer) {
          return;
        }

        if (tei) {
          yield exec(`${options.saxon} -s:${file.path} -o:${dest} -xsl:${xsl}`);
        }
        else {
          yield mkdirpAsync(path.dirname(dest));
          yield cprp(file.path, dest);
        }
      })();
      promises.push(p);
    })
    .on("end", () => {
      Promise.all(promises).asCallback(callback);
    });
});

gulp.task("convert-html-test-files", (callback) => {
  const promises = [];
  gulp.src(convertHTMLDirs.map(x => `${x}/**`),
           { base: "browser_test", read: false, nodir: true })
    .on("data", (file) => {
      const p = Promise.coroutine(function *dataPromise() {
        const tei = yield existsInFile(file.path,
                                       /http:\/\/www.tei-c.org\/ns\/1.0/);
        const xsl = tei ? "test/xml-to-html-tei.xsl" : "lib/wed/xml-to-html.xsl";
        const ext = path.extname(file.relative);
        const destName = path.join(
          "build/test-files",
          file.relative.substring(0, file.relative.length - ext.length));
        const dest = `${destName}_converted.xml`;

        const isNewer = yield newer([file.path, xsl], dest);
        if (!isNewer) {
          return;
        }

        yield exec(`${options.saxon} -s:${file.path} -o:${dest} -xsl:${xsl}`);
      })();
      promises.push(p);
    })
    .on("end", () => {
      Promise.all(promises).asCallback(callback);
    });
});

gulp.task("build-test-files", ["copy-test-files",
                               "convert-html-test-files",
                               "convert-xml-test-files"]);

function runTslint(program) {
  const files = tslint.Linter.getFileNames(program);
  ts.getPreEmitDiagnostics(program);
  return gulp.src(files)
    .pipe(gulpTslint({
      formatter: "verbose",
      program,
    }))
    .pipe(gulpTslint.report({
      summarizeFailureOutput: true,
    }));
}

gulp.task("tslint", ["tslint-wed", "tslint-web", "tslint-web-test"]);

gulp.task("tslint-wed", () => runTslint(wedProgram));

gulp.task("tslint-web", () => runTslint(webProgram));

gulp.task("tslint-web-test", () => runTslint(webTestProgram));

gulp.task("eslint", () =>
          gulp.src(["lib/**/*.js", "*.js", "bin/**", "config/**/*.js",
                    "gulptasks/**/*.js", "misc/**/*.js", "test/**/*.js"])
          .pipe(eslint())
          .pipe(eslint.format())
          .pipe(eslint.failAfterError()));

gulp.task("lint", ["eslint", "tslint"]);

const testNode = {
  name: "test-node",
  deps: ["lint", "build-standalone", "build-test-files"],
  func: function *testNode() {
    if (!options.skip_semver) {
      yield versync.run({
        verify: true,
        onMessage: gutil.log,
      });
    }

    yield spawn("./node_modules/.bin/mocha",
                options.mocha_params ? options.mocha_params.split() : [],
                { stdio: "inherit" });
  },
};

const testBrowser = {
  name: "test-browser",
  deps: ["lint", "build", "build-test-files"],
  func: function testBrowser() {
    return spawn("./misc/server.js", ["runner"], { stdio: "inherit" });
  },
};

const test = sequence("test", testNode, testBrowser);

// Features is an optional array of features to run instead of running all
// features.
function selenium(features) {
  let args = options.behave_params ? shell.parse(options.behave_params) : [];

  // We check what we obtained from `behave_params` too, just in case someone is
  // trying to select a specific feature though behave_params.
  if (args.filter(x => /\.feature$/.test(x)).length === 0 && !features) {
    args.push("selenium_test");
  }

  if (features) {
    args = features.concat(args);
  }

  return spawn("behave", args, { stdio: "inherit" });
}

const seleniumTest = {
  name: "selenium-test",
  deps: ["build", "build-test-files"],
  func: () => selenium(),
};

for (const feature of glob.sync("selenium_test/*.feature")) {
  gulp.task(feature, seleniumTest.deps, () => selenium([feature]));
}

const distNoTest = {
  name: "dist-notest",
  deps: ["build"],
  *func() {
    yield del("build/wed-*.tgz");
    const dist = "build/dist";
    yield fs.emptyDirAsync(dist);
    yield cprpdir(["build/standalone", "build/standalone-optimized",
                   "bin", "package.json", "npm-shrinkwrap.json"],
                  dist);
    yield cprp("NPM_README.md", "build/dist/README.md");
    yield exec("ln -sf `(cd build; npm pack dist)` build/LATEST-DIST.tgz");
    yield del("build/t");
    yield mkdirpAsync("build/t/node_modules");
    yield exec("(cd build/t; npm install ../LATEST-DIST.tgz)");
    yield del("build/t");
  },
};

sequence("dist", test, seleniumTest, distNoTest);

function publish() {
  return spawn("npm", ["publish", "build/LATEST-DIST.tgz"],
               { stdio: "inherit" });
}

gulp.task("publish", ["dist"], publish);

gulp.task("publish-notest", ["dist-notest"], publish);

gulp.task("clean", () => del(["build", "gh-pages", "*.html"]));

gulp.task("distclean", ["clean"],
          () => del(["downloads", "node_modules"]));

const venvPath = ".venv";
gulp.task("venv", [],
          () => fs.accessAsync(venvPath).catch(() => exec("virtualenv .venv")));

gulp.task("dev-venv", ["venv"],
          () => exec(".venv/bin/pip install -r dev_requirements.txt"));
