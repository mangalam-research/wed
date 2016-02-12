===========================
Using Wed in an Application
===========================

Wed is a schema-aware editor for XML documents. It runs in a web
browser. The software is at the beta stage. It is currently used in a
project for editing scholarly articles. We aim to make it extensible
by means of a stable API, but the API is likely to change quickly for
now.

Known limitations:

* Wed does not load documents containing XML comments (``<!--
  ... -->``) or CDATA sections.

* Wed does not load documents that include processing instructions
  other than the ``<?xml ...>`` declaration at the very top of
  documents. (Some hold that the XML declaration is not a processing
  instruction. The distinction is irrelevant to the point being made
  here.)

* Wed supports most of Relax NG, with a few limitations. See the
  `salve <https://github.com/mangalam-research/salve/>`_ package for
  details.

* Wed currently does not support schemas that allow multiple choices
  at the root of a document (e.g. a typical TEI schema will allow
  documents to start either with ``TEI`` or ``teiCorpus``). These
  schemas must be customized to allow only one top level
  element. Taking TEI again as example, the schema would have to be
  customized to allow only one of ``TEI`` or ``teiCorpus`` at the top.

* Wed does not currently support ordering attributes according to some
  preference. (The order is whatever the DOM implementation does by
  default.)

* Wed does not currently support multiline values in attributes.

* Empty elements appear in the editor as if they had an opening and
  closing tag, irrespective of how they are encoded in the original
  document. So ``<foo/>`` and ``<foo></foo>`` are treated the
  same. Part of this problem is due to the fact that wed sees the
  document as a DOM tree, not as a serialization. In a DOM tree,
  ``<foo/>`` and ``<foo></foo>`` are the same.

* Elements that *must be empty* appear in the editor as if they
  *could* contain contents. Note that the validator raises an error if
  these elements are filled with any contents but it would be nicer if
  they were displayed in a way that distinguished them from the
  elements that *can* be filled with contents. We worked on a
  prototype that would check whether an element *can* contain anything
  and display it differently if it could not. However, this required
  that the rendering engine query the validating engine during
  rendering, which made rendering extremely slow. Since the editor
  will raise an error if an element that should be empty is filled
  erroneously, we've decided that a solution to this problem can wait.

* Eventually the plan is to handle XML namespace changes completely,
  and there is incipient code to deal with this; for now the safe
  thing to do if you have a file using multiple namespaces is to
  declare them once and for all on the top element, and never change
  them throughout the document. Otherwise, problems are likely.

  [A significant issue here is that the various browsers do not handle
  namespaces in the same way. For instance FF and Chrome are
  absolutely fine if you specify ``xmlns`` with DOM's ``setAttribute`` on
  an element that is on the same namespace as the namespace specified
  with the new ``xmlns`` attribute and they will produce a correct
  serialization. IE, on the other hand, will produce a node with two
  ``xmlns`` attributes.]

* We've not tested a setup in which more than one wed instance appears
  on the same page.

* Keyboard navigation in contextual menus works. However, if the mouse
  is hovering over menu items, two items will be highlighted at once,
  which may be confusing. This seems to be a limitation of CSS which
  Bootstrap does nothing to deal with. (One element may be in the
  focused state (keyboard) while another is in the hover state.)

* Wed does not work with RTL scripts. There no inherent reason wed
  could not support them but the project for which it is developed
  currently does not need support for RTL scripts. So no resources
  have been expended towards supporting this.

* Wed is not internationalized. Although the contents of a document
  could be in any language, wed's UI is in English. Again, there is no
  inherent reason wed could not support other languages for the
  UI. The project for which it is developed currently does not need
  support for other languages, hence this state of affairs.

* See also :ref:`help_browser_requirements`.

* See also `Round-Tripping`_, as some limitations there may affect
  whether you can use wed for your project.

Dependencies
============

Wed is packaged as a RequireJS module. To use it in a browser
environment, you need to first load RequireJS and pass to it a
configuration that will allow it to find wed's code. An example of
such configuration, which allows running the browser-dependent test
suite, is located in :github:`config/requirejs-config-dev.js`.

.. warning:: If you want to change this configuration for
             experimentation or to match your local setup, please copy
             it to the ``local_config`` directory and edit it
             *there*. This directory is not tracked by git. This is
             true of all files that are stored in :github:`config/`.

