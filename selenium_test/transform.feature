Feature: transforming the XML structure.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: wrapping choices
  When the user selects text
  And the user brings up the context menu on the selection
  Then a context menu is visible close to where the user clicked
  And the context menu contains choices for wrapping text in new elements.

Scenario: wrapping the selected text
  Given that the user has brough up the context menu over a selection
  When the user clicks a choice for wrapping text in new elements
  Then the selection is wrapped in a new element.

Scenario: wrapping the selected text when editor pane is scrolled off screen
  When the user resizes the window so that the editor pane has a vertical scrollbar
  And the user scrolls the window down so that the editor's top is at the top of the window
  And the user selects text
  And the user brings up the context menu on the selection
  And the user clicks a choice for wrapping text in new elements
  Then the selection is wrapped in a new element
  And the window's contents does not move.
