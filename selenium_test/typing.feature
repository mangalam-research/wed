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
  # This step is that our scenario does not start typing before the hi
  # element is inserted.
  Then the caret is in the first "hi" element
  When the user types "A;B"
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@not.with_platform=osx
Scenario: pasting text that triggers an input trigger
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user pastes
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@not.with_platform=osx
Scenario: pasting text that triggers an input trigger outside an element that should trigger it
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the first paragraph in body has the text "A;B"

# Selenium for OSX just does not allow us to paste.
@not.with_platform=osx
# IE does not allow us to get the contents of the clipboard as HTML.
@not.with_browser=ie
Scenario: pasting XML
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole contents of the first paragraph in "body"
  And the user cuts
  And the user clicks on the end label of the last paragraph
  And the user hits the right arrow
  And the user brings up the context menu
  And the user clicks a choice for creating a new p
  And the user pastes
  Then the text is pasted into the new paragraph

Scenario: overwriting a selection
  Given a document containing a top level element, a p element, and text.
  When the user selects the "bc" of the first title
  And the user types "X"
  Then "aXd" is in the text

Scenario: typing DELETE when a selection is in effect
  Given a document containing a top level element, a p element, and text.
  When the user selects the "bc" of the first title
  And the user types DELETE
  Then "ad" is in the text

Scenario: typing BACKSPACE when a selection is in effect
  Given a document containing a top level element, a p element, and text.
  When the user selects the "bc" of the first title
  And the user types BACKSPACE
  Then "ad" is in the text

Scenario: typing ESCAPE does not result in a text insertion
  Given a document containing a top level element, a p element, and text.
  And that the user has deleted all the text in an element
  When the user types ESCAPE
  Then ESCAPE is not in the text
