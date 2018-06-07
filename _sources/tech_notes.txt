====================
Advanced Usage Notes
====================

Build Information
=================

Every time a build is performed, the building process stores information about
the build into a file which at run time is available as a module at the
``lib/wed/build-info`` location relative to the root of the build
directory. This module contains two fields:

* ``desc`` is a description of the build. This string is created by running
  ``git describe`` and adding to the result the string ``-unclean`` if the build
  was done with an unclean working tree.

* ``date`` is the date of the build. (To be precise, it is the date at which the
  build ``build-info`` module was generated.)

This information was added to wed as of version 0.11.0. If you happen to use
wed's development code that was produced after version 0.10.0 was released but
before version 0.11.0 was released, then the version number you'll get in the
``desc`` field will start with "v0.10.0-x". The additional "-x" is a special
case to work around a bug in gitflow.

.. _tech_notes_deployment_considerations:

Deployment Considerations
=========================

It is possible to deploy wed using the ``build/standalone/`` file tree but you
will pay in execution time and bandwidth because the files in this tree are not
optimized.

The ``build/packed/`` file tree is optimized with Webpack. This optimization is
designed to provide a balance between performance and flexibility. Greater
performance could have been achieved by incorporating into one file all of the
external libraries. However, such bundle would be unlikely to be trivially
deployable on a full-fledged web site in which wed would be embedded. Such site
might already be using jQuery and Bootstrap, perhaps different versions from
those used to build wed, etc. The optimization described above could conceivably
be used on this hypothetical server, provided that the configuration is updated
to look for the external libraries at the right places.

Schema and Structure Considerations
===================================

The following discussion covers schema design considerations if you wish to use
wed to enforce editing constraints. It is possible to rely instead on user
discipline to enforce constraints, just like one would do if using a plain text
editor to edit XML. If this is your case, then you do not need to concern
yourself with the following.

If you want constraints to be enforced **by wed**, then prioritize using a data
structure that accurately reflects your **editing** concerns rather than your
interchange concerns or your standard conformance concerns. Here's an
example. Suppose that you use a schema based on the TEI markup, and that for
interchange purposes with another system it makes sense to encode something
like::

    <p><term><foreign xml:lang="fr">Étranger</foreign></term> is a foreign
    term.</p>

However, you do not want to allow your users to insert text inside the
``<term>`` element but outside ``<foreign>`` because that encoding is
meaningless in your project. Wed is not designed to easily enforce this
restriction. Wed will allow your users to create something like::

    <p><term>The term <foreign xml:lang="fr">étranger</foreign>
    </term>is a foreign term.</p>

The solution here is to represent the ``<term><foreign></foreign></term>``
structure as one element, for editing purposes. If it so happens that all
instances of ``<foreign>`` are always to be interpreted as
``<term><foreign></foreign></term>`` for interchange purposes, then you might as
well make your editing structure ``<foreign>`` and convert it to the interchange
structure when you actually need to interchange. In other cases, you might want
to create your own element for editing, like ``<my:custom-element>``, which is
then created in the right context by the mode you create for your project.

.. _remote_logging:

Remote Logging
==============

Wed uses log4javascript to log anything worth logging. By default, wed does not
log anything to a remote server; however, if the ``ajaxlog`` option is passed to
wed, it will add an ``AjaxAppender`` to the logger and log messages using
``XmlLayout``. The ``ajaxlog`` option is of the form::

  ajaxlog: {
      url: "...",
      headers: { ... }
  }

The ``url`` parameter is the URL where log4javascript will send the log
messages. The ``headers`` parameter specifies additional headers to send. In
particular this is useful when the receiver is an installation requiring that
some anti-CSRF token be set on HTTP headers.

.. _saving:

Saving
======

Wed saves documents using Ajax queries to a server. Where wed saves is
determined by the ``save`` option. It is of the form::

    save: {
        path: "...",
        options: {
        }
    }

The ``path`` parameter is the path to the module that implements the ``Saver``
abstract class. The two choices for now are ``wed/savers/ajax`` and
``wed/savers/localforage``.

Ajax Saver
----------

