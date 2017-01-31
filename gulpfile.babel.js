"use strict";

import "babel-polyfill";
import gulp from 'gulp';
import gulpNewer from 'gulp-newer';
import gulpFilter from 'gulp-filter';
import less from 'gulp-less';
import rename from "gulp-rename";
import debug from "gulp-debug";
import changed from "gulp-changed";
import es from "event-stream";
import vinylFile from "vinyl-file";
import Promise from "bluebird";
import path from "path";
import child_process from "child_process";
import gutil from "gulp-util";
import glob from "glob";
import shell from "shell-quote";
import { ArgumentParser } from "argparse";
import * as config from "./gulptasks/config";
import { internals } from "./gulptasks/config";
import * as util from "./gulptasks/util";
import { same_files, del, newer, exec, checkOutputFile, touchAsync, cprp,
         cprpdir, spawn, exists_in_file, sequence, mkdirpAsync, fs}
from "./gulptasks/util";
import requireDir from "require-dir";
import rjs from "requirejs";
import wrap_amd from "gulp-wrap-amd";
import versync from "versync";

// Try to load local configuration options.
let local_config = {};
try {
    local_config = require('./gulp.local');
}
catch (e) {
    if (e.code !== "MODULE_NOT_FOUND")
        throw e;
}

let parser = new ArgumentParser({addHelp:true});

for (let prop in config.option_definitions) {
    let option_options = config.option_definitions[prop];
    let local_override = local_config[prop];
    if (local_override !== undefined)
        option_options.defaultValue = local_override;

    let option_name = prop.replace(/_/g, "-");
    parser.addArgument(["--" + option_name], option_options);
}

// We have this here so that the help message is more useful than
// without. At the same time, this positional argument is not
// *required*.
parser.addArgument(['target'], {
    help: "Target to execute.",
    nargs: "?",
    defaultValue: "default"
});

const options = config.options = parser.parseArgs(process.argv.slice(2));

// We purposely import the files there at this point so that the
// configuration is set once and for all before they execute. Doing
// this allows having code that depends on the configuration values.
requireDir("./gulptasks");


gulp.task("config", () => {
    const dest = "build/config";
    // In effect, anything in local_config overrides the same file in
    // config.
    const config = "config";
    const local_config = "local_config";
    return gulp.src(path.join(config, "**"), { nodir: true })
        .pipe(es.map((file, callback) =>
            vinylFile.read(
                path.join(local_config, file.relative),
                {base: local_config},
                (err, override) => callback(null, err ? file : override))))
    // We do not use newer here as it would sometimes have
    // unexpected effects.
        .pipe(changed(dest, { hasChanged: changed.compareSha1Digest }))
        .pipe(gulp.dest(dest));
});

let build_deps = ["build-standalone", "build-bundled-doc"];
if (options.optimize)
    build_deps.push("build-standalone-optimized");
gulp.task("build", build_deps);

gulp.task("build-only-standalone", () => {
    let dest = "build/standalone/";
    return gulp.src(["lib/**/*", "!**/*_flymake.*", "!**/*.less"],
                    { base: '.' })
        .pipe(gulpNewer(dest))
        .pipe(gulp.dest(dest));
});

gulp.task("build-only-standalone-config", ["config"], () => {
    const dest = "build/standalone";
    return gulp.src("build/config/requirejs-config-dev.js")
        .pipe(rename("requirejs-config.js"))
        .pipe(gulpNewer(dest))
        .pipe(gulp.dest(dest));
});

let less_inc = "lib/wed/less-inc/";

gulp.task("stamp-dir", () => mkdirpAsync(internals.stamp_dir));

gulp.task("build-only-standalone-less", ["stamp-dir",
                                         "build-only-standalone",
                                         "copy-bootstrap"],
          (callback) => {
              const dest = "build/standalone/";
              const stamp = util.stamp_path("less");
              const inc_files = less_inc + "**/*.less";

              // We have to filter out the included files from the
              // less transformation but we do include them literally
              // in the final package so that modes developed by users
              // of wed can use them.
              const filter = gulpFilter(["lib/**/*", "!" + inc_files],
                                        { restore: true });
              // This is a bit of a compromise. This will actually run
              // less for *all* less files if *any* of the less files
              // changes.
              gulp.src(["lib/**/*.less", inc_files, "!**/*_flymake.*"],
                       { base: '.' })
                  .pipe(gulpNewer(stamp))
                  .pipe(filter)
                  .pipe(less({ paths: less_inc }))
                  .pipe(filter.restore)
                  .pipe(gulp.dest(dest))
                  .on('end', () => {
                      touchAsync(stamp).asCallback(callback);
                  });
          });

