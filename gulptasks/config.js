"use strict";

/**
 * Definitions for the options passed on the command line. Each key in
 * the structure is an option name and the values are objects to be
 * passed to ``argparse``'s ``addArgument``.
 */
export const option_definitions = {
    saxon: {
        help: "Path to saxon.",
        defaultValue: "saxon"
    },
    jsdoc3: {
        help: "Path to jsdoc.",
        defaultValue: "node_modules/.bin/jsdoc"
    },
    wget: {
        help: "Path to wget.",
        defaultValue: "wget"
    },
    rst2html: {
        help: "Path to rst2html.",
        defaultValue: "rst2html"
    },
    odd2html: {
        help: "Path to the odd2html.xsl stylesheet.",
        defaultValue: "/usr/share/xml/tei/stylesheet/odds/odd2html.xsl"
    },
    dev: {
        help: "Are we in development mode?",
        type: Boolean,
        defaultValue: false
    },
    mocha_params: {
        help: "Parameters to pass to Mocha.",
        defaultValue: ''
    },
    behave_params: {
        help: "Parameters to pass to behave.",
        defaultValue: undefined
    },
    tei: {
        help: "Path to the directory containing the TEI stylesheets.",
        defaultValue: "/usr/share/xml/tei/stylesheet"
    },
    skip_semver: {
        help: "If true skip the semver check.",
        type: Boolean,
        action: 'storeTrue',
        defaultValue: undefined
    },
    optimize: {
        help: "Whether the build should create an optimized version of " +
            "wed by default.",
        type: Boolean,
        defaultValue: true
    },
    force_gh_pages_build: {
        help: `Force the gh-pages target to run even if not on the
main branch`,
        type: Boolean,
        action: 'storeTrue',
        defaultValue: false
    },
    unsafe_deployment: {
        help: `Allows deploying from an unclean branch`,
        type: Boolean,
        action: 'storeTrue',
        defaultValue: false
    }

};

/**
 * The options that the user has actually set. The value here is meant
 * to be set by the main gulpfile.
 */
export var options = {};

/**
 * Values internal to the gulp scripts. These are not settable through
 * a local configuration file or through command line options.
 */
export const internals = {
    log4javascript_url:
    "https://downloads.sourceforge.net/project/log4javascript/" +
        "1.4.13/log4javascript-1.4.13.zip",
    stamp_dir: "build/stamps"
};
