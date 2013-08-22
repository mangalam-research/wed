Release History
===============

This section covers only salient changes:

* 0.8:

  - API: Specifying a mode path can now be done in an abbreviated
    fashion for modes bundled with wed.

  - Internal: Now uses Bootstrap 3.0.0.

  - API: ``Decorator`` now takes the domlistener that listens
    to GUI changes, the editor, and the TreeUpdater that updates the
    GUI tree.  Consequently ``mode.makeDecorator`` takes at the very
    least the same arguments. (It could require more if the mode
    requires it.)

  - API: modal callbacks are no longer called as ``callback(ev,
    jQthis)`` but as ``callback(ev)``.

  - API: ``modal.getContextualActions`` takes two additional
    parameters to tell the mode where the editor is interested in
    getting actions.

* 0.7:

  - Wed gained saving and recovery capabilities.

  - Wed gained capabilities for logging information to a server
    through Ajax calls.

* 0.6:

  - Internal: wed no longer works with Twitter Bootstrap version 2 and
    now requires version 3 RC1 or later. This version of Bootstrap
    fixes some problems that recently turned out to present
    significant hurdles in wed's development. Unfortunately, version
    3's API is **very** different from version 2's so it is not
    possible to trivially support both versions.

  - GUI: Wed no longer uses glyphicons. Upon reviewing the glyphicons
    license, I noticed a requirement that all pages which use
    glyphicons contain some advertisement for glyphicons. I'm not
    going to require that those who use wed **pollute their web
    pages** with such advertisement.

  - GUI: Wed now uses Font Awesome.

  - API: ``Mode.getTransformationRegistry()`` is gone. Wed now
    gets a mode's actions by calling
    ``getContextualActions(...)``.

  - API: ``fireTransformation`` no longer accepts a
    new_caret_position.

  - API: transformations are now a special case of actions.

* 0.5 introduces major changes:

  - GUI: previous versions of wed had included some placeholders
    between XML elements so that insertion of new elements would be
    done by putting the caret into the placeholder and selecting the
    contextual menu. These placeholders proved unwieldy. Version 0.5
    removes these placeholders to instead have the contextual menu on
    starting and ending tags of elements serve respectively to add
    elements before and after an element.

  - Internal: wed now uses ``less`` to generate CSS.

  - Internal: wed now maintains two DOM trees representing the
    document. The first is a representation of the document's XML
    data. The second is an HTML-decorated representation of this same
    data for display purposes.

* 0.4 introduces major API changes:

  - Whereas the ``mode`` option used to be a simple path to the mode
    to load, it is now a simple object that must have the field
    ``name`` set to what ``mode`` used to be. See the `Using`_
    section.

  - Creating and initializing a wed instance has changed
    considerably. Instead of calling ``wed.editor()`` with appropriate
    parameters, the user must first issue ``new wed.Editor()`` without
    parameters and then call the ``init()`` method with the parameters
    that were originally passed to the ``editor()`` function. See the
    `Using`_ section for the new way to create an editor.

Introduction
============

Wed is a schema-aware editor for XML documents. It runs in a web
browser. It is alpha software. I aim to make it extensible but the API
is likely to change quickly for now. If you try it, do not be
surprised if it throws a rod and leaks oil on your carpet.

Current known limitations:

* Wed currently only understand a subset of RelaxNG (through the
  `salve <https://github.com/mangalam-research/salve/>`_ package).

* Eventually the plan is for having complete handling of XML namespace
  changes, and there is incipient code to deal with this but for now
  the safe thing to do if you have a file using multiple namespaces is
  to declare them once and for all on the top element, and never
  change them throughout the document. Otherwise, problems are likely.

* We've not tested a setup in which more than one wed instance appears
  on the same page.

* Keyboard navigation in contextual menus works. However, if the mouse
  is hovering over menu items two items will be highlighted at once,
  which may be confusing. This seems to be a limitation of CSS which
  Bootstrap does nothing to deal with. (One element may be in the
  focused state (keyboard) while another is in the hover state.)

* See also `Browser Requirements`_.

Known bugs:

* Firefox: Sometimes a caret moved to the end of a bit of text
  disappears. There does not seem to be any rhyme or reason for it. It
  is probably a Firefox bug. At any rate, wed does not currently
  compensate for it. So you may see your caret disappear, but it is
  still there, waiting for you to type text.

Browser Requirements
====================

