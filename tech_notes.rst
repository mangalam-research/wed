Testing
=======

Note that due to the asynchronous nature the JavaScript environments
used to run the tests, if the test suites are run on a system
experiencing heavy load or if the OS has to swap a lot of memory from
the hard disk, they may fail some or all tests. I've witnessed this
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

* Not browser-dependent and therefore runnable outside a browser. We
  run these in Node.js.

* In-browser tests run *in* the browser.

* Selenium-based tests which run *outside* the browser but use selenium
  to control a browser.

Browser-Independent Tests
-------------------------

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

In-Browser Tests
----------------

To run the tests that run in the browser, you must run `<server.js>`_,
a basic web server::

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

Selenium-Based Tests
--------------------

Everything that follows is specific to wed. You need to have `selenic
<http://github.com/mangalam-research/selenic>`_ installed and
available on your ``PYTHONPATH``. Read its documentation. Then you
need to create a `<config/selenium_local_config.py>`_ file. Use one of
the example files provided with selenic. You also need to have
`wedutil <http://github.com/mangalam-research/wedutil>`_ installed and
available on your ``PYTHONPATH``.

To run the Selenium-based tests, you must can run either
`<server.js>`_ *or* an nginx-based server. The latter option is
recommended if you run your browser on a provisioning service like
SauceLabs *and* you want to maximize performance. Running
`<server.js>`_ has been explained above. To run nginx, just issue::

    $ misc/start_nginx

This will launch an nginx server listening on localhost:8888. It will
handle all the requests to static resources itself but will forward
all Ajax stuff to an instance of `<server.js>`_ (which is started by
the ``start_nginx`` script to listen on localhost:9999). This server
puts all of the things that would go in ``/var`` if it was started by
the OS in the `<var>`_ directory that sits at the top of the code
tree. Look there for logs. This nginx instance uses the configuration
built at `<build/config/nginx.conf>`_ from
`<config/nginx.conf>`_. Remember that if you want to override the
configuration, the proper way to do it is to copy the configuration
file into `<local_config>`_ and edit it there. Run make again after
you made modifications. The only processing done on nginx's file is to
change all instances of ``@PWD@`` with the top of the code tree.

Finally, to run the suite issue::

    $ make selenium-test

To run the suite while using the SauceLab servers, run::

    $ make SELENIUM_SAUCELABS=1 selenium-test

Behind the scenes, this will launch behave. See `<Makefile>`_ to see
how behave is run.

Q. Why is Python required to run the Selenium-based tests? You've
   introduced a dependency on an additional language!

A. I've found that JavaScript is poorly supported by the various
   agents on which I depend for running Selenium the way I want. I've
   tried avoiding adding a dependency on Python to software which is
   JavaScript through and through but that fight proved fruitless. Do
   I want to spent my time chassing bugs, badly documented code, and
   obscure or unsupported packages, or do I want to focus on wed? I
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
             added to this list as the Selenium-based tests take
             shape.

Usage Notes
===========

Schema and Structure Considerations
-----------------------------------

The following discussion covers schema design considerations if you
wish to use wed to enforce editing constraints. It is possible rely
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
editing purposes. If it so happens that all instance of ``<foreign>``
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
does not log anything to a remote server, however if the ``ajaxlog``
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
installation requiring that some anti CSRF token be set on HTTP
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

* ``data``: The data associated with the command. This is always an string
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
possible messages types are:

* ``version_too_old_error`` indicates that the version of wed trying to
  access the server is too old.

* ``save_transient_error`` indicates that the save operation cannot
  happen for some transient reason. The ``msg`` parameter on the
  message should give a user-understandable message indicating what
  the problem is, and to the extent possible, how to resolve it.

* ``save_fatal_error`` indicates that the save operation failed
  fatally. This is used for cases where the user cannot reasonably do
  anything to resolve the problem.

* ``locked_error`` indicates that the document the user wants to save
  is locked.

* ``save_successful`` indicates that the save was successful.

Internals
=========

JavaScript Event Handling
-------------------------

Modes are free to bind whatever handlers they want to those GUI
elements they themselves are responsible for creating, managing and
destroying. However, modes **must not** bind their own event handlers
for the standard JavaScript type of events onto any GUI element that
wed is responsible for managing. They must use the appropriate custom
wed events. This ensures proper ordering of processing. Here is the
list of JavaScript events for which custom events have been defined,
the order in which the custom events are listed is the one in which
they are processed.

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

    handler(wed_event, javascript_event)

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

