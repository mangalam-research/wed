Feature: caret
 Users want a caret indicating where they are editing.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: Clicking moves the caret.
  When an element's label has been clicked
  And the user clicks on text
  Then the caret is at the last click's position.

Scenario: Clicking on an element's label.
  When the user clicks on an element's label
  Then the label changes to show it is selected
  And the caret is in the element name in the label

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

Scenario: Bringing up the context menu on an element label after another element has been selected selects the element that has the context menu.
  When the user clicks on the start label of an element
  And the user uses the mouse to bring up the context menu on the start label of another element
  Then the label of the element that has the context menu is selected.

Scenario: Cutting text.
  When the user selects the whole text of an element
  And the user cuts
  Then the text is cut

@not.with_platform=osx
Scenario: Pasting text.
  When the user selects the whole text of an element
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the text is pasted

Scenario: restoring the selection
  When the user selects text
  And the user brings up the context menu on the selection
  Then a context menu is visible close to where the user invoked it
  When the user types ESCAPE
  Then the selection is restored to what it was before the context menu appeared

Scenario: select text when there is no label
  # This step is needed to acquire focus in FF.
  When the user clicks on text
  And the user decreases the label visibility level
  And the user selects the "abcd" of the first title
  Then the text "abcd" is selected

Scenario: clicking on uneditable text
  When the user clicks on uneditable text whose parent does not contain "A"
  And the user types "A"
  Then the uneditable text's parent contains "A"

Scenario: selecting text on a label
  When the user selects text on an element's label
  Then no text is selected
  And the label changes to show it is selected

Scenario: selecting text on a phantom text
  When the user selects text on phantom text
  Then no text is selected

Scenario: clicking on a multi-line element
  Given there is a paragraph that spans multiple lines
  When the user clicks on the last character of the paragraph
  Then the caret is set to the last character of the paragraph

Scenario: clicking on a letter puts the caret next to it
  When the user clicks in the middle of a piece of text
  Then the caret is set next to the clicked location

Scenario: clicking on a gui control that contains only text
  When the user clicks on a gui control that contains only text
  # Then the editor does not crash...