gulp.task("npm", ["stamp-dir"],
          Promise.coroutine(function* () {
              const stamp = util.stamp_path("npm");

              const is_newer = yield newer(["package.json",
                                            "npm-shrinkwrap.json"], stamp);

              if (!is_newer) {
                  gutil.log("Skipping npm.");
                  return;
              }

              yield mkdirpAsync("node_modules");
              yield exec("npm install");
              yield touchAsync(stamp);
          }));

const copy_tasks = [];
function npm_copy_task(...args) {
    // Package is reserved. So `pack`.
    let name, src, dest, pack;
    // It is always possible to past an options object as the last
    // argument.
    const last = args[args.length - 1];
    let options;
    if (typeof last === "object") {
        options = last;
        args.pop();
    }
    else {
        options = {};
    }

    if (args.length === 3) {
        // All arguments passed: just unpack.
        [name, src, dest] = args;
        pack = "node_modules/" + src.split("/", 1)[0];
    }
    else if (args.length === 2) {
        const [arg1, arg2] = args;
        // There are two possibilities.
        if (/[\/\*]/.test(arg1)) {
            // Arg1 is path-like: we interpret it as a source, arg2 is
            // then dest. Task name and package names are derived from
            // arg1.
            src = arg1;
            dest = arg2;
            name = src.split("/", 1)[0];
            pack = "node_modules/" + name;
        }
        else {
            // Arg1 is not path-like: we interpret it as a task and
            // package name. Arg2 is the source. We assume `dest` is
            // `'external'`;
            name = arg1;
            src = arg2;
            dest = "external";
            pack = "node_modules/" + name;
        }
    }
    else if (args.length === 1) {
        // Only one argument. It is the source. We derive the task and
        // package names from it. And we assume dest is '`external`'.
        [src] = args;
        dest = "external";
        name = src.split("/", 1)[0];
        pack = "node_modules/" + name;
    }

    if (!(src instanceof Array))
        src = [src];

    const complete_src = src.map((x) => `node_modules/${src}`);
    const complete_dest = "build/standalone/lib/" + dest;

    // We want to match everything except the package directory
    // itself.
    const filter = gulpFilter((file) => !/node_modules\/$/.test(file.base));

    //
    // For the ``newer`` computation, we have to depend on the actual
    // file to be copied and on the package directory itself. The fact
    // is that when npm installs a package, it preserves the
    // modification dates on the files. Consider:
    //
    // - June 1st: I ran make.
    //
    // - June 2nd: the package that contains ``src`` has a new version
    //   released.
    //
    // - June 3rd: I run make clean and make again. So ``dest`` has a
    //   stamp of June 3rd.
    //
    // - June 4th: I upgrade the package that contains ``src``. I run
    //   make but it does not update ``dest`` because ``src`` has a
    //   timestamp of June 2nd or earlier.
    //
    // Therefore I have to depend on the package itself too.
    //

    const full_name = "copy-" + name;
    const stamp = util.stamp_path(full_name);
    gulp.task(full_name, ["stamp-dir", "npm"],  (callback) => {
        let stream = gulp.src([pack].concat(complete_src));

        if (options.rename) {
            stream = stream.pipe(rename(options.rename));
        }

        stream = stream.pipe(gulpNewer(stamp))
        // Remove the package from the stream...
            .pipe(filter);

        if (options.wrap_amd) {
            stream = stream.pipe(wrap_amd({ exports: "module.exports" }));
        }

        stream.pipe(gulp.dest(complete_dest))
            .on("end", () => touchAsync(stamp).asCallback(callback));
    });

    copy_tasks.push(full_name);
}

npm_copy_task("jquery/dist/jquery.js");

npm_copy_task("bootstrap/dist/**/*", "external/bootstrap");

npm_copy_task("font-awesome/{css,fonts}/**/*",
              "external/font-awesome");

npm_copy_task("text-plugin", "requirejs-text/text.js", "requirejs");

npm_copy_task("requirejs/require.js", "requirejs");

npm_copy_task("optional-plugin", "requirejs-optional/optional.js", "requirejs");

npm_copy_task("typeahead", "typeahead.js/dist/typeahead.bundle.min.js");