Please see the :github:`package.json`,
:github:`config/requirejs-config-dev.js`, :github:`Makefile` and
:github:`build.mk` files for details regarding run-time and
development dependencies. Running the test suite also requires that
`saxon <http://saxon.sourceforge.net/>`_ be installed.

Building wed's documentation **additionally** requires the following
packages:

* jsdoc3
* rst2html
* perl (a stop-gap measure which we plan to get rid of eventually)

Running wed's selenium-based tests **additionally** requires the
following:

* Python 2.7.
* Python's Selenium package.
* `selenic <http://github.com/mangalam-research/selenic>`_
* behave (the python package)

If you want to contribute to wed, your code will have to pass the
checks listed in :github:`.glerbl/repo_conf.py`. So you either have to
install glerbl to get those checks done for you or run the checks
through other means. See Contributing_.

Building
========

Everything generated during a build is output to the ``build/``
subdirectory, except for some documentation files like
``README.html`` and ``CHANGELOG.html``, which are in the root
directory.

Wed uses gulp to build itself. You may want to create a
``gulp.local.js`` file to record settings specific to your own build
environment. Run ``gulp --help`` to see what variables you can
set. Note that the variable names when use on the command line have
dashes where they would have underscore in ``gulp.local.js``. For
instance, on the command line you'd use ``--jsdoc3-default-template``
to set the path to the jsdoc3 default template but in
``gulp.local.js`` it would be ``jsdoc3_default_template``. Also note
that your ``gulp.local.js`` file should return a single anonymous
object whose fields are the values you want to set. For instance::

  module.export = {
      jsdoc3_default_template: "foo"
  };

When everything is set, install gulp locally (``npm install gulp``)
and run::

    $ gulp

Gulp will install locally some packages with ``npm`` and download some
external packages that cannot be installed with ``npm`` for whatever
reason and place them in ``downloads/``. It will then create a tree of
files that could be served by a web server. The files will be in
``build/standalone/``. As the name "standalone" implies, this build
includes **everything** needed to run wed on your own server, except
the configuration for RequireJS.

Gulp will additionally create an optimized version of wed in
``build/standalone-optimized/``. This is a version that has been
optimized using RequireJS's ``r.js`` optimizer. This optimization
exists for illustration purposes and for testing wed. See the
:ref:`tech_notes_deployment_considerations` section in
:doc:`tech_notes` to determine whether this is the optimization you
want to use to deploy wed.

Testing
=======

See :doc:`tech_notes`.

Local Demos
===========

The demos, you must have a minimal server running just like the one
needed to run the browser-dependent test suite (see the
:ref:`tech_notes_in_browser_tests` section in :doc:`tech_notes`). To
run a server suitable for the demos, you should do::

    $ ./server.js server localhost:8888 &

The address and port ``localhost:8888`` is just a suggestion, but the
link in the documentation below assume that's the address used.

Demo Saving to Local Storage
----------------------------

The demo that uses your own browser's local storage is ready to use
once wed is built. Once the server is started, point your browser to
`<http://localhost:8888/build/standalone/files.html>`_ or
`<http://localhost:8888/build/standalone-optimized/files.html>`_. The
2nd link is to the optimized application.

Demos Saving to a Server
------------------------

Once the server is started, point your browser to either:

* `<http://localhost:8888/build/standalone/kitchen-sink.html>`_ to
  view the demo with the unoptimized file tree.

* or
  `<http://localhost:8888/build/standalone-optimized/kitchen-sink.html>`_
  to view the demo with an optimized file tree.

The demo currently starts with an empty document using a vanilla TEI
schema. See :doc:`help` to learn what wed can do, in general.

When you save with this demo, the data is currently dumped into a file
located at ``build/ajax/save.txt``. You won't be able to reload data
from that file. For full functionality wed needs to be used with a
server able to save the data and serve it intelligently.

:kbd:`Ctrl-\`` allows to go into development mode. Since this is meant
only for developers, you should read the source code of wed to know
what this allows.  (In particular, search for
``this._development_mode`` in the ``_globalKeydownHandler`` method.)

