"use strict";

import gulp from "gulp";
import gulpNewer from 'gulp-newer';
import child_process from "child_process";
import Promise from "bluebird";
import gutil from "gulp-util";
import _fs from "fs-extra";
import _del from "del";
import touch from "touch";
import path from "path";
import { internals } from "./config";

export const fs = Promise.promisifyAll(_fs);

export const touchAsync = Promise.promisify(touch);
export const mkdirpAsync = fs.ensureDirAsync;
export const del = _del;
export const copy = fs.copyAsync;

export function cprp (src, dest) {
    return copy(src, dest, { clobber: true, preserveTimestamps: true });
}

export function cprpdir(src, dest) {
    if (!(src instanceof Array))
        src = [src];
    const promises = [];
    for (let s of src) {
        const basename = path.basename(s);
        promises.push(cprp(s, path.join(dest, basename)));
    }

    if (promises.length === 0)
        return promises[0];

    return Promise.each(promises, () => {});
}

export function exec(command, options) {
    return new Promise((resolve, reject) => {
        child_process.exec(command, options, (err, stdout, stderr) => {
            if (err) {
                gutil.log(stdout);
                gutil.log(stderr);
                reject(err);
            }
            resolve(stdout, stderr);
        });
    });
}

export function checkStatusFile(file, args, options) {
    return new Promise((resolve, reject) => {
        child_process.execFile(file, args, options,
                               (err, stdout, stderr) =>
                                   resolve(err ? err.code : 0));
    });
}

export function checkOutputFile(file, args, options) {
    return new Promise((resolve, reject) => {
        child_process.execFile(file, args, options,
                               (err, stdout, stderr) => {
                                   if (err) {
                                       gutil.log(stdout);
                                       gutil.log(stderr);
                                       return reject(err);
                                   }
                                   resolve([stdout, stderr]);
                               });
    });
}

export function newer(src, dest, force_dest_file) {
    // We use gulp-newer to perform the test and convert it to a
    // promise.
    const options = {
        dest
    };

    if (force_dest_file)
        options.map = function () { return "."; };

    return new Promise((resolve, reject) => {
        const stream = gulp.src(src, { read: false })
                  .pipe(gulpNewer(options));

        function end() {
            resolve(false);
        }

        stream.on("data", () => {
            stream.removeListener('end', end);
            stream.end();
            resolve(true);
        });

        stream.on("end", end);
    });
}

export function copy_if_newer(src, dest) {
    return src
        .pipe(gulpNewer(dest))
        .pipe(gulp.dest(dest));
}

export function same_files(a, b) {
    return Promise.coroutine(function* () {
        const [stats_a, stats_b] = yield Promise.all([
            fs.statAsync(a).catch(() => null),
            fs.statAsync(b).catch(() => null)]);

        if (!stats_a || !stats_b || stats_a.size !== stats_b.size)
            return false;

        const size = stats_a.size;

        const [fd_a, fd_b] = yield Promise.all([
            fs.openAsync(a, 'r'),
            fs.openAsync(b, 'r')]);

        const bufsize = 64*1024;
        const buf_a =  new Buffer(bufsize);
        const buf_b =  new Buffer(bufsize);
        buf_a.fill(0);
        buf_b.fill(0);
        let read = 0;

        while (read < size) {
            yield Promise.all([fs.readAsync(fd_a, buf_a, 0, bufsize,
                                            read),
                               fs.readAsync(fd_b, buf_b, 0, bufsize,
                                            read)]);
            // The last read will probably be partially filling the
            // buffer but it does not matter because in the previous
            // iteration, the data was equal.
            if (!buf_a.equals(buf_b))
                return false;
            read += bufsize;
        }

        return true;
    })();
}

export function stamp_path(name) {
    return path.join(internals.stamp_dir, name + ".stamp");
}

export function exists_in_file(path, re) {
    return fs.readFileAsync(path).then(
        (data) => data.toString().search(re) !== -1);
}

export function spawn(cmd, args, options) {
    return new Promise((resolve, reject) => {
        const child = child_process.spawn(cmd, args || [], options || {});

        child.on('exit', (code, signal) => {
            if (code) {
                reject(
                    new Error(`child terminated with code: ${code}`));
                return;
            }

            if (signal) {
                reject(
                    new Error(`child terminated with signal: ${signal}`));
                return;
            }

            resolve();
        });
    });
}

export function sequence(name, ...tasks) {
    const all_deps = [];
    const funcs = [];

    // The last element of tasks can be a final function to run after
    // all the tasks.
    let final = tasks[tasks.length - 1];

    if (final instanceof Function)
        tasks.pop(); // Normalize the array.
    else
        final = undefined; // No final function to run.

    for (let task of tasks) {
        let func = task.func;
        // Ideally we'd use a instanceof test but apparently babel
        // does not make a GeneratorFunction global available...
        func = func.constructor.name === "GeneratorFunction" ?
            Promise.coroutine(func) : func;
        gulp.task(task.name, task.deps, func);
        all_deps.push(task.deps);
        funcs.push(func);
    }

    const flattened = [].concat(...all_deps);

    if (final)
        funcs.push(final);

    function* routine() {
        for (let func of funcs)
            yield func();
    }

    gulp.task(name, flattened, Promise.coroutine(routine));

    return {
        name,
        deps: flattened,
        func: routine
    };
}
