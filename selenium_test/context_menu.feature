Feature: context menus

# By "context menu" here we understand only "wed context menu", not
# the default browser context menu.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.
  And a context menu is not visible

Scenario: bringing up the context menu with a mouse on a placeholder.
  When the user uses the mouse to bring up the context menu on a placeholder
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu with a mouse on the start label of the top element.
  When the user uses the mouse to bring up the context menu on the start label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu with a mouse on the end label of the top element.
  When the user uses the mouse to bring up the context menu on the end label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu with a mouse on the start label of an element.
  When the user uses the mouse to bring up the context menu on the start label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu with a mouse on the end label of an element.
  When the user uses the mouse to bring up the context menu on the end label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu with a mouse on text.
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

Scenario: bringing up the context menu with a mouse when the main editor pane is scrolled off screen
  When the user resizes the window so that the editor pane has a vertical scrollbar
  And the user scrolls the editor pane down
  And the user uses the mouse to bring up the context menu on a placeholder
  Then a context menu is visible close to where the user invoked it

Scenario: bringing up the context menu with a keyboard when the main editor pane is scrolled off screen
  When the user resizes the window so that the editor pane has a vertical scrollbar
  And the user scrolls the editor pane down
  And the user uses the keyboard to bring up the context menu on a placeholder
  Then a context menu is visible close to where the user invoked it

Scenario: closing the context menu with the ESC key
  When the user uses the keyboard to bring up the context menu on text
  Then a context menu is visible close to where the user invoked it
  When the user types ESCAPE
  Then a context menu is not visible
  And the editor pane has focus
