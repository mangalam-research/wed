Feature: elements are labeled.

Background: a simple document.
  Given a document containing a top level element, a p element, and text
  And the label visiblity level is at 1.

Scenario: Decreasing the label visiblity level.
  When the user clicks on the start label of an element
  And decreases the label visibility level
  Then no labels are visible

Scenario: Increasing the label visiblity level.
  When the user clicks on the start label of an element
  And increases the label visibility level
  Then more labels are visible

Scenario: Increasing the label visibility level when a caret is set.
  When the user scrolls the editor pane completely down
  And clicks on the start label of the first "p" element in "body"
  And hits the right arrow
  And hits the right arrow
  And increases the label visibility level
  Then the caret is at the same position on the screen.
