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


