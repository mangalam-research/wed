Advanced Usage Notes
====================

Build Information
-----------------

Every time a build is performed, the building process stores
information about the build into a file which at run time is available
as a module at the ``lib/wed/build-info`` location relative to the
root of the build directory. This module contains two fields:

* ``desc`` is a description of the build. This string is created by
  running ``git describe`` and adding to the result the string
  ``-unclean`` if the build was done with an unclean working tree.

* ``date`` is the date of the build. (To be precise, it is the date at
  which the build ``build-info`` module was generated.)

This information was added to wed as of version 0.11.0. If you happen
to use wed's development code that was produced after version 0.10.0
was released but before version 0.11.0 was released, then the version
number you'll get in the ``desc`` field will start with
"v0.10.0-x". The additional "-x" is a special case to work around a
bug in gitflow.

.. _tech_notes_deployment_considerations:

Deployment Considerations
-------------------------

.. warning:: As of version 0.10.0 there is a nasty bug in the
             optimized bundle. You may still experiment with the
             optimized version of wed if you want to do so, provided
             that you don't deploy it in production. The bug in
             question is documented `here
             <https://github.com/mangalam-research/wed/issues/8>`_.

It is possible to deploy wed using the ``build/standalone/`` file tree
but you will pay in execution time and bandwidth because the files in
this tree are not optimized.

The ``build/standalone-optimized/`` file tree is optimized. This
optimization exists primarily for illustration purposes and for
testing wed, but it could be used for deployment too, as long as you
understand how it is constructed. The build file driving how ``r.js``
created the optimized tree is ``requirejs.build.js``. Here are the
major characteristics of this optimization:

* All of wed's JavaScript is combined into one file. The only part of
  wed excluded is the test mode used in testing, which is not meant to
  be deployed anywhere.

* All external libraries (jQuery, Bootstrap, etc.) are excluded from
  the optimization.

* The CSS files are not optimized with regards to space but not combined.

This optimization is designed to provide a balance between performance
and flexibility. Greater performance could have been achieved by
incorporating into one file all of the external libraries. However,
such bundle would be unlikely to be trivially deployable on a
full-fledged web site in which wed would be embedded. Such site might
already be using jQuery and Bootstrap, perhaps different versions from
those used to build wed, etc. The optimization described above could
conceivably be used on this hypothetical server, provided that the
configuration is updated to look for the external libraries at the
right places.

Wed's build process creates a configuration for the optimized bundle
at ``build/standalone-optimized/requirejs-config.js``. This
configuration allows an external custom mode to load individual
modules of wed, because it has mappings like these::

    "wed/log": "wed/wed",
    "wed/oop": "wed/wed",
    "wed/lib/simple_event_emitter": "wed/wed",
    [...]

which map each individual module forming wed to the single bundle file
created during the optimization process. If you base your own run time
RequireJS configuration on this file, it is possible for code external
to the bundle, for instance a custom mode, to load parts of wed in an
arbitrary order.

It is also possible to use a configuration file that does not have the
individual module mappings. In this scenario, it is **not** possible
for code external to wed to load parts of wed in an arbitrary
order. The ``wed.js`` file has to be loaded first, and then wed's
modules become accessible. Note that this way of operating should work
for the vast majority of cases because the typical usage scenario for
wed is to first create a ``wed.Editor`` instance which dynamically
loads a mode. Since the mode is loaded after ``wed.Editor`` is
created, it is guaranteed that by the time the mode runs, all of wed's
modules are available.

Schema and Structure Considerations
-----------------------------------

The following discussion covers schema design considerations if you
wish to use wed to enforce editing constraints. It is possible to rely
instead on user discipline to enforce constraints, just like one would
do if using a plain text editor to edit XML. If this is your case,
then you do not need to concern yourself with the following.

If you want constraints to be enforced **by wed**, then prioritize
using a data structure that accurately reflects your **editing**
concerns rather than your interchange concerns or your standard
conformance concerns. Here's an example. Suppose that you use a schema
based on the TEI markup, and that for interchange purposes with
another system it makes sense to encode something like::

    <p><term><foreign xml:lang="fr">Étranger</foreign></term> is a foreign
    term.</p>

