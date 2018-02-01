Feature: The editor offers completion in places where it makes sense.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.
  And a context menu is not visible

Scenario: clicking in an attribute value that takes completions brings up the completion menu
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible

Scenario: moving the caret with the keyboard into attribute value that takes completions brings up the completion menu
  When the user clicks on the start label of an element which has an attribute value that takes completions
  And the user hits the right arrow
  Then a completion menu is visible

Scenario: moving the caret with the keyboard out of an attribute value that takes completions closes the completion menu
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user hits the left arrow
  Then a completion menu is not visible

Scenario: hitting the down arrow when the completion menu is up focuses the first element of the completion menu
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user hits the down arrow
  Then the first item of the completion menu is focused

Scenario: hitting enter when the completion menu is up inserts the text
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user types ENTER
  Then the completion text is inserted

Scenario: escape when the completion menu is up hides the menu
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user types ESCAPE
  Then a completion menu is not visible

Scenario: typing text when the completion menu is visible
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user types "i"
  Then the completion menu has only one option named "initial" and the prefix "i" is in bold

Scenario: exiting the completion menu restores focus to the document
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user hits the down arrow
  Then the first item of the completion menu is focused
  # We need one escape to deselect the item and another to leave the menu.
  When the user types ESCAPE
  And the user types ESCAPE
  Then a completion menu is not visible
  # This will work only if the document has regained focus.
  When the user types "i"
  Then a completion menu is visible