The Ajax saver requires a server that understands the wire protocol used by this
saver. The configuration for it is as follows::

    save: {
        path: "wed/savers/ajax",
        options: {
            url: "...",
            headers: { ... }
            autosave: ...,
            initial_etag: ...,
        }
    }

The ``url`` option is required. It is the URL where wed will send the Ajax
queries for saving. The ``headers`` option is as described above for logging. It
is optional. The ``autosave`` option is a number of seconds between
autosaves. It is optional. Setting it to 0 will turn off autosaving. Wed will
autosave only if it detects that the document has been changed since the last
save. The ``initial_etag`` option is the ``ETag`` of the document being
loaded. It is required.

Queries are sent as POST requests with the following parameters:

* ``command``: the command wed is issuing.

* ``version``: the version of wed issuing the command.

* ``data``: The data associated with the command. This is always a string
  serialization of the data tree.

The possible commands are:

* ``check``: This is a mere version check.

* ``save``: Sent when the user manually requests a save.

* ``autosave``: Sent when an autosave occurs.

* ``recover``: Sent when wed detects a fatal condition requiring reloading the
  editor from scratch. The server must save the data received and note that it
  was a recovery.

The replies are sent as JSON-encoded data. Each reply is a single object with a
single field named ``messages`` which is a list of messages. Each message has a
``type`` field which determines its meaning and what other fields may be present
in the message. The possible message types are:

* ``version_too_old_error`` indicates that the version of wed trying to access
  the server is too old.

* ``save_transient_error`` indicates that the save operation cannot happen for
  some transient reason. The ``msg`` parameter on the message should give a
  user-friendly message indicating what the problem is and, to the extent
  possible, how to resolve it.

* ``save_fatal_error`` indicates that the save operation failed fatally. This is
  used for cases where the user cannot reasonably do anything to resolve the
  problem.

* ``locked_error`` indicates that the document the user wants to save is locked.

* ``save_successful`` indicates that the save was successful.

The protocol uses ``If-Match`` to check that the document being saved has not
been edited by some other user. Therefore, it needs an ``ETag`` to be
generated. It acquires its initial ``ETag`` from the ``save`` option described
above. Subsequent successful save operations must provide an ``ETag`` value
representing the saved document.

The meaning of the ``ETag`` value is generally ambiguous. See the following
documents for some discussions of the issue:

- https://datatracker.ietf.org/doc/draft-whitehead-http-etag/
- https://datatracker.ietf.org/doc/draft-reschke-http-etag-on-write/

The current code handles the lack of precision such that ``ETag`` values
returned on error conditions are ignored. Otherwise, the following could happen:

1. Alice loads document, grabs initial ``ETag``.
2. Bob loads same document, grabs initial ``ETag``.
3. Bob saves new version, creates new ``ETag``.
4. Alice tries to save with an ``If-Match`` that has the old
   ``ETag``. This fails and returns an ``ETag`` with the response.

This last ``ETag`` would have to be the one that matches what is *currently*
stored in the server. Alice's wed instance **must not** use this ``ETag`` to
update the ``ETag`` it associates with its document, otherwise a subsequent save
will (erroneously) go through.

This may not correspond to how other systems use ``ETag``.

Localforage Saver
-----------------

.. warning:: The localForage saver is deprecated. It is no longer used by wed's
             development team, and comes with serious caveats.

This saver uses `localForage <https://github.com/mozilla/localForage>`_ to store
the data in the browser. It is configured as follows::

    save: {
        path: "wed/savers/localforage",
        options: {
            name: "..."
        }
    }

The ``name`` parameter is the name to use for saving the document in
localForage. It is the "file name" of sorts of the document.

Testing
=======

Note that due to the asynchronous nature of the JavaScript environments used to
run the tests, if the test suites are run on a system experiencing heavy load or
if the OS has to swap a lot of memory from the hard disk, they may fail some or
all tests. We've witnessed this happen, for instance, due to RequireJS timing
out on a ``require()`` call because the OS was busy loading things into memory
from swap. The solution is to run the test suites again.