However, you do not want to allow your users to insert text inside the
``<term>`` element but outside ``<foreign>`` because that encoding is
meaningless in your project. Wed is not designed to easily enforce
this restriction. Wed will allow your users to create something
like::

    <p><term>The term <foreign xml:lang="fr">étranger</foreign>
    </term>is a foreign term.</p>

The solution here is to represent the
``<term><foreign></foreign></term>`` structure as one element, for
editing purposes. If it so happens that all instances of ``<foreign>``
are always to be interpreted as ``<term><foreign></foreign></term>``
for interchange purposes, then you might as well make your editing
structure ``<foreign>`` and convert it to the interchange structure
when you actually need to interchange. In other cases, you might want
to create your own element for editing, like ``<my:custom-element>``,
which is then created in the right context by the mode you create for
your project.

Remote Logging
--------------

Wed uses log4javascript to log anything worth logging. By default, wed
does not log anything to a remote server; however, if the ``ajaxlog``
option is passed to wed, it will add an ``AjaxAppender`` to the logger
and log messages using ``XmlLayout``. The ``ajaxlog`` option is of the
form::

  ajaxlog: {
      url: "...",
      headers: { ... }
  }

The ``url`` parameter is the URL where log4javascript will send the
log messages. The ``headers`` parameter specifies additional headers
to send. In particular this is useful when the receiver is an
installation requiring that some anti-CSRF token be set on HTTP
headers.

Saving
------

Wed saves documents using Ajax queries to a server. Where wed saves is
determined by the ``save`` option. It is of the form::

  save: {
      url: "...",
      headers: { ... ]
  }

The ``url`` parameter is the URL where wed will send the Ajax queries
for saving. The ``headers`` parameter is as described above for
logging.

Queries are sent as POST requests with the following parameters:

* ``command``: the command wed is issuing.

* ``version``: the version of wed issuing the command.

* ``data``: The data associated with the command. This is always a string
  serialization of the data tree.

The possible commands are:

* ``check``: This is a mere version check.

* ``save``: Sent when the user manually requests a save.

* ``recover``: Sent when wed detects a fatal condition requiring
  reloading the editor from scratch. The server must save the data
  received and note that it was a recovery.

The replies are sent as JSON-encoded data. Each reply is a single
object with a single field named ``messages`` which is a list of
messages. Each message has a ``type`` field which determines its
meaning and what other fields may be present in the message. The
possible message types are:

* ``version_too_old_error`` indicates that the version of wed trying to
  access the server is too old.

* ``save_transient_error`` indicates that the save operation cannot
  happen for some transient reason. The ``msg`` parameter on the
  message should give a user-friendly message indicating what
  the problem is and, to the extent possible, how to resolve it.

* ``save_fatal_error`` indicates that the save operation failed
  fatally. This is used for cases where the user cannot reasonably do
  anything to resolve the problem.

* ``locked_error`` indicates that the document the user wants to save
  is locked.

* ``save_successful`` indicates that the save was successful.

Creating a Mode
===============

We recommend creating new modes by inheriting from the generic
mode. The first thing you must do is set the metadata on the
``_wed_options`` object because wed will refuse to load your mode if
these are not set::

    this._wed_options.metadata = {
        name: "Foo",
        authors: ["Ty Coon"],
        description:
           "This mode does foo!",
        license: "MPL 2.0",
        copyright: "2013 Ty Coon Industries"
    };

Testing
=======

Note that due to the asynchronous nature of the JavaScript environments
used to run the tests, if the test suites are run on a system
experiencing heavy load or if the OS has to swap a lot of memory from
the hard disk, they may fail some or all tests. We've witnessed this
happen, for instance, due to RequireJS timing out on a ``require()``
call because the OS was busy loading things into memory from
swap. The solution is to run the test suites again.

Another issue with running the tests is that wed uses ``setTimeout``
to do the validation work in a parallel fashion. (This actually
simulates parallelism.) Now, browsers clamp timeouts to at most once a
second for tests that are in background tabs (i.e. tabs whose content
is not currently visible). Some tests want the first validation to be
finished before starting. The upshot is that if the test tab is pushed
to the background some tests will fail due to timeouts. The solution
for now is don't push the tab in which tests are run to the
background. Web workers would solve this problem but would create
other complications so it is unclear whether they are a viable
solution.

Tests are of three types:

* Not browser-dependent and therefore may be run outside a browser. We
  run these in Node.js.

