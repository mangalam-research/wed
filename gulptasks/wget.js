"use strict";

import * as config from "./config";
import path from "path";
import { fs, checkOutputFile, mkdirpAsync, execFile } from "./util";

export function wget(url, dest) {
    const wget_cmd = config.options.wget;
    return execFile(
        wget_cmd,
        ["--no-use-server-timestamps", "-O", dest, url],
        { cwd: "downloads" }).catch((e) => {
            fs.unlinkSync(path.join("downloads", dest));
            throw e;
        });
}

export function wget_if_missing(url, dest) {
    const full_path = path.join("downloads", dest);
    const dir = path.dirname(full_path);
    return fs.accessAsync(full_path)
        .catch(() => mkdirpAsync(dir).then(() => wget(url, dest)));
}