npm_copy_task("pubsub", "pubsub-js/src/pubsub.js");

npm_copy_task("localforage/dist/localforage.js");

npm_copy_task("async/lib/async.js");

npm_copy_task("angular/angular.js");

npm_copy_task("bootbox", "bootbox.js/bootbox.js");

npm_copy_task("urijs/src/**", "external/urijs");

npm_copy_task("lodash", "lodash-amd/{modern/**,main.js,package.json}",
              "external/lodash");

npm_copy_task("classlist", "classlist-polyfill/src/index.js",
              { rename: "classList.js"});

npm_copy_task("salve/salve*");

npm_copy_task("interact.js/dist/interact.min.js");

npm_copy_task("merge-options", "merge-options/index.js",
              { rename: "merge-options.js", wrap_amd: true });

npm_copy_task("is-plain-obj", "is-plain-obj/index.js",
              { rename: "is-plain-obj.js", wrap_amd: true });

npm_copy_task("bluebird/js/browser/bluebird.js");

npm_copy_task("last-resort/dist/last-resort.js**");

npm_copy_task("rangy/lib/**", "external/rangy");

npm_copy_task("bootstrap-notify/bootstrap-notify*.js");

gulp.task("build-info", Promise.coroutine(function* () {
    const dest = "build/standalone/lib/wed/build-info.js";
    const is_newer = yield newer(["lib/**", "!**/*_flymake.*"], dest);
    if (!is_newer)
        return;

    yield mkdirpAsync(path.dirname(dest));

    yield exec('node misc/generate_build_info.js --unclean ' +
               `--module > ${dest}`);
}));

function html_task(suffix) {
    gulp.task("build-html" + suffix, () => {
        const dest = "build/standalone" + suffix;
        return gulp.src("web/**.html")
            .pipe(gulpNewer(dest))
            .pipe(gulp.dest(dest));
    });
}

html_task('');
html_task('-optimized');

gulp.task("build-standalone",
          [].concat(
              "build-only-standalone",
              "build-only-standalone-less",
              "build-only-standalone-config",
              "copy-log4javascript",
              "copy-typeaheadjs.css",
              copy_tasks,
              "build-schemas",
              "build-samples",
              "build-html",
              "build-info"),
          () => mkdirpAsync('build/ajax'));

gulp.task("build-bundled-doc", ["build-standalone"],
          Promise.coroutine(function *() {
    // The strategy here is to remove everything except what is in the
    // help.rst ifle, which becomes index.rst and is modified to deal
    // with a theme bug.

    const stamp = util.stamp_path("bundled-doc");
    const build_bundled_doc = "build/bundled-doc";
    const standalone_doc = "build/standalone/doc";

    const is_newer = yield newer("doc/**/*", stamp);

    if (!is_newer) {
        gutil.log("Skipping generation of bundled documentation.");
        return;
    }

    yield del([build_bundled_doc, standalone_doc]);
    yield cprp("doc", build_bundled_doc);

    // help.rst becomes our index.rst.
    yield cprp("doc/help.rst", path.join(build_bundled_doc, "index.rst"));

    // Then we keep only the index and make that.
    yield del(["*.rst", "!index.rst"], { cwd: build_bundled_doc });
    yield exec(`make -C ${build_bundled_doc} html`);
    yield fs.renameAsync(path.join(build_bundled_doc, "_build/html"),
                         standalone_doc);
    yield touchAsync(stamp);
}));

gulp.task("build-optimized-config", ["config"],
          Promise.coroutine(function* () {
    const script = "misc/create_optimized_config.js";
    const config = "build/config/requirejs-config-dev.js";
    const build_config = "requirejs.build.js";
    const optimized_config = "build/standalone-optimized/requirejs-config.js";

    const is_newer = yield newer([script, config, build_config],
                                 optimized_config);
    if (!is_newer)
        return;

    yield mkdirpAsync(path.dirname(optimized_config));
    yield exec(`node ${script} ${config} > ${optimized_config}`);
}));

function* build_standalone_optimized() {
    const stamp = util.stamp_path("standalone-optimized");
    const new_stamp = `${stamp}.new`;

    yield exec(`find build/standalone -printf "%p %t %s\n" | ` +
               `sort > ${new_stamp}`);

    const same = yield same_files(stamp, new_stamp);
    if (!same) {
        yield new Promise((resolve, reject) => {
            rjs.optimize(["requirejs.build.js"], resolve, reject);
        })
            .catch((err) => del("build/standalone-optimized/")
                   .then(() => { throw err; }));
        yield fs.moveAsync(new_stamp, stamp, { clobber: true });
    }
}