* In-browser tests run *in* the browser.

* Selenium-based tests which run *outside* the browser but use selenium
  to control a browser.

Browser-Independent Tests
-------------------------

To run the tests that are not browser-dependent do::

    $ make test

These tests are located in the ``test/`` directory off the wed
root. You can also run ``mocha``
directly from the command line but having ``make`` build the ``test``
target will trigger a build to ensure that the tests are run against
the latest code.

.. warning:: Keep in mind that tests are **always** run against the
             code present in ``build/standalone/``. If you modify your
             source and fail to rebuild before running the test suite,
             the suite will run against **old code!**

.. _tech_notes_in_browser_tests:

In-Browser Tests
----------------

The browser-dependent tests are located in the ``browser_test/`` directory
off the wed root. To run
the tests that run in the browser, you must run ``server.js``, a
basic web server, from the root of the wed source::

    $ ./server.js

The server will serve on localhost:8888 by default. Give it an
``addr:port`` parameter if you want another address and port. Some
tests require **this** specific server or a server that provides the
same responses to Ajax requests. Point your browser to either:

* `<http://localhost:8888/build/standalone/test.html>`_ to run the
  tests with an unoptimized file tree.

* or `<http://localhost:8888/build/standalone-optimized/test.html>`_ to
  run the tests with an optimized file tree.

If you change wed's code and want to run the browser-dependent test
suite again, make sure to run ``make test`` before you run the suite
again because otherwise the suite will run against the old code.

Selenium-Based Tests
--------------------

Everything that follows is specific to wed. You need to have `selenic
<http://github.com/mangalam-research/selenic>`_ installed and
available on your ``PYTHONPATH``. Read its documentation. Then you
need to create a ``config/selenium_local_config.py`` file. Use one of
the example files provided with selenic. Add the following
variable to your ``local_config/selenium_local_config.py`` file::

    # Location of our server
    WED_SERVER = "http://localhost:8888/build/standalone/kitchen-sink.html"

Change ``standalone`` to ``standalone-optimized`` if you want to use
the optimized bundle.

You also need to have `wedutil
<http://github.com/mangalam-research/wedutil>`_ installed and
available on your ``PYTHONPATH``.

To run the Selenium-based tests, you can run either
``server.js`` *or* an nginx-based server. The latter option is
recommended if you run your browser on a provisioning service like
SauceLabs *and* you want to maximize performance. Running
``server.js`` has been explained above. To run nginx, just issue::

    $ misc/start_nginx

This will launch an nginx server listening on localhost:8888. It will
handle all the requests to static resources itself, but will forward
all Ajax stuff to an instance of ``server.js`` (which is started by
the ``start_nginx`` script to listen on localhost:9999). This server
puts all of the things that would go in ``/var/`` if it was started by
the OS in the ``var/`` directory that sits at the top of the code
tree. Look there for logs. This nginx instance uses the configuration
built at ``build/config/nginx.conf`` from
``config/nginx.conf``. Remember that if you want to override the
configuration, the proper way to do it is to copy the configuration
file into ``local_config/`` and edit it there. Run ``make`` again after
you have made modifications. The only processing done on nginx's file is to
replace instances of ``@PWD@`` with the top of the code tree.

Finally, to run the suite issue::

    $ make selenium-test

To run the suite while using the SauceLab servers, run::

    $ make SELENIUM_SAUCELABS=1 selenium-test

Behind the scenes, this will launch behave. See the makefile
:github:`build.mk` for information about how behave is run.

The environment variable ``BEHAVE_WAIT_BETWEEN_STEPS`` can be set to a
numerical value in seconds to get behave to stop between steps. It
makes the Selenium test unfold more slowly. The environment variable
``SELENIUM_QUIT`` can be set to ``never`` to prevent Selenium from
quitting the browser after the suite is run. It can be set to
``on-success`` so that the Selenium quits only if the suite is
successful.

Q. Why is Python required to run the Selenium-based tests? You've
   introduced a dependency on an additional language!

A. We've found that JavaScript is poorly supported by the various
   agents on which we depend for running Selenium the way we want. We've
   tried to avoid adding a dependency on Python to software which is
   JavaScript through and through, but that fight proved fruitless. Do
   we want to spend our time chasing bugs, badly documented code, and
   obscure or unsupported packages, or do we want to focus on wed? We
   chose the latter.

