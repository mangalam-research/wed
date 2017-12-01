Feature: The editor offers a replacement menu where it makes sense.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.
  And a context menu is not visible

# This also tests the proper working of the down arrow.
Scenario: hitting enter when the replacement menu is up replaces the text
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user types ENTER
  Then the completion text is inserted
  When the user brings up the replacement menu
  Then a replacement menu is visible
  When the user hits the down arrow
  Then the first item of the replacement menu is focused
  When the user hits the down arrow
  And the user types ENTER
  Then the text is replaced with the selected replacement menu item
  And a replacement menu is not visible

Scenario: escape hides the menu and restores focus to the document
  When the user clicks on an attribute value that takes completions
  Then a completion menu is visible
  When the user types ESCAPE
  Then a completion menu is not visible
  When the user brings up the replacement menu
  Then a replacement menu is visible
  When the user hits the down arrow
  Then the first item of the replacement menu is focused
  When the user types ESCAPE
  Then a replacement menu is not visible
  # This will work only if the document has regained focus.
  When the user types "i"
  Then a completion menu is visible
