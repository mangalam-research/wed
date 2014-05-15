Feature: context menus

# By "context menu" here we understand only "wed context menu", not
# the default browser context menu.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.
  And a context menu is not visible

Scenario: bringing up the context menu with the mouse on a placeholder.
  When the user uses the mouse to bring up the context menu on a placeholder
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu with the mouse on the start label of the top element.
  When the user uses the mouse to bring up the context menu on the start label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu with the mouse on the end label of the top element.
  When the user uses the mouse to bring up the context menu on the end label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu with the mouse on the start label of an element.
  When the user uses the mouse to bring up the context menu on the start label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements before the selected element

Scenario: bringing up the context menu with the mouse on the end label of an element.
  When the user uses the mouse to bring up the context menu on the end label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements after the selected element

Scenario: bringing up the context menu with the mouse on text.
  When the user uses the mouse to bring up the context menu on text
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for inserting new elements

Scenario: bringing up a context menu outside wed does nothing wed-related.
  When the user uses the mouse to bring up a context menu outside wed
  Then a context menu is not visible

Scenario: clicking outside the context menu makes it disappear.
  Given that a context menu is open
  When the user clicks outside the context menu
  Then a context menu is not visible

Scenario: clicking an option of the context menu makes it disappear.
  Given that a context menu is open
  When the user clicks the first context menu option
  Then a context menu is not visible

Scenario: bringing up the context menu with the mouse when the main editor pane is scrolled off screen
  When the user resizes the window so that the editor pane has a vertical scrollbar
  And the user scrolls the window down by 20
  And the user uses the mouse to bring up the context menu on a placeholder
  Then a context menu is visible close to where the user invoked it

Scenario: bringing up the context menu with the keyboard when the main editor pane is scrolled off screen
  When the user resizes the window so that the editor pane has a vertical scrollbar
  And the user clicks on a placeholder that will serve to bring up a context menu
  And the user scrolls the window completely down
  And the user uses the keyboard to bring up the context menu
  Then a context menu is visible close to where the user invoked it

Scenario: closing the context menu with the ESC key
  When the user uses the keyboard to bring up the context menu on text
  Then a context menu is visible close to where the user invoked it
  When the user types ESCAPE
  Then a context menu is not visible
  And the editor pane has focus

Scenario: bringing up the context menu next to the right side of the window
 When the user resizes the window so that the end titleStmt label is next to the right side of the window
 And the user brings up the context menu on the end titleStmt label
 Then a context menu is visible and completely inside the window

Scenario: bringing up the context menu on a malformed selection
  When the user selects a region that is malformed
  And the user brings up the context menu on the selection
  Then a context menu is not visible

Scenario: bringing up the context menu with the keyboard on an element's label
  When the user clicks on the start label of an element
  And the user uses the keyboard to bring up the context menu
  Then a context menu is visible close to where the user invoked it

Scenario: bringing up the context menu when there is no caret
  When the user uses the keyboard to bring up the context menu
  Then a context menu is not visible