Selections
----------

Wed works with multiple types of selections:

DOM selection
  The selection as understood by DOM. Methods working with this
  selection have "DOM" in their name.

GUI selection
  The selection in the GUI tree. The GUI selection is just called
  "selection", without further qualifier. This is the range selected
  by the user in the document being edited. The methods operating on
  this selection do not use a special qualifier. E.g. ``getSelection``
  does not have ``DOM`` or ``data`` in its name and thus works on a
  GUI selection.

Data selection
  The selection that corresponds to the GUI selection in the data tree.
  Methods working with this selection have "data" in their name. Mode will
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
data. The ``composition{start,update,end}`` event indicate that
composition happened. In theory the ``data`` parameter should hold the
data being changed, but on Chrome 29 the ``compositionend`` event has
a blank data when entering the Chinese character for wo3
("I").

There's an additional complication in that these events can happen
when the user wants to **edit** a composed character rather than
delete or add text. Suppose that we are editing the string "livré" to
read "livre". The way to do it without composition is in two
operations: delete the "é" and insert "e" (or vice-versa). However,
with composition a character can be transformed into another character
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

* All elements from the XML document become HTML div elements.

* The original element's qualified name is stored as the first class in @class.

* All other classes that wed reserved to wed's own purposes have an underscore prepended to them.

* All elements that correspond to an actual element in the XML document are of the _real class.

* All elements that are added for decorative purposes are either in the _phantom or _phantom_wrap class.

* A _phantom element is not editable, period.

* A _phantom_wrap element is not itself editable but contains editable (_real) children.

* The XML element's attributes are stored in attributes of the form:

 * data-wed-[name]="..." when the attribute name is without namespace prefix

 * data-wed-[prefix]---[name]="..." when the attribute name has a namespace prefix

The [name] part is converted so that three dashes become 4, 4 become five, etc. Here are examples of XML attributes and what they become in HTML:

* foo -> data-wed-foo
* xml:lang -> data-wed-xml---lang
* xml:a-b -> data-wed-xml---a-b
* xml:a---b -> data-wed-xml---a----b

* Wed may add attributes for its internal purposes. These do not correspond to any XML attributes. They are encoded as "data-wed--[name]". An XML attribute name or prefix may not begin with a dash, so there cannot be a clash.

Browser Issues
==============

The sad fact is that browsers are limited in functionality, buggy, or
incompatible with each other. This section documents such issues.

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

    <p contenteditable="true">foo <button contenteditable="false">A</button><button contenteditable="false">B</button> bar</p>

If you place the caret just before the space before "bar" and hit the
left arrow to move it back between buttons A and B, various browsers
will handle it differently. At any rate, in both Chrome 26 and Firefox
20, there will **not** be a caret **between** A and B. The caret may
disappear or be moved somewhere else. Same result if you place the
caret after the space after "foo" and hit the right arrow.

Setting the caret programmatically does not work either but in general
results is the caret disappearing.  Browsers differ a little bit. In
Chrome 26, it seems that even though the caret becomes invisible, it
still exists between the two elements. (It is possible to delete
either buttons.) In Firefox 20, the caret becomes
non-existent. (Editing is not possible.)

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

.. _sendkeys: http://bililite.com/inc/jquery.sendkeys.js

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

There seem to be a small memory leak upon reloading a window with Wed
in it.

Tests performed with Chrome's memory profiler by doing:

1. One load.
2. Issuing a memory profile.
3. Reload.
4. Issuing a memory profile.

Show that the whole Walker tree created before the first profile is
created still exists at the time of the second profile. Upon reload,
Wed stops all MutationObservers, removes all event handlers, and
deletes the data structure of the document being edited. I do not know
of a good explanation for the leak.

..  LocalWords:  contenteditable MutationObserver MutationObservers
..  LocalWords:  keydown keypress javascript jQuery util contextmenu
..  LocalWords:  InputTrigger wed's prepended xml lang keyup sendkeys
..  LocalWords:  compositionend wo livré livre capturable GUIUpdater
..  LocalWords:  TEI Étranger étranger IBus AjaxAppender XmlLayout IM
..  LocalWords:  ajaxlog url CSRF JSON msg wedutil PYTHONPATH