It is possible to run the kitchen sink with a different mode than the
default one (generic) by passing a ``mode`` parameter in the URL, for
instance the URL
`<http://localhost:8888/web/kitchen-sink.html?mode=tei>`_ would tell
the kitchen sink to load the tei mode.

.. _label_visibility:

Label Visibility
----------------

Wed allows the user to reduce or increase the number of element
labeled on the screen. How this works is dependent in part on the
specific mode that the user has selected. For instance, the default
mode that comes with wed (the "generic" mode) knows only two levels of
visibility: 0 and 1. At level 0, no elements are labeled. At level 1,
all elements are labeled. A mode with levels 0, 1, and 2 would label
all elements at level 2, no elements at level 0 and some elements at
level 1. Which elements are labeled depends on how the mode designer
designed the mode.

Using
=====

To include wed in a web page you must:

* Require :github:`lib/wed/wed.js`

* Instantiate an ``Editor`` object of that module as follows::

    var editor = new wed.Editor();
    [...]
    editor.init(widget, options, data);

  Between the creation of the ``Editor`` object and the call to
  ``init``, there conceivably could be some calls to add event
  handlers or condition handlers. The ``widget`` parameter must be an
  element (preferably a ``div``) that wed will take over to install
  its GUI. The ``options`` parameter is a dictionary which at present
  understands the following keys:

  + ``schema``: the path to the schema to use for interpreting the
    document. This file must contain the result of doing the schema
    conversion required by salve since wed uses salve. See
    salve's documentation.

  + ``mode``: a simple object recording mode parameters. This object
    must have a ``path`` field set to the RequireJS path of the
    mode. An optional ``options`` field may contain options to be
    passed to the mode. Wed comes bundled with a generic mode located
    at :github:`lib/wed/modes/generic/generic.js`.

    The ``path`` field may be abbreviated. For instance if wed is
    given the path ``"foo"``, it will try to load the module
    ``foo``. If this fails, it will try to load ``modes/foo/foo``.  If
    this fails, it will try to load ``modes/foo/foo_mode``. These
    paths are all relative to the ``wed/`` root directory.

  + ``ajaxlog``: See the documentation about :ref:`remote logging
    <remote_logging>`.

  + ``save``: See the documentation about :ref:`saving <saving>`.

  + ``ignore_module_config``: This tells wed to not try to get a
    configuration from RequireJS' ``module.config()``. This may be
    necessary to handle some configuration scenarios.

  The ``data`` parameter is a string containing the document to edit,
  in XML format.

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

The :github:`lib/wed/onerror.js` module installs a global onerror
handler. By default it calls whatever onerror handler already existed
at the time of installation. Sometimes this is not the desired
behavior (for instance when testing with mocha). In such cases the
``suppress_old_onerror`` option set to a true value will prevent the
module from calling the old onerror.

.. warning:: Wed installs its own handler so that if any error occurs
             it knows about it, attempts to save the data and forces
             the user to reload. The unfortunate upshot of this is
             that any other JavaScript executing on a page where wed
             is running could trip wed's onerror handler and cause wed
             to think it crashed. For this reason you must not run
             wed with JavaScript code that causes onerror to fire.

Round-Tripping
==============

At this stage wed does not guarantee that saving an **unmodified**
document will sent the exact same string as what it was originally
given to edit. This is due to the fact that the same document can be
represented in XML in multiple ways. Notably:

* The XML declaration is not preserved.

* The order of the attributes could differ.

* The order and location of namespaces declarations could differ.

* The encoding of empty elements could differ. That is, ``<foo></foo>``
  could become ``<foo/>`` or vice-versa.

* Whitespace before the start tag of the top element or after the end
  tag of the top element may not be preserved.

The Generic Mode
================

Wed is bundled with a single mode, the "generic" mode. We recommend to
developers who wish to create modes to use the generic mode as their
basis. Therefore, the explanations here should apply to those modes
that follow our recommendations.

The generic mode is a mode that provides almost no customization of
wed's capabilities. For instance, a custom mode could represent
elements that are paragraphs purely through indentation changes and
line breaks *rather than* start and end labels. (Such a mode does
exist for the BTW project.) The generic mode does not do this: it
represents paragraphs as any other element, with a start label and end
label.

