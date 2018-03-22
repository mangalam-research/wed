Please note that Github currently does not implement all reStructuredText
directives, so some links in this document may not work correctly when viewed
there.

Only salient changes are recorded here. Releases that contain only the
odd bug fix may not get mentioned here at all.

* 2.0.0:

  - We no longer support building or running any of the code of this project on
    Node 4.x. You need Node 6.x or higher.

  - Breaking distribution changes:

    + The standalone-optimized tree has been removed. Wed now ships a
      ``standalone`` tree, which is the same as it has ever been, and a
      ``packed`` tree (introduced in 1.0.0) that is wed optimized through
      Webpack.

  - Breaking API changes:

    + ``Key.__cache`` is no longer public. It was a mistake that it was.

    + ``Key`` no longer has a public constructor. Previously you were
      discouraged from using it but it was public.

* 1.0.0:

  - Release 1.0.0. Woohoo!

  - Breaking change: major reorganization of the code to present a facade and
    clarify what is public and what is not public. In particular:

    * You may only load the ``wed`` module, ``wed/onerror``, ``wed/log`` and the
      modules that make up the bundled modes. You may load polyfills, glue and
      patches as needed. Note that the entry point to wed is no longer the
      module ``wed/wed`` but the module ``wed``.

    * You must use ``makeEditor`` to create a new editor instance. Code that
      creates editors access them through the ``EditorInstance``
      interface. Whereas modes use the ``EditorAPI`` interface.

    * You may not use anything not exposed by the ``wed`` module. So if you are
      a mode author, you must get everything your mode uses from ``wed`` instead
      of trying to load the individual modules under ``wed/*``.

    See the section titled ``Using`` in the documentation, specifically the part
    about the changes in ``0.31``.

  - Breaking API change: Upgraded from typeahead.js to corejs-typeahead. The
    package typeahead.js had ceased to be maintained, and compatibility with
    jQuery 3.x was dubious. corejs-typeahead has been tested with jQuery 3.x.

    Modes that create ``TypeaheadPopup`` objects certainly need to be updated.

  - Breaking API change: the ``Listener`` class in the ``domlistener`` module is
    now called ``DOMListener``. The old name pretty much always required
    renaming the import, which was a pain.

  - API change: ``wed`` now exports ``DOMListener``.

  - Breaking API change: ``util.decodeAttrName`` now returns a structure rather
    than a string. See that function for details.

  - Breaking API change: ``util.encodeAttrName`` encodes names differently from
    what it used to. This matters if you statically stored encoded names that
    conform to the older algorithm. (e.g. if you have CSS tests that depend on
    the old way of encoding attribute names). They will have to be modified to
    conform to the new algorithm.

  - Bug fix: The previous API change fixes an issue that has plagued wed since
    day one: wed was not able to properly handle attributes with uppercase
    letters. Uppercase in element names were never a problem, but due to the
    fact that HTML (silently) converts attribute names to lowercase, it was not
    possible for wed to handle an attribute with uppercase characters properly.

    Wed had never been used to edit attributes with uppercase names, and so the
    issue remained undiscovered until recently.

  - Possibly breaking change: wed has changed the way it looks for the embedded
    documentation. It previously was looking for a path relative to the main
    ``wed/wed`` module. That method depended on functions provided by
    RequireJS. In order to eliminate dependencies on RequireJS, wed now look for
    the embedded documentation relatively to the page where it is
    loaded. Whether or not you need to act depends on how you use wed.

    A new initialization option named ``docURL`` was added. It is optional. If
    wed cannot find its embedded documentation, you may set the URL to the path
    of the embedded documentation page. If the path is relative, remember that
    it is interpreted relative to the *page* where wed is loaded.

    To ascertain whether you need a custom value, open your wed instance, press
    F1 to bring up the help dialog and click the link in the dialog. If you get
    to the help page, then you are fine. If not, you need a custom value.

  - New feature: wed now support ``Ctrl-?`` to bring up a replacement menu. In
    brief, replacement menus are like completion menus but they can be brought
    up after an attribute value has already been filled, to replace the value.
    See the bundled documentation for details.

  - New API: The editor now has a ``transformations`` observer that can be
    used to know when transformations start and end and to add changes to a
    transformation.

    More formally: wed allows subscribers acting on transformation events
    to make further modifications to the data tree.

  - New API: The editor now has an ``undoEvents`` field which is the stream
    of undo/redo events. Modes can listen to undo/redo operations and act on
    them if needed.

    This may be used in tandem with the ``transformations`` stream. When a
    transformation is undone or redone, the undoing or redoing is done by
    playing the modifications of the data tree in reverse or replaying them
    forward. The modifications are at a lower level of operation than
    transformations so when undoing/redoing, wed does not execute
    transformations. This is problematic for some use-case-scenarios where a
    mode wants to know whether the undo/redo is undoing or redoing a specific
    transformation. The mode can add a mark to the undo list and then use that
    to know whether the undo/redo deals with a specific transformation.

  - New API: There is now an ``UndoMarker`` object which may be used to
    insert markers into the list of undo operations. This may be useful for some
    modes.

  - New GUI feature: wed now has a toolbar.

  - New GUI feature: wed now has proper GUI button classes.

  - New feature: wed now has a stock transformation for removing markup in
    mixed-content. A button was added to the toolbar for this transformation.

  - New feature: wed now has a button in the toolbar for turning off attribute
    autohiding.

  - New API and potentially breaking change: all code that creates tooltips that
    appear inside the GUI tree must use the ``makeGUITreeTooltip`` method. This
    is "breaking" in the sense that the method did not exist before.

  - Bug fix: ``TransformationHandler`` is now a generic. This fixes type
    checking issues that could happen under the old code.

  - New API: ``EditingMenuManager`` now has a ``setupContextMenu`` method which
    combines ``computeMenuPosition`` and ``displayContextMenu``.

  - Breaking API change: ``displayTypeaheadPopup`` has been moved from
    ``Editor`` to ``EditingMenuManager``.

  - New API: ``EditingMenuManager`` now has a ``setupTypeaheadPopup`` method
    which combines ``computeMenuPosition`` and ``displayTypeaheadPopup``.

  - Breaking API change: none of wed's functions return ``RangyRange`` objects
    anymore. They all return stock DOM ``Range`` objects. If you really need a
    ``RangyRange``, you can create one yourself manually from the ``Range``
    objects.

    Except for Rangy's search facilities, wed was not generally using much of
    Rangy. The compatibility layer that it offers for old browsers is no longer
    crucial to wed. (Early on, wed had support for IE 9, for instance.)
    Conversely, the TypeScript typings for Rangy are a mess and make supporting
    it at the interface level difficult.

    And Rangy itself appears to be rather moribund. We may drop it entirely in a
    future release, if we find a good replacement for searching through HTML.

  - Potentially breaking change: The ``onbeforeunload`` module no longer
    automatically installs itself on a window. This did not play well with the
    new Webpack build and would cause issues in cases where some parts of wed
    were needed, but not a whole editor. If you did rely on the automatic
    install, then this is a breaking change. If not, then it is not.

    Note that a wed editor instance does use ``onbeforeunload`` to install a
    handler, and *this has not changed*. It used to be that merely loading the
    module would *also* install a default handler. Only *this* has changed.

  - Potentially breaking GUI change: on OS X the keyboard shortcuts for
    decreasing and increasing label visibility were ``Cmd-[`` and
    ``Cmd-]``. However, OS X uses these combinations and thus they were never
    available to wed. End result: the user could not change the label
    visibility. We tried some alternative keyboard combinations, with
    unsatisfying results. For now, OS X users will have to use the toolbar to
    change visibility levels.

    This is *potentially* breaking because it is likely that most people never
    used the problematic combinations. Only users who bothered to change the OS
    key combinations to avoid the conflict with wed could have worked around the
    issue. For them this is a breaking change, but this is probably a tiny
    minority of users.

  - Bug fix: wed would crash on reporting spurious attributes. This is probably
    a regression that came in a while back and went undetected because wed is
    usually used to create documents from scratch and so does not usually run
    into spurious attributes.

  - Bug fix: if an attribute subject to autohiding had an error, wed would
    produce an error item without a link. That's fine for when the attribute is
    hidden, but it is a problem when the attribute is shown. Wed now recreates
    errors when an autohidden attribute is shown or hidden.

  - Bug fix: ``wed-metadata`` was badly packaged. This has been fixed.

  - Bug fix: ``wed-metadata`` would produce invalid data if it ran on TEI JSON
    files that were produced from customizations rather than on files that were
    representing a stock TEI schema. This has been fixed.

  - Potentially breaking API change: ``Action`` no longer has any notion of
    being enabled or not. It was never used in wed and just gave the wrong
    impression that actions could be disabled somehow. We may reintroduce this
    notion later, and do it properly when we do.

  - New API: ``objectCheck`` has an ``assertSummarily`` function which allows
    throwing on any check error. That's a common usage pattern for
    ``objectCheck``.

  - New API: ``objectCheck`` has an ``assertExtensively`` function which allows
    throwing a detailed error on failing checks. That's also a common usage
    pattern for ``objectCheck``.

* 0.30.0:

  - This version contains a slew of changes that improve the handling of
    namespaces. Wed has had namespace support since the very beginning but it
    would have been fair to call the support "very temperamental". For instance,
    if a mode expected the TEI namespace to be the default namespace
    (unprefixed) and you tried to edit a file with the TEI namespace assigned to
    the prefix "tei", you would have been in trouble. The changes in this
    version aim to smooth out the possible differences between what a file
    actually contains and what a mode expects. This is a prerequiste to
    supporting the new "submode" feature.

  - New feature: wed supports submodes. See the documentation for details of
    what submodes are.

  - New feature: wed now supports searching and replacing. See the documentation
    for details.

  - New feature: wed now has a minibuffer. It is currently used for quick
    searches.

  - Breaking change: the ``stringRepeat`` polyfill has been removed from the
    code base. We now recommend using ``core-js`` to provide a consistent
    environment for Wed across browser platforms.

    If you use ``core-js``, and use Bluebird to override the default ``Promise``
    implementation provided by your platform (which you should do), we recommend
    loading Bluebird **after** ``core-js``. Otherwise, you are stuck with
    ``core-js`` implementation of promises, which is, to put it politely,
    incomplete. (See https://github.com/zloirock/core-js/issues/205).

  - Breaking change: you need to add a polyfill for ``Array.from`` if you are
    using your own polyfills and do not move to ``core-js`` (which does provide
    it). Note that it is very unlikely that in the future we'll be documenting
    each new case that needs polyfilling. We're doing it now because
    ``Array.from`` is the case that triggered the switch to ``core-js``. In the
    future, it is unlikely we'll even *know* that we're using something
    polyfilled by ``core-js``. Polyfilling is usually required for running on
    IE11, which is not a priority for us, support-wise.

  - Breaking changes: Addition of the submode feature, which causes breaking
    changes. This matters if you designed your own mode. ``Editor`` no longer
    has the following properties. They must be fetched through
    ``editor.modeTree`` instead: ``mode``, ``attributes``, ``attributeHiding``,
    ``resolver``, ``decorator``.

  - Breaking change: ``editor.my_window`` is now ``editor.window``.

  - Breaking changes: the first two parameters of ``editor.init`` have been
    transferred to the constructor of the ``Editor`` class.

  - Breaking change: the modals are now accessible through the ``modals``
    property of editors rather than as individual names.

  - Breaking change. The signature for the constructor for ``Decorator`` has
    changed to allow a simpler way to create decorators.

  - Breaking changes: Converted the core of wed to TS. This entails that the
    properties of ``Editor`` were converted to camel case: ``straddling_modal``,
    ``help_modal``, ``$error_list``, ```complex_pattern_action``, ``paste_tr``,
    ``cut_tr``, ``split_node_tr``,
    ``merge_with_previous_homogeneous_sibling_tr``,
    ``merge_with_next_homogeneous_sibling_tr``.

  - Breaking change: Wed now needs to have ``Promise`` available in its
    environment. It no longer loads Bluebird in an ad hoc manner by calling
    ``require`` (or using ``import``) in modules that use promises. You may use
    Bluebird as a polyfill for IE11. You may also want to use Bluebird generally
    on all platforms to allow consistent handling of unhandled rejections. At
    the time of writing, only Chrome 49 and later support
    ``onunhandledrejection``, but Bluebird adds support for it.

  - Passing ``null`` to ``onbeforeunload.check`` as the second argument is no
    longer valid. That it worked before was a bug.

  - Breaking changes: ``Editor`` no longer acts as an ad hoc event
    emitter/conditioned object. The consequences are:

    + The "saved"/"autosaved" events are no longer emitted by ``Editor``. The
      ``saver`` is now public. Subcribe to the events that it emits. The
      corresponding event names are capitalized: ``"Saved"`` and
      ``"Autosaved"``.

    + In order to know when the first validation is complete, previously you'd
      do ``editor.whenCondition("first-validation-complete", ...)``. You must
      now instead grab ``editor.firstValidationComplete``, which is a promise
      that resolves when the first validation is complete. It is also no longer
      possible to listen on the corresponding event.

    + Similarly, you could do ``editor.whenCondition("initialized", ...)`` to
      execute code when the initialization procedure was completed. You must now
      instead either act on the promise a) returned by ``editor.init()`` or, b)
      held in ``editor.initialized`` which resolve when the initialization is
      complete. As above, the corresponding event is no longer emitted.

  - Breaking changes:

    + ``decorator.Decorator`` needs the mode's absolute namespace mappings in
      its constructor.

    + ``domutil.toGUISelector`` needs the mode's absolute namespace mappings.

    + ``domutil.dataFind`` needs the mode's absolute namespace mappings.

    + ``domutil.dataFindAll`` needs the mode's absolute namespace mappings.

    + ``util.classFromOriginalName`` needs the mode's absolute namespace
      mappings.

  - Potentially breaking change: Modes must implement
    ``getAbsoluteNamespaceMappings`` and ``unresolveName``. This matters if you
    design modes. Modes derived from ``generic`` may rely on the default
    implementation.

  - Potentially breaking change: The special attribute named
    ``data-wed-custom-context-menu`` is now named
    ``data-wed--custom-context-menu``. This matters if you design modes.

    This is required because the original name could have clashed with the
    ``data-wed-`` attributes created for XML attributes. An XML attribute called
    ``custom-context-menu`` would have clashed. The double dash ensures that a
    clash cannot occur because an attribute name cannot begin with a dash.

  - Potentially breaking change: The HTML tree created by wed to represent the
    XML now has classes of the form ``_local_...`` and ``_xmlns_...``. If a mode
    sets classes of this form, then that's a clash.

  - Potentially breaking change: The HTML tree created by wed now has attributes
    of the form ``data-wed--ns-...``. If a mode sets attributes of this form,
    then that's a clash.

  - Breaking changes: context menu methods are no longer directly on the
    ``Editor`` class. The following methods are accessible on
    ``editor.editingMenuManager`` (where ``editor`` is an ``Editor`` instance):

    + ``dismissDropdownMenu``, under the new name ``dismiss``.

    + ``displayContextMenu``,

    + ``getMenuItemsForAttribute``,

    + ``getMenuItemsForElement``,

    + ``makeMenuItemForAction``,

    + ``computeContextMenuPosition``, under the new name
      ``computeMenuPosition``.

  - Breaking change: ``makeDocumentationLink`` no longer exists. It is replaced
    by ``makeDocumentationMenuItem`` on ``EditingMenuManager``.

  - Breaking change: ``action-context-menu`` exports ``ActionContextMenu``
    instead of the old ``ContextMenu``.

  - Breaking change: the ``oop`` module is no longer distributed with wed,
    because wed does not need it. If you were using it, you could grab a copy
    from an old version of wed or find a replacement for it from a third-party
    library.

  - Potentially breaking change: the ``log`` module no longer has
    ``clearAppenders``. (Mode designers and users of wed normally don't use this
    directly.) Instead the ``log.addURL`` method returns the appender created,
    and it must be removed with ``log.removeAppender``.

  - Breaking change: ``domutil.insertText`` returns an plain object rather than
    an array. The same information as before is available, but in a different
    format. See the function's documentation. The new function also allows
    getting a caret position at the end or start of the inserted text.

  - Breaking change: ``TreeUpdater.insertText`` returns a plain object rather
    than an array. The same information as before is available, but in a
    different format. See the function's documentation. The new function also
    allows getting a caret position at the end or start of the inserted text.

  - Breaking change: the functions that make keys in the ``key`` module now take
    a parameter to specify a shift state. Shift states are meaningless for key
    presses (and wed forces the use of the default value ``EITHER``). However,
    it is now possible to specify keys likes Ctrl-Shift-A and distinguish it
    from Ctrl-A.

  - Breaking change: implementations of ``Metadata`` must add an implementation
    for ``unresolveName``.

  - Breaking change: ``Validator`` takes an array of mode validators instead of
    a single validator.

* 0.29.0:

  - Major reorganization of the code: starting with this release, we are
    progressively converting the JavaScript code to TypeScript. We will also
    progressively replace antiquated APIs with newer ones. For instance,
    functions taking callbacks will be replaced with functions returning
    promises or observables.

    The scope of this change is such that it will span multiple releases.

  - Wed now uses salve 4.0.5.

  - Switched from bootstrap-growl to bootstrap-notify to provide
    notifications. The latter supports modules out of the box, and is
    actively maintained and released. (Bootstrap-growl required module
    system glue and special dependency handling because the latest npm
    for it was obsolete (newer version on github).)

  - Upgraded typeaheadjs.css. We now install it with npm.

  - Upgraded to log4javascript 1.4.13, which is AMD-compatible.

  - Integrated a linting check. This revealed a smattering of problems
    in the code. Nothing that would cause crashes or incorrect results
    but there were unused variables here and there, for instance.

  - Wed now uses `Bluejax <https://github.com/lddubeau/bluejax>`_.

  - The validation engine has been mostly extracted from the code base and spun
    into an independent library to be published `here
    <https://github.com/mangalam-research/salve-dom/>`_.

  - Optimization: the validation engine itself was careful to parcel out its
    work to prevent the UI from blocking for long periods of time. However, the
    code that managed the *results* of validation (showing errors, refreshing
    error positions on screen, etc.) did not benefit from the same design. This
    caused **significant** performance issues when editing documents with lots
    of errors. A ``TaskRunner`` has been added to allow the same kind of
    parceling out that the validator does.

  - Simplification: ``domlistener`` and ``updater_domlistener`` have been
    combined into ``domlistener``. Once upon a time wed had two types of
    ``Listener`` classes. The type that relied on DOM mutations was retired a
    long time ago, but the module split remained, though useless. This useless
    split has been removed.

  - Feature: when configured with a mode named ``x``, wed now also looks for a
    module named ``x-mode``. (In order it tries to load ``x``,
    ``wed/modes/x/x``, ``wed/modes/x/x-mode``, ``wed/modes/x/x_mode``).

  - Feature: add the "split" operation to the default set of transforms shown by
    the contextual menus. In the past, "split" was only available through an
    InputTrigger but there's no good reason for this restriction.

  - Feature: add the "Wrap content in" operation.

  - Feature: changed the location where missing attributes are reported. They
    now appear in the start label of an element.

  - Feature: support for arrow up and arrow down to move the caret.

  - Feature: support for attribute completion provided by mode. Modes can
    provide a list of completions for attributes that require dynamic generation
    of the possible completions beyond what is provided by a schema.

  - Feature: support for automatic attribute hiding.

  - GUI Fix: When the user would use the down arrow to navigate the options of a
    completion menu, the focus would be lost from the document and would not be
    regained when the user closes the completion menu. This made further typing
    ineffective until the user clicked in the document.

  - API: You can pass Bluejax configuration options that are used globally by
    setting the ``bluejaxOptions`` option in the option object you pass to your
    editor.

  - API: The ``Editor`` object now allows passing a ``module:runtime~Runtime``
    object in the place where you'd pass options. If you pass an anonymous
    options object, wed will create a runtime with it. If you pass an actual
    ``Runtime`` object, it will extract its options from it.

  - API: ``Decorator.startListening`` no longer takes an
    argument. That it took an argument was a bug. It was never used.

  - API: wed is now able to load data from an IndexedDB database. This is mainly
    used for demonstration purposes but could eventually be expanded to
    something more flexible.

  - New saver: wed now has an IndexedDB saver. This is mainly used for
    demonstration purposes.

  - Breaking API change: the tool previously named ``tei-to-generic-meta-json``
    has been renamed ``wed-metadata``. Check its help to adapt any use you
    previously made of ``tei-to-generic-meta-json`` to the new tool.

  - ``wed-metadata`` is bundled with the build package.

  - Breaking API change: there is no longer any ``Meta`` object for the generic
    mode and modes derived from it. Consequences:

    + Mode now directly load the metadata file. So a mode configuration would
      now look like::

         mode: {
             path: 'wed/modes/generic/generic',
             options: {
                 metadata: '.../path/to/metadata'
             }
         }

    + If you are a mode designer, you need to rewrite your mode to work
      without a ``Meta`` object.

  - Breaking API change: the metadata format is now at version 2. Version 1 is
    still read by wed. However, except for very trivial cases, a version 1
    metadata file won't do what you want. If you are a mode designer or write
    your own metadata files, you should move to version 2 ASAP.

  - Breaking API change: ``module:mode~Mode`` objects now take the editor as
    their first argument. (This matters only if you created your own modes.)

  - Breaking API change: ``module:mode~Mode#init`` no longer takes any
    arguments. (This matters only if you created your own modes.)

  - Breaking API change: When a path is passed in the ``schema`` option,
    this path is interpreted as-is.

    It used to be interpreted relative to the location of wed among
    the modules loaded by RequireJS. This worked but was frankly a bit
    bizarre. More importantly, it made wed's code dependent on a
    loader/bundler that replicates what ``require.toUrl`` does, which
    was problematic.

  - Breaking API change: The ``dochtml`` field embedded in the generated
    metadata JSON file is now interpreted as-is. If you used such
    metadata, you need to regenerate your files with an updated
    path. The problem here was the same as above: dependence on
    ``require.toUrl``.

  - Breaking API change: wed no longer supports a "global default
    configuration" against which configuration options passed to
    ``Editor.init`` instances are merged. This means:

    + Passing configuration through ``module.config`` is no longer
      possible. This was deprecated in 0.27.0

    + Using the special ``wed/config`` to pass configuration is no
      longer possible. This was introduced in 0.27.0. I would have
      liked to formally deprecate it first but it proved a substantial
      obstacle to moving forward, and engineering a solution that
      would still support this method *and* provided for the new needs
      would have cost substantial time. The whole notion of a global
      configuration managed by wed was ill-advised from the get-go.

    From now on if you want defaults that are common to all your wed
    instances, you need to come up with your own method of combining
    global default and special cases, and pass the result to
    ``Editor.init``. Wed used the `merge-options
    <https://github.com/schnittstabil/merge-options>`_ module to merge
    options. It should be trivial to do a ``mergeOptions({}, globals,
    specifics)`` and pass the result to ``Editor.init``. It would
    replicate what wed did internally.

  - Potentially Breaking API change: ``domutil.linkTrees`` and
    ``domutil.unlinkTree`` no longer accept arguments that are not Elements. The
    operations don't make sense for non-Elements. (This is "potentially
    breaking" because in most cases this should be used only by wed internally.)

  - Breaking API change: the ``domutil.nextCaretPosition`` and
    ``domutil.prevCaretPosition`` functions now have their arguments all
    mandatory. Wed itself never called them without all arguments, and
    maintaining the versions with optional arguments was not straightforward,
    actually. It makes good sense to always require a container. And the default
    of ``noText`` being ``true`` was rather arbitrary.

  - Breaking API change: ``TreeUpdater`` and derived classes (like
    ``GUIUpdater``) now use the Rxjs observer system to emit events rather than
    using the local homegrown mixin. So you have to subscribe to ``events``
    rather than use ``addEventListener``, etc.

  - Breaking API change: the class ``ModeValidator`` is gone and replaced with
    an interface in ``wed/validator``.

  - Breaking API change: the ``getValidator`` method of ``Mode`` now returns
    ``undefined`` when there is no validator to be gotten.

  - Breaking API change: ``mode.Mode`` is now ``mode.BaseMode``.

  - Breaking API change: ``BaseMode``'s (formerly ``Mode``) ``init`` method must
    return a promise that resolves when the mode is ready.

    Concomitant with this change, the ``pubsub`` module has been removed and wed
    no longer uses PubsubJS.

  - Breaking API change: ``Listener.addHandler`` no longer takes an array of
    events as its first argument. This was a historical artifact that no longer
    had any value.

  - Breaking API change: ``saver.Saver`` has been revamped. This does not matter
    unless you produced your own savers or tried to hook unto a saver's
    events. Salient changes:

     + Saver methods that took callbacks now return promises.

     + ``Saver`` emits events on observables rather than use
       ``simple_event_emitter``.

     + ``Saver`` now has a promise that resolves when initialized instead of
       using ``conditioned``.

     + Event names are all capitalized.

     + Internals are now without leading underscore and are in camelCase.

  - Potentially Breaking API change: ``DLoc.makeRange`` returns ``undefined`` if
    either location is invalid. (This is "potentially" breaking because there's
    not much you could have done with a range created from invalid locations.)

  - Breaking API change: ``makeDLoc`` is now accessible only through the
    ``DLoc`` class.

  - Fix: the ``domutil.makePlaceholder`` function used to treat its argument as
    HTML, it now treats it as text.

  - Fix: ``Action`` and ``Transformation`` are no longer implementing
    ``SimpleEventEmitter``. This was actually a leftover from a very early
    experiment, and none of the functionalities of ``SimpleEventEmitter`` were
    ever used on ``Action`` and ``Transformation`` objects.

  - Fix: caret movement off the visible region of a document scrolls the editing
    pane to keep the caret visible. This used to work fine but a change made a
    long time ago broke it. There was no test for it so it was missed. It is now
    fixed.

  - The ``ignore_module_config`` option is no longer useful, due to
    the preceding change.

  - The ``.xsl`` files have been moved out of the JavaScript codebase
    and into the ``misc`` directory.

  - Module name changes: underscore to dash in ``key_constants``,
    ``context_menu``, ``completion_menu``, ``action_context_menu``,
    ``generic_decorator``, ``input_trigger_factory``, ``generic_tr``.

  - Variable name changes:

    + ``Action`` class:

       * To camelCase: ``needs_input``, ``_abbreviated_desc``, ``bound_handler``,
         ``bound_terminal_handler``.

       * Loss of underscore: ``_editor``, ``_desc``, ``_abbreviated_desc``,
         ``_icon``.

    + ``Transform`` class:

        * To camelCase: ``needs_input``, ``node_type``, ``abbreviated_desc``,
          ``icon_html``.

        * ``type`` was renamed to ``transformationType`` to avoid the keyword.

    + ``TreeUpdater`` class (and derived classes like ``GUIUpdater``):

        * To camelCase, event fields ``old_value``, ``former_parent``,
          ``new_value``.

    + ``BaseMode`` (formerly known as ``Mode``):

        * To camelCase: ``_wed_options``.

        * Loss of leading underscore: ``_editor``, ``_options``,
          ``_wed_options``.

    + ``ContextMenu``:

        * Loss of leading underscore: ``_menu``, ``_$menu``, ``_dismissed``,
          ``_backdrop``, ``_dropdown``, ``_render``.

    + ``Decorator``:

        * To camelCase: ``_gui_updater``.

        * Loss of leading underscore: ``_editor``, ``_domlistener``,
          ``_gui_updater``.

    + ``GenericDecorator``:

        * Loss of leading underscore: ``_options``, ``_mode``.

    + ``Mode`` in (``generic``):

        * To camelCase: ``_tag_tr``.

        * Loss of leading underscore: ``_tag_tr``, ``_resolver``.

    + ``LabelManager``:

        * Loss of leading underscore: ``_labelIndex``.

  - Breaking API change: Complete revamp of caret management. All caret methods
    are now available through ``.caretManager`` on the ``Editor`` object. Some
    highlights of how the public API changed:

    + ``.setCaret()`` is the single method by which to set new caret values whether
      they be GUI or data carets.

    + ``.getSelectionRange()`` no longer exists. Use ``.range``.

    + ``.getDataSelectionRange()`` no longer exists. Use
      ``.caretManager.sel.asDataCarets()`` and create a range from the pair if you
      need to.

    + ``.setSelectionRange()`` no longer exists. Use ``.setRange()``.

    + ``.getGUICaret()`` no longer exists. Use ``.caret`` to get a raw caret or
      ``.getNormalizedCaret()`` to get a normalized caret.

    + All methods pertaining to movement no longer have a direction in their
      name but take an argument to specify the direction. (e.g. ``.moveRight``
      is now ``.move("right")``).

* 0.28.0:

  - Wed now uses salve 3.0.0.

  - Wed no longer puts its ``data_root`` in a document fragment. The
    ``data_root`` is now the XML document itself. This caused issues
    with ``ownerDocument``, and being unable to use CSS selectors to
    match elements.

  - Wed no longer tries to set a custom message for the ``onbeforeunload``
    handler. It worked only on Chrome but Chrome has ceased to support
    the custom message.

  - Upgrade to Rangy 1.3.0. The alpha of 1.3 that we were using is no
    longer downloadable, and the stable release is accessible through
    NPM. So it is time to upgrade. Note that wed no longer loads
    rangy-selectionsaverestore implicitly so code that depended to
    this behavior will have to load that module explicitly.

  - Wed now counts on ``String.prototype.repeat`` being available. So
    it includes a polyfill for it.

  - API: ``wed/refman`` has been renamed ``wed/labelman`` because it
    was really a label manager more than a reference manager. It is
    also better documented and has acquired a concerete implementation
    in the form of ``AlphabeticLabelManager``.

* 0.27.0:

  - Fatal errors and recovery: previous versions of wed would
    automatically install window-wide error handler that would trap
    all unhandled exceptions. This had a few undesirable
    side-effects. For one thing it would hinder integrating wed into
    applications and pages that have their own error handling. **Wed
    no longers install a global error handler.** An application using
    wed should install its own global handler (for instance
    `last-resort <https://github.com/lddubeau/last-resort>`_) and have
    it call the handler exported by the ``wed/onerror`` module.

    Consequently, wed configuration option ``suppress_old_onerror`` no
    longer has any effect.

  - Wed works around a bug with tooltips and popovers in Bootstrap
    3.3.7 whereby destroying a tooltip or popover more than once would
    cause a crash. (See https://github.com/twbs/bootstrap/issues/20511).

  - Wed now supports passing configuration through a module named
    ``wed/config`` rather than through RequireJS' configuration. See
    the documentation for details as to how to upgrade to the new
    method.

  - Deprecation: Passing configuration to wed through RequireJS'
    configuration is deprecated and support for it will be removed
    eventually. This way of passing configuration is not supported by
    other loaders.

  - When getting a data node from a ``_phantom_wrap`` element, the
    caret coversion logic now moves into the ``_phantom_wrap`` to find
    the real element. This is not considered a caret approximation.

  - The DOM element which wraps the title of a modal dialog created
    through wed nows bears the ``modal-title`` class name. This allows
    isolating the modal title from the close button which is also
    included in the element that has the class ``modal-header``.

* 0.26.2:

  - In Chrome 50, the values returned by Region.getBoundingClientRect
    changed in cases where the range covered a line-breaking space in
    such a way that it cause wed to be unable to find where to put the
    caret when clicking on multi-line elements. The code was changed
    to handle to the issue. Unclear whether there was actually a bug
    in wed or whether the change in Chrome 50 is a bug.

  - Removed old code that was meant to support Chrome 31 and Chrome 37.

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
