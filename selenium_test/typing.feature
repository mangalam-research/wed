Feature: typing keys

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: deleting all text letter by letter in an element.
  When the user deletes all text letter by letter in an element
  Then a placeholder is present in the element

@oldwip
Scenario: turning on an input method.
  When the user clicks on text that does not contain "A"
  And the user types "A"
  And the user turns on the input method
  Then whatever

Scenario: typing in already existing text
  When the user clicks on text that does not contain "A"
  And the user types "A"
  Then "A" is in the text

Scenario: moving from an element label and typing
  When the user clicks on the start label of an element that does not contain "A"
  And the user hits the right arrow
  And the user types "A"
  Then "A" is in the text