Another issue with running the tests is that wed uses ``setTimeout`` to do the
validation work in a parallel fashion. (This actually simulates parallelism.)
Now, browsers clamp timeouts to at most once a second for tests that are in
background tabs (i.e. tabs whose content is not currently visible). Some tests
want the first validation to be finished before starting. The upshot is that if
the test tab is pushed to the background some tests will fail due to
timeouts. The solution for now is don't push the tab in which tests are run to
the background. Web workers would solve this problem but would create other
complications so it is unclear whether they are a viable solution.

Tests are of two types:

* Karma-based tests.

* Selenium-based tests which run *outside* the browser but use selenium to
  control a browser.

Karma-Based Tests
-----------------

To run the Karma-based tests do::

    $ gulp test-karma

These tests are located in the ``lib/tests/``. You can also run ``karma``
directly from the command line but having ``gulp`` build the ``test`` target
will trigger a build to ensure that the tests are run against the latest code.

.. warning:: Keep in mind that tests are **always** run against the code present
             in ``build/standalone/``. If you modify your source and fail to
             rebuild before running the test suite, the suite will run against
             **old code!

In September 2017 we started implementing some of the tests in Karma and moving
the tests that used to run in plain Node (i.e. Mocha running tests straight in
the Node VM) to Karma. We evaluated the relative advantages of running the tests
in jsdom, Chrome and ChromeHeadless. At some point in the implementation of the
tests, we had 231 tests running in Karma, exercising multiple aspects of the
DOM. Overall the speed results were:

jsdom: 10.5s
Chrome: 9.5s
Chrome Headless: 8s

There's no speed advantage to using jsdom relative to using Chrome, especially
Chrome in headless mode.

Also, the old Node+Mocha tests used to take 14s to run. Compare to the numbers
above. There were many reasons for this. Some of it had to do with the fact that
the TypeScript tests were compiled on the fly so the test run also included
compilation time. The Karma tests, in contrast, run the pre-compiled code.

Selenium-Based Tests
--------------------

Everything that follows is specific to wed. You need to have `selenic
<http://github.com/mangalam-research/selenic>`_ installed and available on your
``PYTHONPATH``. Read its documentation.  You also need to have `wedutil
<http://github.com/mangalam-research/wedutil>`_ installed and available on your
``PYTHONPATH``.

It is very likely that you'll want to override some of the values in
:github:`config/selenium_config.py` by creating
``local_config/selenium_config.py`` that loads the default file but override or
adds some values. For instance::

    # If used, must appear before the default file is loaded. The
    # default is to not log anything.
    LOGS = True

    # Load the default file
    execfile("config/selenium_config.py")

    # Add some local values...
    SAUCELABS_CREDENTIALS = "foo:bar"
    CHROMEDRIVER_PATH = ".../selenium/chromedriver"

Finally, to run the suite issue::

    $ gulp selenium-test --behave-params="-D browser=<platform>,<browser>,<version>"

Behind the scenes, this will launch Behave. An instance of ``./server.js`` will
be launched automatically to respond to the requests of the browser that the
test suite launches. See the gulpfile :github:`gulpfile.babel.js` for
information about how behave is run.

The ``browser`` variable determines which browser will run the test. You may
omit any of ``platform``, ``browser`` or ``versions`` so long as the parts that
are specified are enough to match a **single** configuration defined in
:github:`config/selenium_config.py`. See the list of configurations there to see
what has been configured. If you want something different from the list there,
you'll have to configure it in the copy you made into ``local_config``.

The environment variable ``BEHAVE_WAIT_BETWEEN_STEPS`` can be set to a numerical
value in seconds to get behave to stop between steps. It makes the Selenium test
unfold more slowly. The environment variable ``SELENIUM_QUIT`` can be set to
``never`` to prevent Selenium from quitting the browser after the suite is
run. It can be set to ``on-success`` so that the Selenium quits only if the
suite is successful.

Q. Why is Python required to run the Selenium-based tests? You've introduced a
   dependency on an additional language!

A. We've found that JavaScript is poorly supported by the various agents on
   which we depend for running Selenium the way we want. We've tried to avoid
   adding a dependency on Python to software which is JavaScript through and
   through, but that fight proved fruitless. Do we want to spend our time
   chasing bugs, badly documented code, and obscure or unsupported packages, or
   do we want to focus on wed? We chose the latter.