While potential users of wed should definitely heed the warnings
below, plans are afoot to use Sauce Labs' `Open Sauce
<https://saucelabs.com/opensauce>`_ to improve support for platforms
other than PC-based Chrome and Firefox. Stay tuned.

Wed is primarily developed using a recent version of Chrome
(version 28) and a recent version of Firefox (version 22) for
testing. Ideally wed should work with recent versions of other
browsers but since it is not routinely tested with those browsers
there may be bugs specific to running wed in those browsers. File an
issue in github if you find a problem with IE 9 or higher or a
relatively recent other kind of desktop browser or (obviously) with
the browsers used for testing wed. In order of decreasing likelihood,
support for the following cases is unlikely to ever materialize due to
a lack of development resources:

* Browsers for phones and tablets.
* Versions of Chrome and Firefox older than those mentioned above.
* Antique browsers.
* Oddball browsers or other software or hardware systems that present
  web pages.

Wed does not require any specific OS facilities. However, keyboard
support on Macs in JavaScript has some peculiarities. Unfortunately,
since this project has not so far benefited from access to a Mac for
testing, users of Mac-based browsers may experience issues that do not
exist on other platforms. File an issue in github if you find a
problem with a relatively recent Mac-based browser.

Dependencies
============

Wed is packaged as a RequireJS module. So to use it in a browser
environment, you need to first load RequireJS and pass to it a
configuration that will allow it to find wed's code. An example of
such configuration, which allows running the browser-dependent test
suite, is located in `<config/requirejs-config-dev.js>`_

In all cases Wed requires the following packages:

* jquery
* Bootstrap version 3.0.0 or a later version in the version 3 series.
* `salve <https://github.com/mangalam-research/salve/>`_
* rangy

Loading wed in a Node.js environment requires installing the
following node package:

* node-amd-loader

Building wed **additionally** requires the following node packages:

* less

Since wed is not yet distributed in a pre-compiled form, you
effectively need these packages installed if you want to use wed
because you have to build it first.

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
Bootstrap) and place them in `<downloads>`_. It will then create an
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
the other packages (jquery, Bootstrap, salve, etc.) are provided by
the server through other means), etc.

Testing
=======

Note that due to the asynchronous nature the JavaScript environments
used to run the tests, if the test suites are run on a system
experiencing heavy load or if the OS has to swap a lot of memory from
the hard disk, they may fail some or all tests. I've witnessed this
happen, for instance, due to RequireJS timing out on a ``require()``
call because the OS was busy loading things into memory from
swap. The solution is to run the test suites again.

Tests are of two types:

* Not browser-dependent and therefore runnable outside a browser. We
  run these in Node.js.

* Browser-dependent and therefore requiring a browser.

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

To run the tests that are browser-dependent, you must run
`<server.js>`_, a basic web server which has its web site root set to
the root of the source tree::

    $ ./server.js

The server will serve on localhost:8888 by default. Give it an
``addr:port`` parameter if you want another address and port. Point
your browser to `<http://localhost:8888/web/test.html>`_ to run the
test suite. The browser-dependent tests are located in
`<browser_test>`_.

Some tests require **this** specific server or a server that provides
the same responses to Ajax requests.

If you change wed's code and want to run the browser-dependent test
suite again, make sure to run ``make test`` before you run the suite
again because otherwise the suite will run against the old code.

.. warning:: Some of the browser-dependent tests may fail on browsers
             other than Chrome. Eventually, wed will work the same on
             all browsers but at the moment development efforts are
             spent elsewhere than hunting down differences in browser
             behavior. For instance, as of 2013/07/19 some of the
             caret movement tests fail on Firefox. This does not
             prevent using wed on Firefox.

.. warning:: As part of normal development, wed is tested on Chrome
             first, Firefox second, but no other browsers.

Demo
====

The demo is located in `<web/kitchen-sink.html>`_. To run it, you must
have a minimal server running just like the one needed to run the
browser-dependent test suit and then point your browser to
`<http://localhost:8888/web/kitchen-sink.html>`_ if you use the
suggested servers or to whatever address is proper if you roll a
server using a different port or address. The demo currently starts
with an empty document using a vanilla TEI schema. Things you can do:

* Use the left mouse button to bring up a context menu. Such menu
  exists for starting tags and all positions that are editable. This
  menu allows inserting elements. Ctrl-/ also brings up this menu.

* Insert text where text is valid.

* Ctrl-Z to undo.

* Ctrl-Y to redo.

