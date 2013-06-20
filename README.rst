Introduction
============

Wed is a schema-aware editor for XML documents. It runs in a web
browser. It is alpha software. I aim to make it extensible but the API
is likely to change quickly for now. If you try it, do not be
surprised if it throws a rod and leaks oil on your carpet.

Current known limitations:

* There is no ``html-to-xml.xsl`` conversion at this time. Creating
  one should be trivial but I'm concentrating my efforts on other
  aspects of the software.

* Wed currently only understand a subset of RelaxNG (through the
  `salve <https://github.com/mangalam-research/salve/>`_ package).

Dependencies
============

Wed is packaged as a RequireJS module. So to use it in a browser
environment, you need to first load RequireJS and pass to it a
configuration that will allow it to find wed's code. An example of
such configuration, which allows running the browser-dependent test
suite, is located in `<config/requirejs-config-dev.js>`_

In all cases Wed requires the following packages:

* jquery
* bootstrap
* `salve <https://github.com/mangalam-research/salve/>`_
* rangy

Loading wed in a Node.js environment requires installing the
following node package:

* node-amd-loader

Running wed's tests **additionally** requires the following node
packages:

* mocha
* chai
* semver-sync

Please see the `<package.json>`_, `<config/requirejs-config-dev.js>`_
and `<Makefile>`_ files for details regarding these
dependencies. Running the test suite additionally requires that `saxon
<http://saxon.sourceforge.net/>`_ be installed.

Building
========

For now, wed uses a Makefile to build itself. Run::

    $ make

This Makefile will download external packages (like jquery and
bootstrap) and place them in `<downloads>`_. It will then create an
tree of files that could be served by a web server. The files will be
in `<build/standalone>`_. As the name "standalone" implies this build
includes **everything** needed to run wed on your own server, except
the configuration for RequireJS. This configuration is dependent on
how the server serves the files so it is up to you to create one. The
file `<config/requirejs-config-dev.js>`_ contains an example of a
configuration. This file is actually the one use when you use the
files in the `<web>`_ subdirectory.

Eventually additional builds will be implemented for minified
versions, barebones versions (containing only wed's files and assuming
the other packages (jquery, bootstrap, salve, etc.) are provided by
the server through other means), etc.

Testing
=======

Note that due to the asynchronous nature the JavaScript environments
used to run the tests, if the test suites are run on a system
experiencing heavy load or if the OS has to swap a lot of memory from
the hard disk, they may fail some or all tests. I've witnessed this
happen, for instance, due to RequireJS timing out on a ``require()``
call because the OS was busy loading things into memory from
swap. I've also seen individual test cases fail for similar
reasons. The solution is to run the test suites again.

Tests are of two types:

* Runnable outside a browser. We run these inside Node.js.

* Runnable inside a browser.

To run the tests that are not browser-dependent do::

    $ make test

These tests are located in `<test>`_. You can also run ``mocha``
directly form the command line but having ``make`` build the ``test``
target will trigger a build to ensure that the tests are run against
the latest code.

.. warning:: Keep in mind that tests are **always** run against the
             code present in `<build/standalone>`_. If you modify your
             source and fail to rebuild before running the test suite,
             the suite will run against **old code!**

To run the tests that are browser-dependent, you must run a basic web
server which has its web site root set to the root of the source
tree. Any web server that can do this will work. If you do not have
one handy, you can borrow Ace's `static.js
<https://raw.github.com/ajaxorg/ace/master/static.js>`_::

    $ node static.js

Or Ace's `static.py
<https://raw.github.com/ajaxorg/ace/master/static.py>`_::

    $ python static.py

In either case, the server will serve on localhost:8888 by
default. Point your browser to
`<http://localhost:8888/web/test.html>`_ to run the test suite. The
browser-dependent tests are located in `<browser_test>`_.

If you change wed's code and want to run the browser-dependent test
suite again, make sure to run ``make test`` before you run the suite
again because otherwise the suite will run against the old code.

Demo
====

The demo is located in `<web/kitchen-sink.html>`_. (Yes, this name is
inspired from Ace.) To run it, you must have a minimal server running
just like the one needed to run the browser-dependent test suit and
then point your browser to
`<http://localhost:8888/web/kitchen-sink.html>`_ if you use the
suggested servers or to whatever address is proper if you roll a
server using a different port or address. The demo currently starts
with an empty document using a vanilla TEI schema. Things you can do:

* Use the left mouse button to bring up a context menu. Such menu
  exists for starting tags and all positions that are editable. This
  menu allows inserting elements.

* Insert text where text is valid.

* Ctrl-Z to undo.

* Ctrl-Y to redo.

Using
=====

Wed expects the XML files it uses to have been converted from XML to
an ad-hoc HTML version. So the data passed to it must have been
converted by `<lib/wed/xml-to-html.xsl>`_ Various schemas and projects
will have different needs regarding whitespace handling, so it is
likely you'll want to create your own ``xml-to-html.xsl`` file will
import `<lib/wed/xml-to-html.xsl>`_ but customize whitespace handling.

To include wed in a web page you must:

* Require `<lib/wed/wed.js>`_

* Call the ``editor()`` function of that module as follows::

    wed.editor(widget, options);

  The ``widget`` parameter must be an element (preferably a ``div``) which
  contains the entire data structure to edit (converted by
  ``xml-to-html.xsl`` or a customization of it). The ``options`` parameter
  is an dictionary which at present understands the following keys:

  + ``schema``: the path to the schema to use for interpreting the
    document. This file must contain the result of doing the schema
    conversion required by ``salve`` since wed uses ``salve``. See
    ``salve``'s documentation.

  + ``mode``: a path to the mode to use. Wed comes bundled with a
    generic mode located at `<lib/wed/modes/generic/generic.js>`_.

  If ``options`` is absent, wed will attempt getting its configuration
  from RequireJS by calling ``module.config()``. See the RequireJS
  documentation. The ``wed/wed`` configuration in
  `<config/requirejs-config-dev.js>`_ gives an example of how this can
  be used.

License
=======

Wed is released under the Mozilla Public License version
2.0. Copyright Mangalam Research Center for Buddhist Languages,
Berkeley, CA.

Credits
=======

Wed is designed and developed by Louis-Dominique Dubeau, Director of
Software Development for the Buddhist Translators Workbench project,
Mangalam Research Center for Buddhist Languages.

.. image:: https://secure.gravatar.com/avatar/7fc4e7a64d9f789a90057e7737e39b2a
   :target: http://www.mangalamresearch.org/

This software has been made possible in part by a Level I Digital
Humanities Start-up Grant from the National Endowment for the
Humanities (grant number HD-51383-11). Any views, findings,
conclusions, or recommendations expressed in this software, do not
necessarily represent those of the National Endowment for the
Humanities.

.. image:: http://www.neh.gov/files/neh_logo_horizontal_rgb.jpg
   :target: http://www.neh.gov/

..  LocalWords:  API html xml xsl wed's config jquery js chai semver
..  LocalWords:  json minified localhost
