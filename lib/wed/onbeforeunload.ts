/**
 * The onbeforeunload handler for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
function defaultCheck(): boolean {
  return true;
}

/**
 * Installs an ``onbeforeunload`` handler.
 *
 * @param win The window to install it on.
 *
 * @param A check to perform to verify whether prompting is necessary. If the
 * check returns ``false``, no prompting will occur. If unspecified, the prompt
 * will always be presented.
 *
 * @param Whether to force the installation even if a previous handler was
 * already installed. If ``force`` is ``false`` then if a handler was previously
 * installed **by this module** then an exception will be raised. If ``true``
 * then the old handler will be overwritten.
 */
export function install(win: Window,
                        check: (() => boolean) = defaultCheck,
                        force: boolean = false): void {

  if (win.onbeforeunload != null &&
      // tslint:disable-next-line:no-any
      (win.onbeforeunload as any).installedByOnbeforeunload as boolean &&
      !force) {
    throw new Error("reregistering window with `force` false");
  }

  function newHandler(): true | undefined {
    const result = check();
    return result ? result : undefined;
  }

  // tslint:disable-next-line:no-any
  (newHandler as any).installedByOnbeforeunload = true;

  win.onbeforeunload = newHandler;
}

//  LocalWords:  reregistering Mangalam MPL Dubeau onbeforeunload