Nonetheless, the generic mode requires a minimum amount of
customization in order to be able to do its work. In particular, it
needs to use a "meta" object that provides information on the schema
being used. This meta object is necessary because Relax NG schemas
often lack information that wed needs. For instance, while it is
possible to include documentation about the elements that are part of
a schema into a Relax NG schema, this is not the most convenient place
for it. For one thing, salve (which is what wed uses for validation)
right now does not save this information when it convert a Relax NG
schema to use for validation. Even if it did, it would not solve all
problems. The TEI documentation, for instance, is multilingual. Having
it all stored in the schema would increase its size considerably, even
if the user needs using only one language. It would be possible to
produce schemas that include documentation only in one language but
then you'd need one schema per language. By having the meta object be
responsible for providing this documentation, wed can load only the
language the user needs. Another issue that the meta object addresses
is the fact that Relax NG schemas do not specify what prefix to use
for namespaces. One of the jobs of the meta object is to provide
defaults for namespace prefixes. These are used internally by the
mode, rather than require mode developers to spell out namespace URIs
every time they need to refer to a namespace. The XML file being
edited can use whatever prefix desired, but the mode must have a
standardized mapping of prefix to URI. The meta object provides this.

The information provided by the meta object is not made part of the
mode itself because the meta information it provides may be orthogonal
to the concerns of the mode. The generic mode is a case in point: it
can work just as well (or as "generically") for editing TEI documents
as DocBook documents, or documents using any other schema. Or to take
another example, TEI allows for quite a bit of customization: elements
can be redefined, added, or removed. Entire modules can be added if a
project calls for it. A mode specialized for editing TEI documents
could have its meta object load only the documentation that pertains
to the specific customization of TEI being used.

Therefore, the generic mode takes a ``meta`` option which is a simple
object which itself takes two fields:

* ``path`` gives the path of the module that contains the meta object
  to use.

* ``options`` is a simple object which takes a single field named
  ``metadata``. This field is a path to metadata that will be loaded
  by the meta object. This is normally a JSON file. Note that this
  path is relative to the module given in ``path`` above.

Why have a meta object and a metadata file? Some tools used to manage
and produce XML schemas are able to fairly easily generate information
about the schemas they manage. One example are the tools provided by
the TEI consortium. It is possible from an ODD file to generate a
Relax NG schema, and extract the documentation for each element in the
schema. Storing the resulting information into a JSON file is trivial,
and it is more convenient than the alternatives.

Here is an example of what the ``mode`` option passed to wed could contain::

    path: 'wed/modes/generic/generic',
    options: {
      meta: {
        path: 'wed/modes/generic/metas/tei_meta',
        options: {
          metadata:
            '../../../../../schemas/tei-math-metadata.json'
          }
        }
    }

This tells wed to load the generic mode, use the meta object exported
by ``wed/modes/generic/metas/tei_meta`` and have it load the metadata
file ``../../../../../schemas/tei-math-metadata.json``. (Again, this
last path is relative to the module that contains the meta object.)

The way the generic mode operates entails that three elements must
cooperate for a file to be usable by wed:

* the correct schema must be passed to wed,

* the correct mode must be selected,

* this mode must use a meta object that is customized for the schema
  being used. (Having the meta object load the correct metadata file
  is implied.)

Contributing
============

Contributions must pass the commit checks turned on in
:github:`.glerbl/repo_conf.py`. Use ``glerbl install`` to install the
hooks. Glerbl itself can be found at
`<https://github.com/lddubeau/glerbl>`_. It will eventually make its way to
the Python package repository so that ``pip install glerbl`` will
work.

..  LocalWords:  NG API namespace namespaces CSS RTL wed's UI github
..  LocalWords:  SauceLab's OpenSauce RequireJS config requirejs dev
..  LocalWords:  js jquery selectionsaverestore amd pre jsdoc rst mk
..  LocalWords:  perl chai semver json Makefile saxon selenic npm
..  LocalWords:  glerbl subdirectory README html CHANGELOG TEI Ctrl
..  LocalWords:  RequireJS's unoptimized ajax txt tei hoc xml xsl rng
..  LocalWords:  schemas init onerror CDATA versa LocalWords xmlns
..  LocalWords:  multiline DOM's setAttribute ESR Attr ownerElement
..  LocalWords:  globalKeydownHandler ajaxlog jQuery's teiCorpus
..  LocalWords:  localhost metadata
