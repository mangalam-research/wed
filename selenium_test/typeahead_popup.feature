Feature: context menus

# By "context menu" here we understand only "wed context menu", not
# the default browser context menu.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: typing ENTER
  Given that a typeahead popup is open
  When the user types "Test"
  And the user types ENTER
  Then the typeahead popup is not visible
  And the typeahead popup's action is performed

Scenario: clicking a choice
  Given that a typeahead popup is open
  When the user types "Test"
  And the user clicks the first typeahead choice
  Then the typeahead popup is not visible
  And the typeahead popup's action is performed

Scenario: closing the typeahead with the ESC key
  Given that a typeahead popup is open
  When the user types ESCAPE
  Then the typeahead popup is not visible
  And the typeahead popup's action is not performed

Scenario: clicking outside the typeahead
  Given that a typeahead popup is open
  When the user clicks outside the typeahead
  Then the typeahead popup is not visible
  And the typeahead popup's action is not performed

# This test fails due to OS X's idiotic default behavior of hiding
# scrollbars on scrollable items unless they are actually scrolled.
@not.with_platform=osx
Scenario: bringing up the typeahead popup next to the right side of the window
  When the user adds text to the title so that the titleStmt label is next to the right side of the window
  And the user opens the typeahead popup at the end of the title text
  And the user types "Test"
  # This also tests that the popup does not overflow vertically.
  Then the typeahead popup's choice list has a vertical scrollbar
  And the typeahead popup is visible and completely inside the window

Scenario: clicking on a completion which appears outside the editor pane.
  When the user clicks on the end label of the last paragraph
  And the user hits the left arrow
  And the user opens the typeahead popup
  # This next step is a precondition. If this step fails, then the
  # test has to be reworked to use a menu item that must appear under
  # the editor window.
  And the user types "Test"
  Then the typeahead popup overflows the editor pane
  And the typeahead popup is visible and completely inside the window
  When the user clicks the last visible completion
  Then the caret is in the last "p" element

Scenario: bringing up the typeahead on a selection prefills the field and shows suggestions
  When the user selects the whole text of the first title element
  And the user types BACKSPACE
  And the user types "Test"
  And the user selects the whole text of the first title element
  And the user opens the typeahead popup
  Then the typeahead popup shows suggestions

Scenario: typeahead losing focus
  Given that a typeahead popup is open
  When the user types "Test"
  Then the typeahead popup shows suggestions
  # This is not something a user can do but it serves the purpose of
  # making the typeahead input field lose its focus without being an
  # onerous operation, like opening a new tab.
  When the input field is focused
  Then the typeahead popup shows suggestions
