Please note that Github currently does not implement all
reStructuredText directives, so some links in this document may not
work correctly when viewed there.

Only salient changes are recorded here.

* 0.18.0:

  - wed now bundles with jQuery 2.1.1.

  - API: ``Mode.getContextualMenuItems`` has been removed. This was a
    function that was added very early on and that has since been
    subsumed by other methods, like ``Mode.getContextualActions``.

  - API: Removed ``TransformationRegistry``, which did not provide
    much.

  - API: Consequently, the generic mode no longer has a ``_tr`` field.

  - API: ``transformation.makeElement`` returns a ``Node`` rather than
    a ``jQuery`` object.

  - API: ``transformation.insertElement`` returns a ``Node`` rather
    than a ``jQuery`` object.

  - API: ``transformation.insertElement`` no longer takes a
    ``contents`` parameter.

  - API: ``transformation.wrapTextInElement'' returns a ``Node``
    rather than a ``jQuery`` object.

  - API: ``transformation.wrapInElement`` returns a ``Node`` rather
    than a ``jQuery`` object.

  - API: ``Decorator.addRemListElementHandler`` and
    ``Decorator.includeListHandler`` are gone.

  - API: ``Decorator.listDecorator`` now takes a ``Node`` rather than
    a ``jQuery``.

  - API: The handlers for all ``domlistener.Listener`` objects now
    receive DOM nodes rather than ``jQuery`` objects.

  - API: ``domlistener.Listener`` objects no longer accept jQuery
    selectors. They must be pure CSS now.

  - API: ``domutil.makePlaceholder`` returns a ``Node`` rather than a
    ``jQuery``.

  - API: ``mode.makePlaceholderFor`` returns a ``Node`` rather than a
    ``jQuery``.

  - API: The ``dloc`` API no longer accepts jQuery objects.

  - API: ``InputTrigger`` objects now expect CSS selectors rather than
    jQuery selectors.

  - API: ``InputTrigger`` event handlers take DOM ``Element`` objects
    rather than ``jQuery`` objects.

  - API: ``Editor.$sidebar`` is gone. It was never meant to be public.

* 0.17.1:

  - This release fixes a major bug that has been hiding in wed for
    multiple releases but was triggered only when running it on
    IE. The test suite, as extensive as it is, did not exercise wed in
    a way that revealed the bug. And the development team does not use
    IE for development. This allowed this major bug to remain hidden
    for that long.

* 0.17.0:

  - The internals were cleaned quite a bit which warrants a new minor
    version.

  - GUI: Typing when a selection is in effect replaces the selection.

  - API: made some functions that used to be public private:

    * setDOMSelectionRange

    * clearDOMSelection

    * getDOMSelectionRange

    * getDOMSelection

* 0.16.0:

  - Wed is now able to autosave at regular intervals.

  - GUI: Wed now has indicators on the screen showing whether a
    document has bee changed since the last save and showing its save
    status.

  - GUI: Wed now freezes editing if a save fails, be it a manual save
    or autosave. The editing remains frozen util a save works.

  - GUI: Hitting escape when a tooltip is displayed closes the tooltip.

  - GUI: Improved the caret movement logic to deal with cases where an
    element's editable content is wrapped by more than one element.

  - GUI: The navigation panel is not shown unless it is actually
    filled with something.

  - GUI: The GUI indicates which element the caret is in by setting
    the background of the element to a pale yellow color rather than
    using an underline.

  - API: Tooltips that appear in the editing pane now must be created
    using the ``tooltip`` method of the ``tooltip`` module. If they
    are not created this way, then they will not respond to the escape
    key and won't be closed.

  - API: Mode that want to fill the navigation panel must use
    ``Editor.setNavigationList``.

  - API: ``Editor`` no longer has a public field named
    ``$navigation_list``. (It is now private.)

  - API: Introduced ``_start_wrapper`` and ``_end_wrapper`` classes to
    mark the wrapping elements.

  - API: ``nodesAroundEditableContents`` now has a default
    implementation in the base ``Mode`` class. Modes that use
    ``_start_wrapper`` and ``_end_wrapper`` properly should not have
    to override it.

  - API: Added ``Editor.excludeFromBlur``. This is for modes that add
    things like toolbars or menu items that launch
    transformations. These DOM elements must be excluded from causing
    a blur, otherwise a) clicking these DOM elements will cause a
    transformation to occur without a caret being active (and wed will
    raise an exception), b) from the user's perspective, the caret
    appears to be lost.

  - API: The data field ``data-wed-custom-context-menu`` that is used
    to set custom menus must be set in the DOM and not just by using
    jQuery's ``data()`` method.

  - API: ``Editor`` gained a ``save`` method that allows modes to
    trigger manual saves.

  - API: The protocol for saving to a server now emits ``autosave``
    messages besides ``save``. These messages work the same as
    ``save`` messages.

  - API: The protocol for saving to a server now uses ``If-Match`` and
    ``ETag`` to prevent undetected updates from third parties.

  - API: The ``Editor``'s ``save`` option now accepts an ``autosave``
    sub-option to set the interval at which autosaves are invoked.

  - API: Modes that set background colors for their elements should
    use the variables and macros defined in the new ``wed-vars.less``
    file to have a gradient indicate which elements has the caret.

