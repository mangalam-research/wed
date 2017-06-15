Creating a Mode
===============

We recommend creating new modes by inheriting from the generic mode. The first
thing you must do is set the metadata on the ``_wed_options`` object because wed
will refuse to load your mode if these are not set::

    this._wed_options.metadata = {
        name: "Foo",
        authors: ["Ty Coon"],
        description:
           "This mode does foo!",
        license: "MPL 2.0",
        copyright: "2013 Ty Coon Industries"
    };


Modes may set other options on the ``_wed_options`` property. This is
essentially a mean for the mode to control how wed operates when the mode is
active. These are not meant to be directly settable by the user or by the
application in which wed is being used. (Although it would be possible for the
mode to expose options to make them settable.)

+ ``label_levels``: an object with two fields:

  - ``max``: determines the maximum level of
    :ref:`label visibility <label_visibility>`,

  - ``initial`` determines the initial level of label visibility; must
    be ``1 <= initial <= max``. (Level 0 exists. It is just not valid
    to start at that level.)

+ ``attributes``: determines the level of *direct* attribute editing
  support provided by wed. By "direct editing" we mean allowing the
  user to change the value of attributes directly, as attributes. No
  matter what level is selected, wed itself or its modes are *always*
  free to modify attributes behind the scenes.

  The levels are:

  - ``"hide"``: wed won't show attributes and won't allow editing
    them directly.

  - ``"show"``: wed will show attributes but won't allow editing
    them directly.

  - ``"edit"``: wed will show and allow editing attributes.

  Here are examples to illustrate some of the differences and what they mean
  concretely. Suppose a project based on TEI that uses ``ptr`` to link to other
  elements in the document. This ``ptr`` element uses the ``@target`` attribute
  to point to the desired element. A mode using ``"hide"`` would not allow the
  user to see ``@target`` or to manually enter a target in ``@target``. However,
  it could present a menu item saying "Create hyperlink to other element" and
  provide a list of elements the user may link to to choose from. When the user
  selects an element, the mode would create a ``ptr`` element with an
  appropriate ``@target`` value. If needed, it would also create a proper
  ``@id`` on the element to which the ``@target`` refers. The ``@id`` attribute,
  just like ``@target`` would not be editable by the user directly or visible to
  the user.

  Suppose a similar project but a less sophisticated mode that does not assist
  with hyperlinking. Here, the mode set the option to ``"edit"`` for the
  attributes. In this setup, the user would have to create their ``ptr`` element
  and add themselves a proper value for ``@target`` through the attribute
  editing functions. They would also be responsible for putting a proper ``@id``
  on the element to which ``@target`` refers.

Submodes
========

A submode is a mode that applies only to a portion of a file. Suppose that you
are editing a TEI or Docbook file, and it contains an image encoded as SVG or an
equation recorded as MathML. It would be onerous to require that the mode that
has been tailored for TEI or Docbook *also* be tailored for SVG or
MathML. Submodes allow the editor to switch modes when it encounters regions of
a document that require specialized handling.

Caveats:

+ A submode must know that it is a submode. It is possible to write a mode in a
  way that allows it to be used as a main mode *and* a submode but it must be
  aware of when it is used as a submode and adapt accordingly.

+ The ``Mode`` object created for a submode is created *once* per document, even
  if the mode applies to multiple subregions. If the submode may apply to
  multiple regions of a document and these regions are to be handled as
  self-contained structures, the submode must handle it itself. (This is by
  opposition to the hypothetical situation where the editor would create a
  different ``Mode`` object per region governed by the submode. In this case,
  the submode would not have to take special care to treat different regions in
  isolation. We do not create a new submode for each region because the memory
  requirements would be prohibitive, with benefits that are very
  situation-specific.)

+ A submode is not a substitute for schema design. There is no such thing as a
  "subschema". A document is validated by one schema --- and only one --- which
  must support all structures expected in a valid document. So if you want to
  incorporate MathML in a TEI schema, you must create and use a schema that
  supports it.

+ Wed determines that a submode applies to a region of the document through the
  following mechanisms:

  - A CSS selector into the data tree: the matching elements indicate where the
    submode can be used.

  - [More methods to be added later.]

Design goals:

+ Provided that a mode is well-behaved, it should not have to be modified to
  work with submodes. (What "well-behaved" means remains to be determined. The
  point here is that there should be a set of rules that allow writing modes in
  a way that does not require ad-hoc modifications later if they are used with
  submodes.)

Well-behaved main modes:

+ Take care to not operate on elements that are managed by submodes.

Well-behaved submodes:

+ Take care to not operate on elements that are outside the region they manage,
  even though they have access to the whole document.
