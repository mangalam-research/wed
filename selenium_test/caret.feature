Feature: caret
 Users want a caret indicating where they are editing.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: Clicking on an element's label.
  When the user clicks on an element's label
  Then the label changes to show it is selected
  And the caret disappears

Scenario: Selecting text with the mouse.
  When the user selects text with the mouse
  Then the text is selected

Scenario: Selecting text backwards with the mouse.
  When the user selects text backwards with the mouse
  Then the text is selected

Scenario: Selecting text with the keyboard.
  When the user selects text with the keyboard
  Then the text is selected

Scenario: Selecting text backwards with the keyboard.
  When the user selects text backwards with the keyboard
  Then the text is selected

Scenario: Clicking in the editor's scrollbar.
  When the user resizes the window so that the editor pane will be offscreen
  And the user scrolls the window down so that the editor's top is at the top of the window
  And the user clicks on the editor's scrollbar so that the click does not move the editor's contents
  Then the window's contents does not move

Scenario: Scrolling moves the caret.
  When the user selects text
  And the user scrolls the editor pane down
  Then the caret moves up relative to the browser window.

Scenario: Selecting text and ending on an element label.
  When the user selects text and ends on an element label
  Then the text is selected
  And no label is selected

Scenario: Bringing up the context menu on an element label selects the element.
  When the user uses the mouse to bring up the context menu on the start label of an element
  Then the label of the element that has the context menu is selected.

Scenario: Bringing up the context menu on an element label selects after another element has been selected selects the element that has the context menu.
  When the user clicks on the start label of an element
  And the user uses the mouse to bring up the context menu on the start label of another element
  Then the label of the element that has the context menu is selected.

@wip
Scenario: cut text
  When the user selects the whole text of an element
  And the user cuts
  Then the text is cut