* 0.15.0:

  - GUI: In previous versions the context menu presented if a user
    brought it up using the keyboard while an element label was
    highlighted was different from the menu presented if the user
    brought it up on the same label using the mouse. This has been
    fixed.

  - GUI: Contextual menus that run are being cut off by window sides
    adjust their position to avoid being too small to be easily
    usable.

  - API: `context_menu.ContextMenu` no longer takes a maximum
    height. This height is computed automatically.

  - API: The ``autoinsert`` option now operates from the transformations
    registered with a mode rather than insert new element directly. In
    particular, if a given element could be inserted in more than one
    way, then autoinsert won't insert it. The user will have to select
    one of the methods of insertion.

  - API: ``Action`` and ``Transformation`` objects now take a
    ``needs_input`` parameter that indicates whether they need input
    from the user to perform their task. Objects which have this
    parameter set to ``true`` **cannot be used by the ``autoinsert``
    logic** to automatically insert elements as this would require
    input from the user but the ``autoinsert`` feature is meant to
    work only in unambiguous cases.

    For instance, if a mode is designed to present a modal dialog when
    the user wants to insert a bibliographical reference, then the
    transformation which inserts this reference must have
    ``needs_input`` set to ``true`` so that when such reference is
    *not* automatically inserted.

  - API: ``TreeUpdater`` has gained the ``removeNodeNF`` method which
    does not fail if the sole argument is ``null`` or
    ``undefined``. This allows calling the method in cases where there
    may be nothing to remove.

  - API: ``TreeUpdater`` has gained the ``mergeTextNodesNF`` method
    which does not fail if the sole argument is ``null`` or
    ``undefined``. This allows calling the method in cases where there
    may be nothing to merge.


* 0.14.0:

  - GUI: The generic mode now does auto-insertion of elements by
    default. It can be turned off with the new API option.

  - API: The generic mode now accepts the ``autoinsert`` option. See
    the ``generic.js`` file for details.

  - Fixed a few subtle bugs introduced by 0.13.0. These were not
    triggerable using the modes bundled with wed.

* 0.13.0:

  - GUI: hitting ``DELETE`` while on an element now deletes the whole
    element.

  - GUI: Changed the key mappings for OS X. Instead of using Ctrl, the
    mappings now use Command.

  - API: ``validator.Validator`` has gained the following methods:

    * ``getErrorsFor``

    * ``speculativelyValidateFragment``

  - Various bug fixes.

* 0.12.0:

  - Wed's test suite now passes in IE 10 and 11.

  - IE 9 is not unsupported but not supported either. See wed's
    documentation for dtails.

  - The versions of Bootstrap and Rangy that are included in the
    standalone build have been upgraded.

  - In the optimized build, lodash is now also optimized. This
    considerably reduces the number of file requests over the network.

  - The Selenium test suite has been optimized for speed. Test time is
    now one third of what it was!

  - A newer version of salve is now required to take advantage of
    its speed improvements.

  - Salve is included in wed's npm package.

  - Wed no longer loads Font Awesome's and Bootstrap's CSS files by
    itself. The application in which wed is used has the
    repsonsibility to add the necessary HTML to load these files.

    Having wed do it by itself was useful in early versions, for
    development purposes, but in the general case this causes more
    problems than it solves.

* 0.11.0:

  - Wed now has a notion of label level, which allows showing more or
    less labels. See `this
    <http://mangalam-research.github.io/wed/usage.html#label-visibility>`_

  - Wed is now able to show tooltips for start and end labels that
    mark the start and end of elements. To support this, modes must
    implement a ``shortDescriptionFor`` method that returns a string
    to be used for the tooltips.

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

  - API change: Modes no longer need to provide ``optionResolver``
    class methods.

  - API change: Modes must now emit a ``pubsub.WED_MODE_READY`` event
    when they are ready to be used by the editor.

  - Moved the build to Bootstrap 3.0.3 and jQuery 1.11.0.

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