Troubleshooting the Selenium Tests
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Symptom: All tests fail!
````````````````````````

Make sure that SauceConnect is running.

Symptom: Some Firefox tests fail and I am at a loss to know why.
````````````````````````````````````````````````````````````````

Firefox is picky. Make sure you have a windows manager that manages FF's
window. (This would come into play if you use Xephyr or Xnest for
instance. You'd have to start a window manager running on the server they
create.) Some tests that failed in Xephyr have also stopped failing once
leftover windows from previous tests were closed.

Internals
=========

The Tag v0.10.0-x
-----------------

The git repository contains tags v0.10.0 and v0.10.0-x. What's the deal? Both
tags represent the same state of development. The first points into the master
branch, the second into the develop branch. The second tag was created to work
around a bug that prevents using ``git describe`` when using the `nvie edition
<https://github.com/nvie/gitflow>`__ of gitflow. If you use gitflow with wed,
use the `AVH edition <https://github.com/petervanderdoes/gitflow>`__.

JavaScript Event Handling
-------------------------

Modes are free to bind whatever handlers they want to those GUI elements they
themselves are responsible for creating, managing and destroying. However, modes
**must not** bind their own event handlers for the standard JavaScript type of
events onto any GUI element that wed is responsible for managing. They must use
the appropriate custom wed events. This ensures proper ordering of
processing. Here is the list of JavaScript events for which custom events have
been defined; the order the events are listed corresponds to the order they are
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

Those handlers that are bound to these custom events should have the following
signature:

    ``handler(wed_event, javascript_event)``

Where ``wed_event`` is the jQuery ``Event`` object created for dispatching
custom events and ``javascript_event`` is the original JavaScript event that
caused the custom event to be triggered.

.. warning:: Returning ``false`` from handlers bound to custom events won't stop
             the propagation of the original JavaScript event. Handlers for
             custom events that wish to stop propagation of the JavaScript event
             **must** call the appropriate method on the ``javascript_event``
             object. They must additionally return ``false`` or call the
             appropriate methods on the ``wed_event`` object.

* wed-input-trigger-* events are meant to be handled by ``InputTrigger``
  objects.

* wed-global-* events are meant to be handled by the default event handlers for
  wed, or those event handlers meaning to alter default processing.

* The paste event has no wed-global-* event associated with it.

Wed also uses the custom events ``wed-click`` and ``wed-unclick`` to inform
element labels that they should change their status to clicked or
unclicked. These events are used (``wed-click`` specifically) so that if the
status must change due to an event not caused by a mouse operation, then wed
won't cause a mouse event to happen. A ``click`` event would trickle up the
handler chain, etc.

