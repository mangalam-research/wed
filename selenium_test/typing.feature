Feature: typing keys


Scenario: deleting all text letter by letter in an element.
  Given a document containing a top level element, a p element, and text.
  When the user deletes all text letter by letter in an element
  Then a placeholder is present in the element

Scenario: inserting text in an empty element.
  Given a document containing a top level element, a p element, and text.
  And that the user has deleted all the text in an element
  When the user types "A"
  Then "A" is in the text

#
# This just does not work
#
# Scenario: turning on an input method.
#   When the user clicks on text that does not contain "A"
#   And the user types "A"
#   And the user turns on the input method
#   Then whatever
#

Scenario: typing in already existing text
  Given a document containing a top level element, a p element, and text.
  When the user clicks on text that does not contain "A"
  And the user types "A"
  Then "A" is in the text

Scenario: moving from an element label and typing
  Given a document containing a top level element, a p element, and text.
  When the user clicks on the start label of an element that does not contain "A"
  And the user hits the right arrow
  And the user types "A"
  Then "A" is in the text

Scenario: moving from an element's end label and deleting
  Given a document containing a top level element, a p element, and text.
  When the user clicks on the end label of an element
  And the user hits the left arrow
  And the user types BACKSPACE
  Then the last letter of the element's text is deleted

Scenario: typing text without caret does not crash
  Given a document containing a top level element, a p element, and text.
  When the user types "A"

Scenario: typing text that triggers an input trigger
  Given a document without "hi"
  When the user clicks on the start label of the first "p" element in "body"
  And the user hits the right arrow
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user types "A;B"
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@fails_if:osx
Scenario: pasting text that triggers an input trigger
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user pastes
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@fails_if:osx
Scenario: pasting text that triggers an input trigger outside an element that should trigger it
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  And the user pastes
  Then the first paragraph in body has the text "A;B"
