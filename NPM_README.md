This is the readme file for the npm package. It covers only
information specific to the npm package. Wed's *real* README is
visible in the
[git repository](https://github.com/mangalam-research/wed). It also
has
[extensive documentation](http://mangalam-research.github.io/wed/).

This npm package does not allow you to do ``require('wed')`` in your
application. Wed is designed to run in browsers, not in Node. So why
this package?

* It provides a convenient way to distribute the built wed tree.

* The tool ``wed-metadata`` *does* run in Node. Some
  projects using wed might need to use it. This package provides a way
  to install the tool.

This package contains the following:

* ``bin/wed-metadata``: the tool mentioned above.

* ``standalone``: a standalone build of wed. This build contains
  **everything** needed to load wed, including third-party libraries.

* ``standalone-optimized``: an optimized version of the previous build.

<!--  LocalWords:  readme npm tei json
 -->
