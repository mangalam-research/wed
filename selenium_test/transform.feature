Feature: transforming the XML structure.

Scenario: choice for wrapping elements
  Given a document containing a top level element, a p element, and text.
  When the user selects text
  And the user brings up the context menu on the selection
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for wrapping text in new elements.

Scenario: wrapping the selected text
  Given a document containing a top level element, a p element, and text.
  And that the user has brought up the context menu over a selection
  When the user clicks a choice for wrapping text in new elements
  Then the selection is wrapped in a new element.

Scenario: selecting a context menu item with the keyboard
  Given a document containing a top level element, a p element, and text.
  And that the user has brought up the context menu over a selection
  When the user moves with the keyboard to a choice for wrapping text in new elements
  And the user types ENTER
  Then the selection is wrapped in a new element.
# This last item was added to make sure that the caret is in a
# sensible position after the transformation.
  And the user can bring up a context menu with the keyboard


# This test fails on Selenium 2.35.0, using FF 22. Why??? Note that
# the failure cannot be replicated manually. It does not seem to be a
# timeout issue.
Scenario: creating an element before
  Given a document containing a top level element, a p element, and text.
  And that the user has brought up the context menu over the start label of an element
  When the user clicks a choice for creating an element before the selected element
  Then a new element is inserted before the selected element.

Scenario: creating an element after
  Given a document containing a top level element, a p element, and text.
  And that the user has brought up the context menu over the end label of an element
  When the user clicks a choice for creating an element after the selected element
  Then a new element is inserted after the selected element.

Scenario: launching a transformation when there is no caret
  Given a document containing a top level element, a p element, and text.
  When the user scrolls the editor pane completely down
  And the user brings up the context menu on uneditable text
  And the user clicks a choice for creating an element before the selected element
  Then a new element is inserted before the selected element.

Scenario: auto-inserting elements
  Given an empty document
  And there is no teiHeader element
  When the user uses the keyboard to bring up the context menu on a placeholder
  And the user clicks a choice for creating a new teiHeader
  Then a new teiHeader is created inside the element
  And the teiHeader has been filled as much as possible

Scenario: auto-inserting elements, with ambiguous insertion
  Given an empty document with a mode that has ambiguous insertion of fileDesc
  And there is no teiHeader element
  When the user uses the keyboard to bring up the context menu on a placeholder
  And the user clicks a choice for creating a new teiHeader
  Then a new teiHeader is created inside the element
  And the teiHeader has not been filled

Scenario: auto-inserting elements, with interactive insertion
  Given an empty document with a mode that has interactive insertion of fileDesc
  And there is no teiHeader element
  When the user uses the keyboard to bring up the context menu on a placeholder
  And the user clicks a choice for creating a new teiHeader
  Then a new teiHeader is created inside the element
  And the teiHeader has not been filled

Scenario: not auto-inserting elements
  Given an empty document with autoinsert off
  And there is no teiHeader element
  When the user uses the keyboard to bring up the context menu on a placeholder
  And the user clicks a choice for creating a new teiHeader
  Then a new teiHeader is created inside the element
  And the teiHeader has not been filled

Scenario: an empty document with multiple possible top elements is not automatically populated
  Given an empty docbook document
  Then the editor pane contains only a placeholder

Scenario: when an empty document has multiple possible top elements, it is possible to create the top element
  Given an empty docbook document
  Then the editor pane contains only a placeholder
  When the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new book
  Then the document contains only a book element
  And 0 errors appear in the error panel

Scenario: when an empty document has multiple possible top elements, it is possible to create the top element and undo the creation
  Given an empty docbook document
  Then the editor pane contains only a placeholder
  When the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new book
  Then the document contains only a book element
  When the user undoes
  Then the editor pane contains only a placeholder
