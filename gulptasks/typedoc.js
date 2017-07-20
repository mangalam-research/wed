const gulp = require("gulp");
const gutil = require("gulp-util");
const Promise = require("bluebird");

const { options } = require("./config");
const { checkOutputFile, fs, newer, spawn, stampPath,
        touchAsync } = require("./util");

// This task also needs to check the hash of the latest commit because typedoc
// generates links to source based on the latest commit in effect when it is
// run. So if a commit happened between the time the doc was generated last, and
// now, we need to regenerate the docs.
gulp.task("typedoc", ["generate-ts", "stamp-dir", "lint"],
          Promise.coroutine(function *task() {
            const sources = ["lib/**/*.ts"];
            const stamp = stampPath("typedoc");
            const hashPath = "./build/typedoc.hash.txt";

            const [savedHash, [currentHash]] = yield Promise.all(
              [fs.readFileAsync(hashPath)
               .then(hash => hash.toString())
               .catch(() => undefined),
               checkOutputFile("git", ["rev-parse", "--short", "HEAD"]),
              ]);

            if ((currentHash === savedHash) && !(yield newer(sources, stamp))) {
              gutil.log("No change, skipping typedoc.");
              return;
            }

            const tsoptions = [
              "--out", "./build/api",
              "--name", "wed",
              "--tsconfig", "./lib/tsconfig.json",
              "--listInvalidSymbolLinks",
            ];

            if (!options.doc_private) {
              tsoptions.push("--excludePrivate");
            }

            yield spawn("./node_modules/.bin/typedoc", tsoptions,
                        { stdio: "inherit" });

            yield Promise.all([fs.writeFileAsync(hashPath, currentHash),
                               touchAsync(stamp)]);
          }));