.. warning:: Some of the browser-dependent tests may fail on browsers
             other than Chrome. Eventually, wed will work the same on
             all browsers but at the moment development efforts are
             spent elsewhere than hunting down differences in browser
             behavior. For instance, as of 2013/07/19 some of the
             caret movement tests fail on Firefox. This does not
             prevent using wed on Firefox.

.. warning:: As part of normal development, wed is tested on Chrome
             first, Firefox second. Other browsers will eventually
             be added to this list as the Selenium-based tests take
             shape.

Internals
=========

The Tag v0.10.0-x
-----------------

The git repository contains tags v0.10.0 and v0.10.0-x. What's the
deal? Both tags represent the same state of development. The first
points into the master branch, the second into the develop branch. The
second tag was created to work around a bug that prevents using ``git
describe`` when using the `nvie edition
<https://github.com/nvie/gitflow>`__ of gitflow. If you use gitflow
with wed, use the `AVH edition
<https://github.com/petervanderdoes/gitflow>`__.

JavaScript Event Handling
-------------------------

Modes are free to bind whatever handlers they want to those GUI
elements they themselves are responsible for creating, managing and
destroying. However, modes **must not** bind their own event handlers
for the standard JavaScript type of events onto any GUI element that
wed is responsible for managing. They must use the appropriate custom
wed events. This ensures proper ordering of processing. Here is the
list of JavaScript events for which custom events have been defined;
the order the events are listed corresponds to the order they are
processed

* keydown:

 + wed-input-trigger-keydown
 + wed-global-keydown

* keypress:

 + wed-input-trigger-keypress
 + wed-global-keypress

* paste:

 + wed-post-paste

* contextmenu:

 + wed-context-menu

Those handlers that are bound to these custom events should have the
following signature:

    ``handler(wed_event, javascript_event)``

Where ``wed_event`` is the jQuery ``Event`` object created for
dispatching custom events and ``javascript_event`` is the original
JavaScript event that caused the custom event to be triggered.

.. warning:: Returning ``false`` from handlers bound to custom events
             won't stop the propagation of the original JavaScript
             event. Handlers for custom events that wish to stop
             propagation of the JavaScript event **must** call the
             appropriate method on the ``javascript_event``
             object. They must additionally return ``false`` or call
             the appropriate methods on the ``wed_event`` object.

* wed-input-trigger-* events are meant to be handled by
  ``InputTrigger`` objects.

* wed-global-* events are meant to be handled by the default event
  handlers for wed, or those event handlers meaning to alter default
  processing.

* The paste event has no wed-global-* event associated with it.

Wed also uses the custom events ``wed-click`` and ``wed-unclick`` to
inform element labels that they should change their status to clicked
or unclicked. These events are used (``wed-click`` specifically) so
that if the status must change due to an event not caused by a mouse
operation, then wed won't cause a mouse event to happen. A ``click``
event would trickle up the handler chain, etc.

Modes that define elements in the GUI tree that want to have their own
custom context menu handler must listen for ``wed-context-menu``
**and** define a data field named ``wed-custom-context-menu`` set to a
truthy value.

Selections
----------

Wed works with multiple types of selections:

DOM selection
  The selection as understood by DOM. Methods working with this
  selection have ``DOM`` in their name.

GUI selection
  The selection in the GUI tree. The GUI selection is just called
  "selection", without any further qualifier. This is the range selected
  by the user in the document being edited. The methods operating on
  this selection do not use a special qualifier. E.g. ``getSelection``
  does not have ``DOM`` or ``data`` in its name and thus works on a
  GUI selection.

Data selection
  The selection that corresponds to the GUI selection in the data tree.
  Methods working with this selection have ``data`` in their name. Mode will
  typically want to work with this selection.

Carets
------

Wed works with multiple types of carets:

Fake caret
  A caret that exists only for wed. It has no existence as far as DOM is
  concerned.

GUI caret
  The caret in the GUI tree. It may or may not correspond to a DOM caret.

Data caret
  The caret in the data tree that corresponds to the GUI caret. It may or may
  not correspond to a DOM caret. Modes usually want to work with this caret.

IM Support
----------