Modes that define elements in the GUI tree that want to have their own custom
context menu handler must listen for ``wed-context-menu`` **and** define a data
field named ``data-wed-custom--context-menu`` set to a truthy value. This field
must be set **in the DOM** as an attribute (and not merely using jQuery's
``data()`` method.

Selections
----------

Wed works with multiple types of selections:

DOM selection
  The selection as understood by DOM. Methods working with this selection have
  ``DOM`` in their name.

GUI selection
  The selection in the GUI tree. The GUI selection is just called "selection",
  without any further qualifier. This is the range selected by the user in the
  document being edited. The methods operating on this selection do not use a
  special qualifier.

Data selection
  The selection that corresponds to the GUI selection in the data tree.  Methods
  working with this selection have ``data`` in their name. Mode will typically
  want to work with this selection.

Carets
------

Wed works with multiple types of carets:

Caret mark
  A caret that exists only for wed. It has no existence as a caret as far as
  DOM is concerned.

GUI caret
  The caret in the GUI tree. It may or may not correspond to a DOM caret.

Data caret
  The caret in the data tree that corresponds to the GUI caret. It may or may
  not correspond to a DOM caret.

Support for GUI Controls Outside Wed
------------------------------------

By default, wed does not provide any kind of drop down menus or toolbar to
perform actions like undo/redo, etc. The application that embeds wed into it,
however, might need such tools. Now, the problem is that as far as wed is
concerned, these items are not part of the editing pane and thus, manipulating
them should cause a blurring of the editor. This is undesirable because:

- It means that a GUI control that fires a transformation would fire it when the
  caret is not defined (because of the blur). This causes wed to raise an
  exception.

- Even if the previous point could somehow be worked around because wed keeps
  enough state to know where the caret was before the blur happened, the user
  would still **see** the focus leave the editor pane.

Consequently, such elements must be made known to wed so that it does not
consider clicks in them to cause a loss of focus. ``Editor.excludeFromBlur`` is
the method to use to register these elements with wed.

.. warning:: These elements must also have ``mousedown`` and ``click`` handlers
             that do not cause the **browser** to change the focus. This
             typically means that handlers for these two events should prevent
             the default browser behavior.

IM Support
----------

As usual, the browsers and various web standards make a mess of what ought to be
simple. On both Firefox 23 and Chrome 29, entering text using IBus does not
generate ``keypress`` events. The only events available are ``keydown`` and
``keyup``. Firefox 23 generates a single ``keyup`` event at the end of
composition, Chrome 29 generates a bunch of ``keyup`` and ``keydown`` events
while the character is being composed. These events are mostly useless because
their parameters are set to values that do not indicate what the user is
actually typing. The browsers also fire ``input`` and
``composition{start,update,end}`` events, which are also nearly useless. The
``input`` event does not state what was done to the data. The
``composition{start,update,end}`` events indicate that composition happened. In
theory the ``data`` parameter should hold the data being changed, but on Chrome
29 the ``compositionend`` event has a blank ``data`` field when entering the
Chinese character for wo3 ("I").

There's an additional complication in that these events can happen when the user
wants to **edit** a composed character rather than delete or add text. Suppose
that we are editing the string "livré" to read "livre". The way to do it without
composition is in two operations: delete the "é" and insert "e" (or in the
reverse order).  However, with composition a character can be transformed into
another character by one atomic change on the data. A composition method could
make the change by replacing "é" with "e" as one operation, without there being
a deletion followed by an insertion. The character itself is transformed.

What wed currently does is capture all keydown and keypress events that are
capturable to edit the data tree and **cancel** the default behavior. (Then the
GUI tree is updated from the data tree and it looks like text input happened.)
So these won't generate input events. When an input event **is** detected,
compare all text nodes of the element on which the event triggered (a GUI node)
with those of its corresponding data element. Update data nodes as needed.

.. warning:: With this system, composed characters cannot serve as hot keys for
             the input triggers.

GUI Tree and Data Tree
----------------------

Wed maintains two trees of DOM nodes:

* A data tree which is not attached to the browser's document. (It is not
  visible. It does not receive events.) It is a mere representation in DOM
  format of the document being edited. You can think of this tree as being a
  part of the model aspect of the MVC pattern. (A ``TreeUpdater`` together with
  a data tree correspond to a model.) Note that this is an XML document. **It is
  currently not possible to perform searches in the data tree using
  ``querySelector`` and its friends if tags are prefixed**. So
  ``querySelector("foo:bar")`` won't find an element whose local name is
  ``foo:bar``. You can perform the search in the GUI tree to find the GUI node
  and convert to the data node. Or you can use ``getElementsByTagNameNS`` if you
  want to search in the data tree for specific tags. Or you can use
  ``domutil.dataFind/dataFindAll``.

* A GUI tree which is derived from the data tree. This GUI tree is attached to
  the browser's document. It receives events and is what the user sees. You can
  think of this tree as being a part of the view and controler aspects of the
  MVC pattern.

The ``GUIUpdater`` object stored in ``Editor._gui_updater`` is responsible for
inserting and deleting the nodes of the GUI tree that corresponds to those of
the data tree whenever the latter is modified.

Elements of the GUI Tree
------------------------

Wed operates on an HTML structure constructed as follows:

* All elements from the XML document become HTML ``div`` elements.

* The  original  element's qualified  name  is  stored  as  the first  class  in
  ``@class``.