gulp.task("build-standalone-optimized",
          ["stamp-dir",
           "build-standalone",
           "build-html-optimized",
           "build-optimized-config",
           "build-test-files"],
          Promise.coroutine(build_standalone_optimized));

gulp.task("rst-doc", () =>
          gulp.src("*.rst", { read: false })
          .pipe(es.map((file, callback) => {
              const dest = file.path.substr(
                  0, file.path.length - path.extname(file.path).length) +
                        ".html";
              exec(`${options.rst2html} ${file.path}` +
                   ` ${dest}`).asCallback(callback);
          })));

gulp.task("default", ["build"]);

gulp.task("doc", ["rst-doc", "jsdoc3-doc"]);

// We make this a different task so that the check can be performed as
// early as possible.
gulp.task("gh-pages-check", Promise.coroutine(function* () {
    let [out, err] = yield checkOutputFile(
        "git", ["rev-parse", "--abbrev-ref", "HEAD"]);
    out = out.trim();
    if (out !== "master" && !options.force_gh_pages_build)
        throw new Error(`***
Not on master branch. Don't build gh-pages-build on
a branch other than master.
***`);

    if (!options.unsafe_deployment) {
        // We use this only for the side effect it has:
        // it fails of the current working directory is
        // unclean.
        yield exec('node ./misc/generate_build_info.js > /dev/null');
    }
}));

function* gh_pages() {
    const dest = "gh-pages";
    const merged = "build/merged-gh-pages";
    yield fs.emptyDirAsync(dest);
    yield del(merged);
    yield cprp('doc', merged);

    // Yep we invoke make on the documentation.
    yield exec(`make -C ${merged} html`);

    yield exec(`cp -rp ${merged}/_build/html/* build/api ${dest}`);

    const dest_build = `${dest}/build`;
    yield mkdirpAsync(dest_build);
    yield cprpdir(['build/samples', 'build/schemas', 'build/standalone',
                   'build/standalone-optimized'], dest_build);

    for (let tree of ["standalone", "standalone-optimized"]) {
	const config=`${dest}/build/${tree}/requirejs-config.js`;
	yield fs.moveAsync(config, `${config}.t`);
	yield exec(`node misc/modify_config.js -d config.ajaxlog ` +
		   `-d config.save -d paths.browser_test ` +
		   `${config}.t > ${config}`);
        yield del([`${config}.t`,
                   `${dest}/build/${tree}/test.html`,
		   `${dest}/build/${tree}/mocha_frame.html`,
		   `${dest}/build/${tree}/wed_test.html`]);
    }
}

gulp.task("gh-pages", ["gh-pages-check", "default", "doc"],
          Promise.coroutine(gh_pages));

gulp.task('copy-test-files', () => {
    const dest = "build/test-files";
    gulp.src("browser_test/convert_test_data/**", { base: "browser_test"})
        .pipe(gulpNewer(dest))
        .pipe(gulp.dest(dest));
});

const convert_html_dirs = ["dloc", "guiroot", "tree_updater"]
          .map((x) => `browser_test/${x}_test_data`);
const convert_xml_dirs =
          glob.sync("browser_test/*_test_data")
          .filter((x) => x !== "browser_test/convert_test_data" &&
                  convert_html_dirs.indexOf(x) === -1);

