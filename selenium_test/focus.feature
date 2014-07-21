Feature: focus
 Users want the editor's focus to be managed.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: losing and recovering the selection when focus is lost and recovered
  When the user selects text with the mouse
  Then the text is selected
  When the user scrolls the editor pane completely down
  And the user opens a new window
  And the user goes back to the initial window
  Then the selection is the same as before the focus was lost
  And the editor pane did not scroll

Scenario: losing and recovering the caret when focus is lost and recovered
  When the user selects text with the mouse
  Then the text is selected
  When the user scrolls the editor pane completely down
  And the user opens a new window
  And the user goes back to the initial window
  Then the caret is at the last position before the focus was lost
  And the editor pane did not scroll

Scenario: scrolling position when focus is lost and recovered
  When the user clicks on text that does not contain "A"
  And the user scrolls the editor pane completely down
  And the user opens a new window
  And the user goes back to the initial window
  Then the caret is at the last position before the focus was lost
  And the editor pane did not scroll

Scenario: typing text after recovering focus
  When the user clicks on text that does not contain "A"
  And the user opens a new window
  And the user goes back to the initial window
  And the user types "A"
  Then "A" is in the text

Scenario: clicking in an element excluded from blur
  When the user clicks on text that does not contain "A"
  And the user clicks in an element excluded from blur
  And the user types "A"
  Then "A" is in the text
