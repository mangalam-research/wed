Introduction
============

Wed is a schema-aware editor for XML documents. It runs in a web
browser. It is alpha software. I aim to make it extensible but the API
is likely to change quickly. If you try it, do not be surprised if it
throws a rod and leaks oil everwhere.

Current known limitations:

* There is no `html-to-xml.xsl` conversion at this time. Creating one
  should be trivial but I'm concentrating my efforts on other aspects.

* Wed currently only understand a subset of RelaxNG (through the salve
package).

Dependencies
============

Wed is packaged as a RequireJS module. So to use it in a browser
environment, you need to first load RequireJS and pass to it a
configuration that will allow it to find wed's code. An example of
such configuration, which allows running the browser-dependent test
suite, is located in `config/requirejs-config-dev.js`

In all cases Wed requires the following packages:

* jquery
* bootstap
* salve

Loading wed in a Node.js environment requires installing the
following node package:

* node-amd-loader

Running wed's tests **additionally** requires the following node
packages:

* mocha
* chai

Please see the package.json file for details regarding these
dependencies.

Building
========

For now, wed uses a makefile to build itself. Run::

    $ make

This makefile will download external packages (like jquery and
bootstrap) and place them in `downloads`. It will then create an tree
of files that could be served by a web server. The files will be in
`build/standalone`. As the name "standalone" implies this build
includes **everything** needed to run wed, except the configuration
for requirejs. This configuration is dependent on how the server
serves the files so it is up to you to create one. The file
`config/requirejs-config-dev.js` contains an example.

Eventually additional builds will be implemented for minified
versions, barebones versions (containing only wed's files and assuming
the other packages (jquery, bootstrap, salve, etc.) are provided by
the server through other means), etc.

Testing
=======

Javascript
----------

Javascript tests are of two types:

* Runnable outside a browser. We run these inside Node.js.

* Runnable inside a browser.

Some tests can be run both inside and outside a browser. This typically happens when a mock DOM setup is used in Node.js

To run the tests that are not browser-dependent::

    $ mocha 

The mocha tests are located in `test`.

To run the tests that are browser-dependent, load `test.html` into a browser. The browser-dependent tests are located in `browswer_test`.

Using
=====

Wed expects the XML files it uses to have been converted from XML to
an ad-hoc HTML version. So the data passed to it must have been
converted by `lib/wed/xml-to-html.xsl` Various schemas and projects
will have different needs regarding whitespace handling, so it is
likely you'll want to create your own `xml-to-html.xsl` file will
import `lib/wed/xml-to-html.xsl` but customize whitespace handling.

To include wed in a web page you must:

* Require `lib/wed/wed.js`

* Call the `editor()` function of that module as follows::
    wed.editor(widget, options);

  The `widget` parameter must be an element (preferably a `div`) which
  contains the entire data structure to edit (converted by
  `xml-to-html.xsl` or a customization of it). The `options` parameter
  is an dictionary which at present understands the following keys:

  + `schema`: the path to the schema to use for interpreting the
    document. This file must contain the result of doing the schema
    conversion required by `salve` since wed uses `salve`. See
    `salve`'s documentation.

  If `options` is absent, wed will attempt getting its configuration
  from requirejs by calling `module.config()`. See the requirejs
  documentation.
