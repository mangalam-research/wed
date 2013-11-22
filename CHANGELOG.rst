Please note that Github currently does not implement all
reStructuredText directives, so some links in this document
may not work correctly when viewed there.

Only salient changes are recorded here.

* 0.11.0:

  - Wed now has a notion of label level, which allows showing more or
    less labels. See `this
    <http://mangalam-research.github.io/wed/usage.html#label-visibility>`_

  - Global API change. Most functions that used to take an Array as a
    caret position or general location now require ``DLoc`` objects or
    return ``DLoc`` objects. A non-exclusive list of methods affected.

    + Most methods on the ``TreeUpdater`` class.

    + ``Editor.getGUICaret``

    + ``Editor.setGUICaret``

    + ``Editor.getDataCaret``

    + ``Editor.setDataCaret``

    + ``Editor.toDataLocation``.

    + ``Editor.fromDataLocation``

    + ``GUIUpdater.fromDataLocation``

    + The ``move_caret_to`` parameter in transformation data must now
      be a ``DLoc`` object.

  - ``editor.getCaret`` is now ``Editor.getGUICaret``.

  - ``Editor.setCaret`` is now ``Editor.setGUICaret``

  - ``Editor.toDataCaret`` is now ``Editor.toDataLocation``.

  - ``Editor.fromDataCaret`` is now ``Editor.fromDataLocation``.

  - ``GUIUpdater.fromDataCaret`` is now ``GUIUpdater.fromDataLocation``

  - API change for ``Decorator.elementDecorator`` and
    ``GenericDecorator.elementDecorator``: a new parameter has been
    added in third position, which gives the level of the labels added
    to the element.

  - API change for transformations:

    + New signature: ``fireTransformation(editor, data)``

    + Transformation handlers have the same signature.

    + The ``data`` parameter now contains fields that correspond to
      what used to be ``node`` and ``element_name``.

  - API change: modes based on the generic mode should have a meta
    that defines ``getNamespaceMappings()``.

  - Moved the build to Bootstrap 3.0.2 and jQuery 1.10.2.

* 0.10.0:

  .. warning:: The changes to the build system are substantial enough
               that if you update the sources in place (through a ``git
               pull``, for instance) we recommend rebuilding wed from
               scratch: ``make clean`` then ``make``. Just to be on the
               safe side.

  .. warning:: The location of the files to use for the demo and the
               in-browser tests has changed. See the documentation on
               the `demo
               <http://mangalam-research.github.io/wed/usage.html#local-demo>`_
               and the documentation on `testing
               <http://mangalam-research.github.io/wed/tech_notes.html#
               in-browser-tests>`_.

  - Internals: wed now requires salve 0.14.1 or later, which means
    smaller schema files, faster loading and faster running. Yippee!

  - GUI: wed can now handle some input methods. So long as the methods
    are not designed to **edit** already entered text, there should be
    no problem. We're able to enter Sanskrit, Tibetan and Chinese using
    ibus on Linux.

  - Build: the build system now creates an optimized bundle which can
    be used for deploying wed.

  - API: ``decorator.Decorator`` used to have an ``init()``
    method. This method no longer exists. This method has been
    replaced by two methods:

        * ``addHandlers()`` which add the event handlers on the
          domlistener that the decorator uses.

        * ``startListening()`` which tells the decorator that its
          listener should start listening.

    The old ``init()`` would do what these two methods do. Since
    handler order matters, the new API allows one to tell the
    decorator to add its handlers, then add more handlers, and finally
    tell the decorator to start listening. The old API did not allow
    this.

  - API: the protocol for saving to a server was redesigned. See
    the `tech notes <http://mangalam-research.github.io/wed/
    tech_notes.html>`_.

  - API: The ``Editor`` methods ``setSelectionRange`` and
    ``getSelectionRange`` have been renamed ``setDOMSelectionRange``
    and ``getDOMSelectionRange``. The Editor method ``getSelection``
    has been renamed ``getDOMSelection``.

  - API: ``Editor.setSelectionRange`` and ``getSelectionRange`` are
    two **new** methods.

* 0.9.0:

  - GUI: Wed now actually uses the icons set on actions.

  - API: ``Editor.{get,set}CaretAsPath`` were not used anywhere and
    thus were removed.

  - API: ``Editor.{get,set}DataCaretAsPath`` were only used by
    wundo.js and thus removed from the ``Editor`` API and moved to
    wundo.

  - API: ``Editor.getDataCaret`` and ``Editor.toDataCaret`` are now
    able to return approximate positions when the GUI caret happens to
    be in a position for which there is no corresponding data caret.

  - A few deal-breaker bugs were fixed. They were major enough to
    require a new release, but the changes above required a minor
    release rather than a patch release. Therefore, 0.9.0 and not
    0.8.1.

* 0.8:

  - GUI: validation error reporting is more user-friendly than it used
    to be.

  - API: Specifying a mode path can now be done in an abbreviated
    fashion for modes bundled with wed.

  - Internal: Now uses Bootstrap 3.0.0.

  - API: ``Decorator`` now takes the domlistener that listens
    to GUI changes, the editor, and the TreeUpdater that updates the
    GUI tree.  Consequently ``Mode.makeDecorator`` takes at the very
    least the same arguments. (It could require more if the mode
    requires it.)

  - API: modal callbacks are no longer called as ``callback(ev,
    jQthis)`` but as ``callback(ev)``.

  - API: ``Modal.getContextualActions`` takes two additional
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

  - Internal: wed now uses less to generate CSS.

  - Internal: wed now maintains two DOM trees representing the
    document. The first is a representation of the document's XML
    data. The second is an HTML-decorated representation of this same
    data for display purposes.

* 0.4 introduces major API changes:

  - Whereas the ``mode`` option used to be a simple path to the mode
    to load, it is now a simple object that must have the field
    ``name`` set to what ``mode`` used to be. See the Using_
    section.

.. _Using: README.html#using

  - Creating and initializing a wed instance has changed
    considerably. Instead of calling ``wed.editor()`` with appropriate
    parameters, the user must first issue ``new wed.Editor()`` without
    parameters and then call the ``init()`` method with the parameters
    that were originally passed to the ``editor()`` function. See the
    `Using`_ section for the new way to create an editor.

..  LocalWords:  API CaretAsPath DataCaretAsPath wundo js toDataCaret
..  LocalWords:  getDataCaret domlistener TreeUpdater makeDecorator
..  LocalWords:  ev jQthis getContextualActions wed's glyphicons CSS
..  LocalWords:  getTransformationRegistry fireTransformation init
..  LocalWords:  html ibus rst setSelectionRange getSelectionRange
..  LocalWords:  setDOMSelectionRange getDOMSelectionRange README
..  LocalWords:  getSelection getDOMSelection Github reStructuredText
..  LocalWords:  getNamespaceMappings addHandlers startListening