As usual, the browsers and various web standards make a mess of what
ought to be simple. On both Firefox 23 and Chrome 29, entering text
using IBus does not generate ``keypress`` events. The only events
available are ``keydown`` and ``keyup``. Firefox 23 generates a single
``keyup`` event at the end of composition, Chrome 29 generates a bunch
of ``keyup`` and ``keydown`` events while the character is being
composed. These events are mostly useless because their parameters are
set to values that do not indicate what the user is actually
typing. The browsers also fire ``input`` and
``composition{start,update,end}`` events, which are also nearly
useless. The ``input`` event does not state what was done to the
data. The ``composition{start,update,end}`` events indicate that
composition happened. In theory the ``data`` parameter should hold the
data being changed, but on Chrome 29 the ``compositionend`` event has
a blank ``data`` field when entering the Chinese character for wo3
("I").

There's an additional complication in that these events can happen
when the user wants to **edit** a composed character rather than
delete or add text. Suppose that we are editing the string "livré" to
read "livre". The way to do it without composition is in two
operations: delete the "é" and insert "e" (or in the reverse order).
However, with composition a character can be transformed into another character
by one atomic change on the data. A composition method could make the
change by replacing "é" with "e" as one operation, without there being
a deletion followed by an insertion. The character itself is
transformed.

What wed currently does is capture all keydown and keypress events
that are capturable to edit the data tree and **cancel** the default
behavior. (Then the GUI tree is updated from the data tree and it
looks like text input happened.) So these won't generate input
events. When an input event **is** detected, compare all text nodes of
the element on which the event triggered (a GUI node) with those of
its corresponding data element. Update data nodes as needed.

.. warning:: With this system, composed characters cannot serve as hot
             keys for the input triggers.

GUI Tree and Data Tree
----------------------

Wed maintains two trees of DOM nodes:

* A data tree which is not attached to the browser's document. (It is
  not visible. It does not receive events.) It is a mere
  representation in DOM format of the data tree being edited.

* A GUI tree which is derived from the data tree. This GUI tree is
  attached to the browser's document. It receives events and is what
  the user sees.

The ``GUIUpdater`` object stored in ``Editor._gui_updater`` is
responsible for inserting and deleting the nodes of the GUI tree that
corresponds to those of the data tree whenever the latter is modified.

Conversion for Editing
======================

Wed operates on an HTML structure constructed as follows:

* All elements from the XML document become HTML ``div`` elements.

* The original element's qualified name is stored as the first class in @class.

* All other classes that wed reserved to wed's own purposes have an
  underscore prepended to them.

* All elements that correspond to an actual element in the XML
  document are of the _real class.

* All elements that are added for decorative purposes are either in
  the _phantom or _phantom_wrap class.

* A _phantom element is not editable, period.

* A _phantom_wrap element is not itself editable but contains editable
  (_real) children.

* The XML element's attributes are stored in attributes of the form:

 * ``data-wed-[name]="..."`` when the attribute name is without namespace prefix

 * ``data-wed-[prefix]---[name]="..."`` when the attribute name has a
   namespace prefix

The ``[name]`` part is converted so that three dashes become four, four become
five, etc. Here are examples of XML attributes and what they become in
HTML:

* ``foo`` -> ``data-wed-foo``
* ``xml:lang`` -> ``data-wed-xml---lang``
* ``xml:a-b`` -> ``data-wed-xml---a-b``
* ``xml:a---b`` -> ``data-wed-xml---a----b``

* Wed may add attributes for its internal purposes. These do not
  correspond to any XML attributes. They are encoded as
  ``data-wed--[name]``. An XML attribute name or prefix may not begin
  with a dash, so there cannot be a clash.

Browser Issues
==============

The sad fact is that browsers are limited in functionality, buggy, or
incompatible with each other. This section documents such issues.

Cut, Paste, Copy
----------------

Copying and pasting don't present any special difficulties. However,
cutting is problematic, because:

1. Browsers don't allow JavaScript to initiate cuts. So it is not
   possible to intercept a ``cut`` event and then cause the browser to
   cut by using a *different* event.

2. A cut modifies the DOM directly. This is a problem because wed
   wants modifications to go through ``TreeUpdater`` objects. An
   earlier version of wed was letting ``cut`` events go through and
   updated the data tree but this caused the GUI tree to become
   stale. (An additional complication is that there is no undoing.)

