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
export declare function install(win: Window, check?: (() => boolean), force?: boolean): void;