gulp.task('convert-xml-test-files', (callback) => {
    const promises = [];
    gulp.src(convert_xml_dirs.map((x) => `${x}/**` ),
             { base: "browser_test", read: false, nodir: true})
        .on("data", (file) => {
            const p = Promise.coroutine(function* () {
                const ext = path.extname(file.relative);
                const dest = path.join(
                    'build/test-files',
                    file.relative.substring(
                        0,
                        file.relative.length - ext.length)) +
                          "_converted.xml";

                const tei = yield exists_in_file(
                    file.path, /http:\/\/www.tei-c.org\/ns\/1.0/);

                let is_newer;
                let xsl;
                if (tei) {
                    xsl = 'test/xml-to-xml-tei.xsl';
                    is_newer = yield newer([file.path, xsl], dest);
                }
                else {
                    is_newer = yield newer(file.path, dest);
                }

                if (!is_newer)
                    return;

                if (tei) {
                    yield exec(
                        `${options.saxon} -s:${file.path} -o:${dest} ` +
                            `-xsl:${xsl}`);
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

gulp.task('convert-html-test-files', (callback) => {
    const promises = [];
    gulp.src(convert_html_dirs.map((x) => `${x}/**` ),
             { base: "browser_test", read: false, nodir: true})
        .on("data", (file) => {
            const p = Promise.coroutine(function* () {
                const tei = yield exists_in_file(
                    file.path, /http:\/\/www.tei-c.org\/ns\/1.0/);
                const xsl = tei ? 'test/xml-to-html-tei.xsl' :
                          'lib/wed/xml-to-html.xsl';
                const ext = path.extname(file.relative);
                const dest = path.join(
                    'build/test-files',
                    file.relative.substring(
                        0,
                        file.relative.length - ext.length)) +
                          "_converted.xml";

                const is_newer = yield newer([file.path, xsl], dest);
                if (!is_newer) {
                    return;
                }

                yield exec(`${options.saxon} -s:${file.path} -o:${dest} ` +
                           `-xsl:${xsl}`);
            })();
            promises.push(p);
        })
        .on("end", () => {
            Promise.all(promises).asCallback(callback);
        });
});

gulp.task('build-test-files', ['copy-test-files',
                               'convert-html-test-files',
                               'convert-xml-test-files']);
const test_node = {
    name: "test-node",
    deps: ['build-standalone', 'build-test-files'],
    func: function* test_node() {
        if (!options.skip_semver) {
            yield versync.run({
                verify: true,
                onMessage: gutil.log,
            });
        }

        yield spawn("./node_modules/.bin/mocha",
                    options.mocha_params ? options.mocha_params.split(): [],
                    { stdio: 'inherit'});
    }
};

const test_browser = {
    name: "test-browser",
    deps: ['build', 'build-test-files'],
    func: function test_browser() {
        return spawn(
            "./server.js",
            ['runner'],
            { stdio: 'inherit'});
    }
};


const test = sequence("test", test_node, test_browser);

// Features is an optional array of features to run instead of running
// all features.
function selenium(features) {
    let args = (options.behave_params ?
                  shell.parse(options.behave_params) : []);

    // We check what we obtained from `behave_params` too, just in
    // case someone is trying to select a specific feature though
    // behave_params.
    if (args.filter((x) => /\.feature$/.test(x)).length === 0 && !features) {
        args.push("selenium_test");
    }

    if (features)
        args = features.concat(args);

    return spawn("behave", args, { stdio: 'inherit' });

}

const selenium_test = {
    name: "selenium-test",
    deps: ['build', 'build-test-files'],
    func: () => selenium()
};

for (let feature of glob.sync("selenium_test/*.feature")) {
    gulp.task(feature, selenium_test.deps, () => selenium([feature]));
}

const dist_notest = {
    name: "dist-notest",
    deps: ['build'],
    func: function* () {
        yield del('build/wed-*.tgz');
        const dist = 'build/dist';
        yield fs.emptyDirAsync(dist);
        yield cprpdir(['build/standalone', 'build/standalone-optimized',
                       'bin', 'package.json', 'npm-shrinkwrap.json'],
                      dist);
	yield cprp('NPM_README.md', 'build/dist/README.md');
	yield exec('ln -sf `(cd build; npm pack dist)` build/LATEST-DIST.tgz');
	yield del('build/t');
	yield mkdirpAsync('build/t/node_modules');
	yield exec('(cd build/t; npm install ../LATEST-DIST.tgz)');
	yield del('build/t');
    }
};

sequence('dist', test, selenium_test, dist_notest);

function publish() {
    return spawn('npm', ['publish', 'build/LATEST-DIST.tgz'],
                 { stdio: 'inherit' });
}

gulp.task('publish', ['dist'], publish);

gulp.task('publish-notest', ['dist-notest'], publish);

gulp.task("clean", () => del(["build", "gh-pages", "*.html"]));

gulp.task("distclean", ["clean"],
          () => del(["downloads", "node_modules"]));

const venv_path = ".venv";
gulp.task("venv", [],
          () => fs.accessAsync(venv_path).catch(
                  () => exec('virtualenv .venv')));

gulp.task("dev-venv", ['venv'],
          () => exec('.venv/bin/pip install -r dev_requirements.txt'));