* All other classes that wed reserved to wed's own purposes have an underscore
  prepended to them.

* All elements that correspond to an actual element in the XML document are of
  the ``_real`` class.

* All elements that are added for decorative purposes are either in the ``_phantom``
  or ``_phantom_wrap`` class.

* A ``_phantom`` element is not editable, period.

* A ``_phantom_wrap`` element is not itself editable but contains editable
  (``_real``) children.

* The XML element's attributes are stored in attributes of the form:

 * ``data-wed-[name]-[diff]="..."`` when the attribute name is without namespace prefix

 * ``data-wed-[prefix]---[name]-[diff]="..."`` when the attribute name has a
   namespace prefix

The ``[name]`` part is converted so that three dashes become four, four become
five, etc. The ``[diff]`` part records differences between the origninal XML
name and the name in HTML. Here are examples of XML attributes and what they
become in HTML:

* ``foo`` -> ``data-wed-foo-``

* ``xml:lang`` -> ``data-wed-xml---lang-``

* ``xml:a-b`` -> ``data-wed-xml---a-b-``

* ``xml:a---b`` -> ``data-wed-xml---a----b-``

* ``Foo`` -> ``data-wed-foo-u1``. This one encodes the fact that the original
  name had an uppercase first letter.

* Wed may add attributes for its internal purposes. These do not correspond to
  any XML attributes. They are encoded as ``data-wed--[name]``. An XML attribute
  name or prefix may not begin with a dash, so there cannot be a clash.

Classes Used by Wed
-------------------

``_phantom``:
  All elements added by wed for representing the data to the user are of this
  class.

``_phantom _gui``:
  All elements that are more that just uneditable text.

``_phantom _text``:
  All elements that are text added to represent some XML data. That is, there is
  some node in the data tree that corresponds specifically to this element.

``_phantom_wrap``:
  An element which is not itself editable but contains editable (``_real``)
  children. This cannot be used to wrap nodes that are text nodes in the data
  tree.

``_phantom _decoration_text``:
  All elements that are text added for purely decorative purposes. The
  difference between these elements and those which are ``_phantom _text`` is
  that the latter represents some contents whereas the former is purely
  decorating the data. For instance if an ``<img>`` element which points to the
  image of a cow is represented on screen by the word "cow" then this text
  should be ``_phantom _text``. On the other hand if a period is added after
  numbers in a list so that they look nice on screen, these periods should be
  ``_phantom _decoration_text`` elements.

``__start_label``:
  In combination with ``_gui``, indicates a label that marks the start of an
  element.

``__end_label``:
  In combination with ``_gui``, indicates a label that marks the end of an
  element.

``_<id>_label``:
  The ``<id>`` part is the name of an element. This class marks a label as
  belonging to an ``<id>`` element. For instance, a label for a ``p`` element
  will have the class ``_p_label``. The full set of classes for such a label
  which happens to mark the start of ``p`` will be ``_gui _phantom __start_label
  _p_label``.