It is possible to listen to ``cut`` events and let them go through or
veto them, but this is about the maximum level of control that can be
achieved cross-browser.

As of 2013-11-15, cutting works on Firefox 25 and Chrome 30 on
Linux. It is unknown whether it would work on other
platforms. Unfortunately, it is not possible to automatically test for
cutting functionality because JavaScript cannot initiate a cut
operation by itself.


Contenteditable
---------------

Incompatibilities
~~~~~~~~~~~~~~~~~

One area of incompatibility is the implementation of contenteditable
across browsers. Even a single browser can behave inconsistently
depending on how the DOM tree is structured. (In Firefox 20, the
presence or absence of white-space text nodes sometimes changes the
way BACKSPACE is handled when the caret is at the start of a
contenteditable element.)

Successive Elements and the Caret
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Suppose the structure::

    <p contenteditable="true">foo <button contenteditable="false">A</button>
    <button contenteditable="false">B</button> bar</p>

If you place the caret just before the space before "bar" and hit the
left arrow to move it back between buttons A and B, various browsers
will handle it differently. At any rate, in both Chrome 26 and Firefox
20, there will **not** be a caret **between** A and B. The caret may
disappear or be moved somewhere else. The same result occurs if you place the
caret after the space after ``foo`` and hit the right arrow.

Setting the caret programmatically does not work either but in general
results in the caret disappearing.  Browsers differ a little bit. In
Chrome 26, it seems that even though the caret becomes invisible, it
still exists between the two elements. (It is possible to delete
either button.) In Firefox 20, the caret becomes
non-existent (editing is not possible).

So to allow editing between successive elements, wed has to create a
placeholder to allow the user to put their caret between elements.

Synthetic Keyboard Events
-------------------------

In Firefox 20, it seems impossible to get the browser to handle a
synthetic keyboard event exactly as if the user had typed it. The
event can be created and dispatched, and it will trigger event
handlers. However, sending a series of "keydown", "keypress", "keyup"
events for the letter "a" while the caret is in a contenteditable
region won't result in the letter "a" being added to the element being
edited.

It is possible to use plugins like sendkeys_ to simulate key presses
that actually modify the contents of editable elements. However, when
it comes to simulating key presses in contenteditable elements, the
simulation is very imperfect. Cursory testing sending BACKSPACE using
sendkeys and BACKSPACE using the keyboard shows inconsistent behavior.

.. _sendkeys: http://bililite.com/blog/2011/01/23/improved-sendkeys/

Vetoing Mutations
-----------------

It might seem that using MutationObserver to check on a DOM tree, one
would be able to veto a user-initiated change inside contenteditable
elements. In practice, a single keyboard key (like BACKSPACE) hit
might result in 5-6 mutations of the DOM tree, and there is no simple
way to know that these 5-6 mutations were all initiated by a single
key.

Memory Leaks
------------

There seems to be a small memory leak upon reloading a window with wed
in it.

Tests performed with Chrome's memory profiler by doing:

1. One load,
2. issuing a memory profile,
3. reload, and
4. issuing a memory profile

show that the whole Walker tree created before the first profile is
created still exists at the time of the second profile. Upon reload,
wed stops all MutationObservers, removes all event handlers, and
deletes the data structure of the document being edited. We do not know
of a good explanation for the leak.

..  LocalWords:  contenteditable MutationObserver MutationObservers
..  LocalWords:  keydown keypress javascript jQuery util contextmenu
..  LocalWords:  InputTrigger wed's prepended xml lang keyup sendkeys
..  LocalWords:  compositionend wo livré livre capturable GUIUpdater
..  LocalWords:  TEI Étranger étranger IBus AjaxAppender XmlLayout IM
..  LocalWords:  ajaxlog url CSRF JSON msg Github reStructuredText js
..  LocalWords:  RequireJS setTimeout localhost selenic addr config
..  LocalWords:  PYTHONPATH nginx nginx's SauceLab Makefile DOM desc
..  LocalWords:  getSelection namespace programmatically profiler CSS
..  LocalWords:  gitflow oop wedutil SauceLabs nvie AVH deployable py
..  LocalWords:  requirejs unoptimized conf gui LocalWords github
..  LocalWords:  unclick unclicked truthy
