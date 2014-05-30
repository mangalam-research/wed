Feature: caret
 Users want the caret to be positioned intuitively.

Background: a complex document.
  Given a complex document without errors

Scenario: clicking to the right of a label puts the caret in a sensible position
  When the user clicks to the right of the last addrLine element
  Then the caret is in the last addrLine element
  When the user hits the right arrow
  Then the end label of the last addrLine element is selected

Scenario: clicking to the right of a label puts the caret in a sensible position
  When the user clicks to the right of the last address element
  Then the caret is in the last address element
  When the user hits the right arrow
  Then the end label of the last address element is selected

Scenario: clicking to the left of a label puts the caret in a sensible position
  When the user clicks to the left of the last addrLine element
  Then the caret is in the last address element
  When the user hits the right arrow
  Then the start label of the last addrLine element is selected