``_start_wrapper``:
  Marks an element which wraps the editable content of an element. There may be
  many such elements at the start of an element. For instance a ``ref`` could
  contain an element label and then the phantom text ``(``. Both would be marked
  with this class.

``_end_wrapper``:
  Like ``_start_wrapper`` but marks the end.

``_readonly``:
  Marks an element or attribute that cannot be edited.

Possible Due to Wildcard
------------------------

As explained in :ref:`complex_name_patterns`, wed *can* handle the name patterns
``NsName`` and ``AnyName`` for the purpose of validating a document but will not
allow editing such elements. In order to limit this editing, during validation
wed must set a flag on every element and attribute to indicate whether the
element's or attribute's existence is only possible due to a wildcard. Then, the
GUI rendering part of wed listens to changes to this flag and adds or remove the
CSS class ``_readonly`` to the GUI elements that render the original XML
element. This is specifically designed to avoid having the decorator refresh
elements because this can get pretty expensive.

Note that it is not possible to set the flag once and for all on an element and
never change it.  Suppose the following Relax NG::

    start = element a { element q { empty }, any+ }
    any = element * { any* }

The file ``<a><q/><q/></a>``. The first ``q`` validates because of ``element q``
in the schema. The second one because of ``any+``. If the first ``q`` is
removed, then the 2nd ``q`` will become first and will validate because of
``element q``. In other words, the deletion of the first ``q`` *changes the
reason* the second ``q`` is deemed valid. So the second ``q`` would be first
flagged to be valid due to a wildcard, and then after the edit, the flag could
be made false. Starting with a document that has ony one ``q`` and adding
another ``q`` in front of it would also cause the flag to change, but the other
way around.

.. warning:: There may be ways to optimize the whole process so as to allow more
             substantial functionality than a CSS change but any such change
             should be considered very carefully. For instance, one may think
             that we could just have rendering code call the validator to
             perform a check on each element. Calling the validator from
             rendering code *is possible* but has a significant impact on
             performance. And it is tricky. If one is not careful, it is
             possible to create an infinite loop: rendering causes validation,
             which emits validation events, which cause rendering, which casues
             validation, which emits events...


Browser Issues
==============

The sad fact is that browsers are limited in functionality, buggy, or
incompatible with each other. This section documents such issues.

Cut, Paste, Copy
----------------

Copying and pasting don't present any special difficulties. However, cutting is
problematic, because:

1. Browsers don't allow JavaScript to initiate cuts. So it is not possible to
   intercept a ``cut`` event and then cause the browser to cut by using a
   *different* event.

2. A cut modifies the DOM directly. This is a problem because wed wants
   modifications to go through ``TreeUpdater`` objects. An earlier version of
   wed was letting ``cut`` events go through and updated the data tree but this
   caused the GUI tree to become stale. (An additional complication is that
   there is no undoing.)

It is possible to listen to ``cut`` events and let them go through or veto them,
but this is about the maximum level of control that can be achieved
cross-browser.

Contenteditable
---------------

Incompatibilities
~~~~~~~~~~~~~~~~~

One area of incompatibility is the implementation of contenteditable across
browsers. Even a single browser can behave inconsistently depending on how the
DOM tree is structured. (In Firefox 20, the presence or absence of white-space
text nodes sometimes changes the way BACKSPACE is handled when the caret is at
the start of a contenteditable element.)

Successive Elements and the Caret
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Suppose the structure::

    <p contenteditable="true">foo <button contenteditable="false">A</button>
    <button contenteditable="false">B</button> bar</p>

If you place the caret just before the space before "bar" and hit the left arrow
to move it back between buttons A and B, various browsers will handle it
differently. At any rate, in both Chrome 26 and Firefox 20, there will **not**
be a caret **between** A and B. The caret may disappear or be moved somewhere
else. The same result occurs if you place the caret after the space after
``foo`` and hit the right arrow.

Setting the caret programmatically does not work either but in general results
in the caret disappearing.  Browsers differ a little bit. In Chrome 26, it seems
that even though the caret becomes invisible, it still exists between the two
elements. (It is possible to delete either button.) In Firefox 20, the caret
becomes non-existent (editing is not possible).

So to allow editing between successive elements, wed has to create a placeholder
to allow the user to put their caret between elements.

IE11 and line breaks
~~~~~~~~~~~~~~~~~~~~

We've discovered late that IE11 has a rendering issue with elements that are
``contenteditable``. Take the following::

    <p>This is a paragraph <hi>with
    highlighting</hi> and more</p>

Read it as an abstract representation of the GUI tree. The start and end tags
have corresponding labels in the GUI tree. More importantly, there is a line
break between ``with`` and ``highlighting``. This is as we want it. This it how
it works in Chrome and FF. In IE11, however, the ``hi`` element will be kept on
one line, no matter what. The only way to have IE break it is to remove the
``contenteditable`` attribute from the element created for the GUI tree!

Synthetic Keyboard Events
-------------------------

In Firefox 20, it seems impossible to get the browser to handle a synthetic
keyboard event exactly as if the user had typed it. The event can be created and
dispatched, and it will trigger event handlers. However, sending a series of
"keydown", "keypress", "keyup" events for the letter "a" while the caret is in a
contenteditable region won't result in the letter "a" being added to the element
being edited.

It is possible to use plugins like sendkeys_ to simulate key presses that
actually modify the contents of editable elements. However, when it comes to
simulating key presses in contenteditable elements, the simulation is very
imperfect. Cursory testing sending BACKSPACE using sendkeys and BACKSPACE using
the keyboard shows inconsistent behavior.

.. _sendkeys: http://bililite.com/blog/2011/01/23/improved-sendkeys/

Vetoing Mutations
-----------------

It might seem that using MutationObserver to check on a DOM tree, one would be
able to veto a user-initiated change inside contenteditable elements. In
practice, a single keyboard key (like BACKSPACE) hit might result in 5-6
mutations of the DOM tree, and there is no simple way to know that these 5-6
mutations were all initiated by a single key.

.. _tech_notes_xpath:

The XPath Problem
-----------------

Wed does not use XPath internally. A mode that you develop for wed **could**
require the use of XPath but please read on before making that choice.

The issues:

1. Browsers only natively support XPath 1.

2. On some browsers (any version of Internet Explorer, for instance), the way to
   perform XPath queries is radically different from other browsers. Most
   browsers will allow performing queries on a document produced with
   ``DOMParser``. Moreover the document produced by ``DOMParser`` is a DOM
   document with support for all the DOM methods normally found on a document.

   The machinery for XPath queries on IE browsers on the other hand produce an
   "document" which is not an actual DOM document. It is an entirely different
   beast. (Just to name one simple difference: you can use ``querySelector`` on
   documents created using ``DOMParser``. You cannot do the same on the document
   created through IE's ActiveXObject nonsense.)

   So using the browser machinery would require (at least) two significantly
   different methods of working with XML documents.

3. There are non-native solutions that *should* work on various
   browsers. However,

   + `Wicked Good XPath <https://github.com/google/wicked-good-xpath/>`__ has a
     `basic flaw <https://github.com/google/wicked-good-xpath/issues/46>`_ in
     how it handles case-sensitivity. It works inconsistently across platforms.

   + `This library <https://github.com/ilinsky/xpath.js>`__ seems a better
     choice but it is currently in flux and has no clear releases.

   + The version of Saxon that loads in browsers has support for XPath but this
     means loading a huge library.

There's no trivial way to support XPath right now. We're keeping an eye on
development of XPath libraries to determine a moment when adding such support is
reasonable.

Historical Notes
================

Initially wed was designed with the idea that ``contenteditable`` would take
care of caret management, selection management, text entry, etc. Consequently,
wed would let the browser drive the management of these things and query the
browser to know where the caret was, whether there was a selection,
etc. However, experience soon proved that the browsers did not handle these
functions in a way that was appropriate for wed. So wed had to take over the
management of some of these functions. Since there was always some hope that at
least *some* of these functions could *still* be delegated to the browser, these
changes happened incrementally, changing only as much as needed to get the
desired result. Some of these changes made earlier code obsolete but this was
not discovered immediately. So wed evolved form this approach:

 * The browser is the authority on the caret position, the selection, and
   related things. Wed queries the browser as needed.

To this approach:

 * Wed is the authority on the caret position, the selection, and related
   things. Wed updates the browser's idea of such things as needed.

The incremental nature of the changes made it so that overtime code that
operated under the first approach was found right next to code that operated
under the second approach. Version 0.17.0 cleaned up a good deal of the old code
(first approach) that was made obsolete by the incremental changes, but some
obsolete code may still remain.

..  LocalWords:  truthy unclicked unclick github gui requirejs py deployable js
..  LocalWords:  AVH nvie SauceLabs wedutil gitflow CSS programmatically desc
..  LocalWords:  namespace DOM PYTHONPATH config selenic setTimeout RequireJS
..  LocalWords:  Github msg JSON CSRF url ajaxlog IM XmlLayout AjaxAppender TEI
..  LocalWords:  IBus étranger Étranger GUIUpdater capturable livre livré keyup
..  LocalWords:  compositionend sendkeys lang xml prepended wed's InputTrigger
..  LocalWords:  contextmenu jQuery javascript keypress keydown contenteditable
..  LocalWords:  MutationObserver
