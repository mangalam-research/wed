===========================
Using Wed in an Application
===========================

Wed is a schema-aware editor for XML documents. It runs in a web
browser. The software is at the beta stage. It is being used in a
project for editing scholarly articles. We aim to make it extensible
by means of a stable API, but the API is likely to change quickly for
now.

Known limitations:

* Wed currently does understand a large subset of Relax NG, but some
  constructs are not supported. See the `salve
  <https://github.com/mangalam-research/salve/>`_ package for details.

* Wed currently does not support schemas that allow multiple choices
  at the root (e.g. TEI vs teiCorpus). These schemas must be
  customized to allow only one top level element.

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

* Elements that *cannot* contain anything appear in the editor as if
  they *could*. The validator raises an error if these elements are
  filled with any contents but it would be nicer if they were
  displayed in a way that distinguished them from the elements that
  *can* be filled with contents. We worked on a prototype that would
  check whether an element *can* contain anything and display it
  differently if it could not. However, this required that the
  rendering engine query the validating engine during rendering, which
  made rendering extremely slow. Since the editor will raise an error
  if an element that should be empty is filled erroneously, we've
  decided that a solution to this problem can wait.

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

  Wed will get a configuration from RequireJS ``module.config()`` and
  will **merge** it with the ``options`` parameter using jQuery's
  ``$.extend``. So if a key appears both in the ``module.config()``
  object and in the ``options`` object, the latter value will override
  the former. **Note that it is not possible to undefine a value set
  in ``module.config()``** because ``$.extend`` ignores undefined
  values. One way around this problem is to specify
  ``ignore_module_config`` in the ``options`` object. See the
  RequireJS documentation. The ``wed/wed`` configuration in
  :github:`config/requirejs-config-dev.js` gives an example of how
  this can be used.

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

* Comments, CDATA, and processing instructions are not preserved.

* The order of the attributes could differ.

* The order and location of namespaces declarations could differ.

* The encoding of empty elements could differ. That is, ``<foo></foo>``
  could become ``<foo/>`` or vice-versa.

* The presence or absence of a newline on the last line may not be
  preserved.

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
..  LocalWords:  localhost