* Ctrl-C to copy.

* Ctrl-V to paste.

* Ctrl-X to cut.

* Ctrl-S to save. The data is currently dumped into a file located at
  build/ajax/save.txt, and you won't be able to reload it. For full
  functionality wed needs to be used with a server able to save the
  data and serve it intelligently.

* Ctrl-. to go into development mode. This will bring up a log window
  and allow the use of F2 to dump the element to the console.

Using
=====

Wed expects the XML files it uses to have been converted from XML to
an ad-hoc HTML version. So the data passed to it must have been
converted by `<lib/wed/xml-to-html.xsl>`_ Various schemas and projects
will have different needs regarding white space handling, so it is
likely you'll want to create your own ``xml-to-html.xsl`` file will
import `<lib/wed/xml-to-html.xsl>`_ but customize white space handling.

To include wed in a web page you must:

* Require `<lib/wed/wed.js>`_

* Instantiate an ``Editor`` object of that module as follows::

    var editor = new wed.Editor();
    [...]
    editor.init(widget, options);

  Between the creation of the ``Editor`` object and the call to
  ``init``, there conceivably could be some calls to add event
  handlers or condition handlers. The ``widget`` parameter must be an
  element (preferably a ``div``) which contains the entire data
  structure to edit (converted by ``xml-to-html.xsl`` or a
  customization of it). The ``options`` parameter is an dictionary
  which at present understands the following keys:

  + ``schema``: the path to the schema to use for interpreting the
    document. This file must contain the result of doing the schema
    conversion required by ``salve`` since wed uses ``salve``. See
    ``salve``'s documentation.

  + ``mode``: a simple object recording mode parameters. This object
    must have a ``path`` field set to the RequireJS path of the
    mode. An optional ``options`` field may contain options to be
    passed to the mode. Wed comes bundled with a generic mode located
    at `<lib/wed/modes/generic/generic.js>`_.

    The ``path`` field may be abbreviated. For instance if wed is
    given the path ``"foo"``, it will try to load the module
    ``foo``. If this fails, it will try to load ``modes/foo/foo``.  If
    this fails, it will try to load ``modes/foo/foo_mode``. These
    paths are all relative to the wed directory.

  If ``options`` is absent, wed will attempt getting its configuration
  from RequireJS by calling ``module.config()``. See the RequireJS
  documentation. The ``wed/wed`` configuration in
  `<config/requirejs-config-dev.js>`_ gives an example of how this can
  be used.

Here is an example of an ``options`` object::

    {
         schema: 'test/tei-simplified-rng.js',
         mode: {
             path: 'wed/modes/generic/generic',
             options: {
                 meta: 'test/tei-meta'
             }
         }
    }

The ``mode.options`` will be passed to the generic mode when it is
created. What options are accepted and what they mean is determined by
each mode.

The `<lib/wed/onerror.js>`_ module installs a global onerror
handler. By default it calls whatever onerror handler already existed
at the time of installation. Sometimes this is not the desired
behavior (for instance when testing with ``mocha``). In such cases the
``suppress_old_onerror`` option set to a true value will prevent the
module from calling the old onerror.

.. warning:: Wed installs its own handler so that if any error occurs
             it knows about it, attempts to save the data and forces
             the user to reload. The unfortunate upshot of this is
             that any other JavaScript executing on a page where wed
             is running could trip wed's onerror handler and cause wed
             to think it crashed. The upshot is that you must not run
             wed with JavaScript code that causes onerror to fire.

Round-Tripping
==============

The transformations performed by `<lib/wed/xml-to-html.xsl>`_ and
`<lib/wed/html-to-xml.xsl>`_ are not byte-for-byte reverse
operations. Suppose document A is converted from xml to html, remains
unmodified, and is converted back and saved as B, B will **mean** the
same thing as A but will not necessarily be **identical** to A. Here are
the salient points:

* Comments, CDATA, and processing instructions are lost.

* The order of attributes could change.

* The order and location of namespaces could change.

* The encoding of empty elements could change. That is, <foo/> could
  become <foo></foo> or vice-versa.

* The presence or absence of newline on the last line may not be
  preserved.

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
..  LocalWords:  json minified localhost CSS init pre Makefile saxon
..  LocalWords:  barebones py TEI Ctrl hoc schemas CDATA HD glyphicon
..  LocalWords:  getTransformationRegistry getContextualActions addr
..  LocalWords:  fireTransformation glyphicons github tei onerror
