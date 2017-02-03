import path from "path";
import * as config from "./config";
import { fs, checkOutputFile, mkdirpAsync } from "./util";

export function wget(url, dest) {
  const wgetCmd = config.options.wget;
  return checkOutputFile(wgetCmd,
                         ["--no-use-server-timestamps", "-O", dest, url],
                         { cwd: "downloads" }).catch((e) => {
                           fs.unlinkSync(path.join("downloads", dest));
                           throw e;
                         });
}

export function wgetIfMissing(url, dest) {
  const fullPath = path.join("downloads", dest);
  const dir = path.dirname(fullPath);
  return fs.accessAsync(fullPath)
    .catch(() => mkdirpAsync(dir).then(() => wget(url, dest)));
}
