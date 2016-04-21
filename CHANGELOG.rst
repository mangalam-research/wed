Please note that Github currently does not implement all
reStructuredText directives, so some links in this document may not
work correctly when viewed there.

Only salient changes are recorded here.

* 0.26.2:

  - In Chrome 50, the values returned by Region.getBoundingClientRect
    changed in cases where the range covered a line-breaking space in
    such a way that it cause wed to be unable to find where to put the
    caret when clicking on multi-line elements. The code was changed
    to handle to the issue. Unclear whether there was actually a bug
    in wed or whether the change in Chrome 50 is a bug.

* 0.26.1:

  - This release consists mostly of fixes to issues on IE11, and a few
    performance improvements that benefit IE11, but also other
    platforms.

  - Added a polyfill for ``Element.prototype.closest``.

  - Bug fix: There was an inconsistency between IE11 and other
    browsers in the way deletion of attributes was handled. When an
    attribute is deleted, the caret is put in the "next"
    attribute. IE11 disagreed with other browsers as to which
    attribute was next in the data tree. This has been fixed by
    relying on the GUI tree.

  - Bug fix: The firstElementChild_etc.js polyfill mixed tests and
    patches for two different DOM interfaces. The way it used to
    perform its test was unreliable, with the end result that it could
    yield errors on IE 11. The code has been fixed to handle the two
    DOM interfaces separately, even though they are handled by a
    single file.

  - Bug fix: the kitchen sink lacked a polyfill, which could have
    caused it to fail when loaded in IE.

  - Internal: validation status reporting revamped for performance and
    internal consistency.

  - Internal: validation error processing now batches errors for
    display rather than display them immediately when each error is
    reported by the validator. This helps with performance.

  - Internal: the unit tests now load the polyfills so that they can be
    run on all platforms.

* 0.26:

  - Bugfix: Fixed a bug in the code that merge sibling elements. In
    particular, this bug would get triggered when an input trigger
    created with ``makeSplitMergeInputTrigger`` would merge two
    elements where the preceding element ends with a text node and the
    next starts with a text node. The two text nodes would become
    adjacent, which caused validation to crash because salve does not
    accept two ``text`` events in succession. The merging code has
    been fixed so that if two text nodes become adjacent, they are
    merged into one node.

* 0.25:

  - Support for Firefox on all platforms has been temporarily
    suspended. In brief, the problem is that Selenium is no longer
    able to accurately simulate real user interaction with the
    browser. The problem is technical, but we do not have the
    resources to fix Selenium. Please read `the documentation
    <https://mangalam-research.github.io/wed/>`_ for the details of
    why it is so. (Sorry for the imprecise link. A more precise link
    from this file is not yet possible due to the way the
    documentation is generated.)

  - Support for IE 10 has ended because Microsoft no longer supports
    it. This version of wed will most likely run fine on IE 10 but
    future versions won't be tested with IE 10 and thus may not run
    properly.

  - Going foward: wed cannot be developed with Node.js earlier than
    version 4. Upgrading the development environment to 4 allows
    upgrading some of the development tools to their latest
    version. Supporting both Node 0.12 and Node 4 would be *doable*
    but won't happen unless someone is willing to spend time
    implementing it.

  - Wed now uses Gulp for building, rather than ``make``.

  - Wed now supports the use of schemas that allow multiple possible
    elements as the top element of a document. Previous versions did
    not, and required customizing schemas to narrow the possible top
    choices to just one element. Our go-to example was TEI which
    typically allows both ``TEI`` and ``teiCorpus`` as the top
    element. People using TEI would have had to specially take care to
    customize their schema to allow ony one of the two elements at the
    top. This is no longer necessary.

  - GUI: Wed now has a real help page accessible through the help
    dialog (``F1``).

  - API: Wed now uses the `merge-options
    <https://github.com/schnittstabil/merge-options>`_ module to merge
    configuration options. The upshot is that it is now possible to
    unset options that are set through RequireJS` ``module.config()``
    by passing ``undefined`` values to the ``init`` method of ``Editor``
    objects.

  - API/GUI: Wed now allow the creation of draggable and resizable
    windows. ``Editor.makeModal`` is now allowing an ``options``
    argument to specify whether the modals are draggable and
    resizable. Wed's stock modals are not usually resizable or
    draggable but modes may want to create such modals.

  - GUI: Attribute values are now shown in black on a white
    background. This emphasises the values relative to the rest of an
    element label and has for effect to distinguish a double quote
    appearing in a value from a double quote as attribute value
    delimiter.

  - Internal: Upgraded to lodash 4. Wed won't work with earlier releases.

  - Internal: Upgraded to salve 2.0.0.

  - Internal: Bug fix: An embarrassing mistake made it so that adding new
    attributes to an element never worked correctly, as the attriubte
    name was mangled. This has been fixed.

  - Internal: Bug fix: Clicking onto an attribute appearing after a
    namespace attribute would cause a spurious error to be
    reported. This has been fixed.

  - GUI: Bug fix: The march of progress made it so that Chrome is now
    better able to detect whether touch events are available. This, in
    turn, causes Bootstrap to assume it is on a mobile platform
    whenever touch events are available. This causes Bootstrap to add
    a backdrop to capture clicks outside dropdowns, which causes
    problems with our context menus. The problem has been fixed.

  - GUI: Bug fix: When a document is saved, the save status acquires a
    tooltip that indicates what kind of save happened most recently
    (autosave, manual save). A bug prevented the tooltip from being
    updated correctly. This has been fixed.

  - GUI: Bug fix: The default trigger for tooltips is a combination of
    ``focus`` and ``hover``. The earlier versions of Bootstrap had a
    bug that made it so that the combination did not work
    correctly. Wed was inadvertently depending on this bug. 3.3.5
    fixed the Bootstrap bug, which changed the behavior that wed was
    depending on and thus caused problems in wed. The issue has been
    fixed.


* 0.24.3:

  - GUI: Bug fix: If a validation error occurred at the very end of a
    document, wed would put the error marker outside the editing
    pane. Moreover, clicking on such marker would put the caret in a
    useless position. This has been fixed.

  - GUI: Bug fix: If a validation error occurred in an attribute but
    the attribute was not shown because the mode was set to hide all
    attributes or because the mode happened to hide just *this*
    attribute, it would result in a crash. This has been fixed.

  - GUI: Bug fix: If a validation error occurred in an inline element
    that spanned multiple lines, the error would appear in a bad
    position. This has been fixed.

  - GUI: Bug fix: When the label visibility level was reduced to 0,
    attributes would no longer be shown. However, error in attributes
    would still be shown in the list of errors. This resulted in being
    able to click on an attribute error and get the caret in the
    position of the attribute. Visually, it looked like the caret was
    inside the element even though the caret was in the
    attribute. This would result in confusion if the user tried to
    enter text while the caret was there. This has been fixed so that
    attributes error that point to invisible attributes are not linked
    to their attributes. A tooltip is set on the error to indicate
    what is going on.

  - Internal: Optimized Editor.toDataNode so that it uses ``$.data``
    whenever possible.

* 0.24.2:

  - 0.24.1 had a packaging mistake. This release fixes it.

* 0.24.1:

  - Internals: Implemented a caching system for
    ``validator.Validator`` so that repeated calls to those methods
    that use the internal method ``_getWalkerAt`` do not take so much
    time.

    Most documents edited with a mode that derives from the generic
    mode should see a performance increase. The larger the document,
    the bigger the performance increase. The performance increase also
    depends on how the mode calls the validator.

* 0.24:

  - API: ``mutation_domlistener`` is now gone. This was used early in
    the life of wed... then stopped being used... and became a bit
    derelict. There's no point in keeping it around.

  - API: ``domlistener`` now supports additional events:
    ``children-changing``, ``removing-element``,
    ``excluding-element``. The semantics of ``children-changed``,
    ``removed-element`` and ``exluded-element`` have changed. See the
    documentation on ``domlistener`` for details. (Note: internally
    wed still uses the ``children-changed``, ``removed-element`` and
    ``excluded-element`` events as before, even though they have
    changed semantics.)

  - API: ``dloc.DLoc`` is now checking the offset passed to it and
    raises an error if it is invalid.

  - API: ``dloc.DLoc`` has acquired:

    + A ``isValid`` method to check whether it points to a valid DOM
      location. A location that started valid may become invalid as the
      DOM is modified.

    + A ``normalizeOffset`` method to create an object with a valid
      offset from an object that is invalid.

  - API: ``getGUICaret`` now normalizes the caret if it is in an
    invalid position.

  - GUI: Bug fix: If a transformation caused the document to scroll it
    was possible to get into a state where refreshing the fake caret
    could cause a crash. This has been fixed.

  - GUI: Bug fix: If the user put the caret in text but moved the
    mouse pointer on a label a tooltip could be shown. Then if the
    user typed text, the tooltip would remain open and not be closable
    anymore. This has been fixed.

* 0.23:

  - API: displayTypeaheadPopup now takes a ``width`` parameter.

  - GUI: When the input element of a typeahead popup loses focus, it
    no longer closes the dropdown. This was not a bug in wed but an
    undesirable default behavior of Twitter Typeahead.

  - GUI: Adjusted some of the spaces in the typeahead suggestions.

  - GUI: bug fix: Clicking on a _gui element that contained a text
    node would cause an infinite loop. This has been fixed. Wed itself
    does not create elements that would have triggered the bug but
    some modes in other projects using wed do.

* 0.22.1:

  - GUI: bug fix: in Internet Explorer, the typeahead popup would be
    created without being active. Although this did not affect wed
    itself or the modes bundled with it, it did affect external modes
    that use the typeahead popup.

* 0.22.0:

  - API: Upgrade to salve 0.23.0, which means that wed now supports
    Relax NG's ``interleave`` and ``mixed`` elements.

  - GUI: Upgrade to Font Awesome 4.3.0.

  - GUI: The icon for an element's documentation is now
    fa-question-circle rather than fa-book.

  - GUI: Added support for creating typeahead popups based off of
    Twitter Typeahead. The modes bundled with wed do not make use of
    such typeaheads but custom modes may use them.

  - GUI: bug fix: some key combinations typed into placeholders
    (usually having Ctrl, Alt or Command set) would not be transmitted
    to the modes. This has been fixed.

  - GUI: bug fix: typing the ESCAPE key on IE would cause an escape
    character to be inserted in the document or would cause a crash
    (when typed while a label is selected). This has been fixed.

* 0.21.0:

  - GUI: Wed now filters out zero-width spaces from the input and converts
    non-breaking spaces to normal spaces.

  - GUI: When the user types the spacebar on the keyboard next to an
    already existing space, no new space is entered. Note that wed
    does not *generally* prevent the presence of multiple spaces next
    to one-another.

  - GUI: Upgrade to Bootstrap 3.3.2.

* 0.20.0:

  - The wed demo now has an option for storing files locally. This
    allows using wed without a server.

  - If the document is not in a modified state wed now turns off the
    prompt that would be otherwise displayed when the user tries to
    leave the page.

  - Fixed serialization bug: on IE, the top node would get
    an extra `xmlns` attribute.

* 0.19.1:

  - Fixed a major bug with serialization. There is a bug in the way
    Chrome serializes nodes that do not have a namespace set on
    them. This Chrome bug masked a bug in wed. Firefox serializes
    correctly and so wed's bug would manifest itself in Firefox but
    not Chrome.

  - API: ``transformation.makeElement``,
    ``transformation.wrapInElement``,
    ``transformation.wrapTextInElement`` and
    ``transformation.insertElement`` take an additional ``ns``
    parameter which is the URI of the namespace for the element to be
    created. Their ``name`` parameter must be the prefixed name of
    the element to create.

* 0.19.0:

  - API: Modes can now implement ``getValidator`` to return a validator to
    perform some ad-hoc checks that can't be performed with a schema-based
    validator.

* 0.18.1:

  - API: added the ``ignore_module_config`` option.

  - Fixed a bug that caused wed to crash when there is no saving url
    specified in the options.

* 0.18.0:

  - This version is a major reworking of wed. This is where old APIs
    are freely broken for the sake of better functionality.

  - GUI: Context menus now support filtering operations by kind of
    operation, by type of node modified and by text of the nodes
    involved.

  - wed now bundles with jQuery 2.1.1.

  - API: Wed now expects pure XML and saves pure XML rather than the
    HTML format that was previously used. Related changes:

    - ``xml-to-html`` and ``html-to-xml`` are no longer needed.

    - API: InputTrigger now takes an actual element name for selector
      rather than the class name required by the now obsolete method
      of storing data. So to get paragraph elements for instance you
      specify "p" rather than ".p".

  - API: ``jqutil`` is gone.

  - API: ``jqutil.toDataSelector`` is now ``domutil.toGUISelector``.

  - API: The other functions form ``jqutil`` are gone as they were no
    longer used.

  - API: ``domutil`` has acquired ``dataFind`` and ``dataFindAll``.

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

  - API: Introduced the ``gui/icon`` module.

  - API: ``transformation.Transformation`` now has an additional ``type``
    parameter which indicates the type of transformation. **Code must
    be changed to take care of this.**

  - API: ``transformation.Transformation`` now computes an icon on the
    basis of the ``type`` parameter passed to it. So in many cases it
    is not necessary to give an icon.

  - API: ``Editor.computeContextMenuHeight`` was removed as it was
    unusued.

  - API: The data field named ``element_name`` that
    ``transformation.Transformation`` objects expect in the ``data``
    object passed to their handlers is now called ``name``. This field
    is now referenced in description strings as ``<name>`` rather than
    ``<element_name>``.

  - API: ``tree_updater.TreeUpdater``'s old ``deleteNode`` event is
    now named ``beforeDeleteNode``. There is a new ``deleteNode``
    event which is now emitted **after** the node is deleted.

* 0.17.2:

  - 0.17.1 actually introduced more problems on IE. Hopefully, this
    release fixes that.

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
