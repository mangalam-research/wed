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
  # We purposely don't test position here. Other tests do it.
  Then a context menu is visible
  And the context menu does not contain choices for inserting new elements

Scenario: bringing up the context menu with the mouse on the end label of the top element.
  When the user uses the mouse to bring up the context menu on the end label of the top element
  # We purposely don't test position here. Other tests do it.
  Then a context menu is visible
  And the context menu does not contain choices for inserting new elements

Scenario: bringing up the context menu with the mouse on the start label of an element.
  When the user uses the mouse to bring up the context menu on the start label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements before the selected element

Scenario: bringing up the context menu with the mouse on the end label of an element.
  When the user uses the mouse to bring up the context menu on the end label of an element
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements after the selected element

Scenario: bringing up the context menu with the keyboard on the start label of an element.
  When the user clicks on the start label of an element
  And the user uses the keyboard to bring up the context menu
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements before the selected element

Scenario: bringing up the context menu with the keyboard on the end label of an element.
  When the user clicks on the end label of an element
  And the user uses the keyboard to bring up the context menu
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for creating elements after the selected element

Scenario: clicking on a menu item which appears outside the editor pane.
  When the user clicks on the end label of the last paragraph
  And the user uses the keyboard to bring up the context menu
  #
  # The menu will be moved up, so this will not be true:
  # > Then a context menu is visible close to where the user invoked it
  #
  # This next step is a precondition. If this step fails, then the
  # test has to be reworked to use a menu item that must appear under
  # the editor window.
  Then a choice for creating a new note after this element is below the editor pane
  When the user clicks a choice for creating a new note
  Then the caret is in the last "note" element

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
  When the user clicks a choice for creating a new hi
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
 When the user adds text to the title so that the titleStmt label is next to the right side of the window
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
  When the user clicks outside the editor pane
  And the user uses the keyboard to bring up the context menu
  Then a context menu is not visible

Scenario: selecting an option by hitting ENTER when there is no option focused
  When the user uses the mouse to bring up the context menu on a placeholder
  Then the first context menu option is "Element's documentation."
  When the user types ENTER
  Then a second window (or tab) is open

Scenario: filtering on operations that add content
  When the user uses the mouse to bring up the context menu on a placeholder
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others
  When the user clicks on the filter to show only options of kind "add"
  Then the context menu contains options of the kind "add"

Scenario: filtering on operations that delete content
  When the user uses the mouse to bring up the context menu on a placeholder
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others
  When the user clicks on the filter to show only options of kind "delete"
  Then the context menu contains options of the kind "delete"

Scenario: filtering on operations that unwrap content
  When the user uses the mouse to bring up the context menu on a placeholder
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others
  When the user clicks on the filter to show only options of kind "unwrap"
  Then the context menu contains options of the kind "unwrap"

Scenario: filtering on other operations
  When the user uses the mouse to bring up the context menu on a placeholder
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others
  When the user clicks on the filter to show only options of kind other
  Then the context menu contains options of the other kind

Scenario: filtering on operations that wrap content
  Given that the user has brought up the context menu over a selection
  Then the context menu contains options of the kinds "delete", "wrap", "unwrap" and others
  When the user clicks on the filter to show only options of kind "wrap"
  Then the context menu contains options of the kind "wrap"

Scenario: filtering on element names
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  Then the context menu contains more than one option
  When the user types "abbr"
  Then the context menu contains only the option "Create new abbr"

Scenario: filtering on operations for elements
  When the user brings up the context menu on the start label of an element
  And the context menu's filter field has focus
  Then the context menu contains options of the types "element", "attribute" and others
  When the user clicks on the filter to show only options of type "element"
  Then the context menu contains options of the type "element"

Scenario: filtering on operations for attributes
  When the user brings up the context menu on the start label of an element
  And the context menu's filter field has focus
  Then the context menu contains options of the types "element", "attribute" and others
  When the user clicks on the filter to show only options of type "attribute"
  Then the context menu contains options of the type "attribute"

Scenario: BACKSPACE removes letters from the text filter
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  Then the context menu contains more than one option
  When the user types "abbr"
  Then the context menu contains only the option "Create new abbr"
  When the user types BACKSPACE
  When the user types BACKSPACE
  When the user types BACKSPACE
  Then the context menu contains more than one option

Scenario: ESCAPE resets the text filtering
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  Then the context menu contains more than one option
  When the user types "abbr"
  Then the context menu contains only the option "Create new abbr"
  When the user types ESCAPE
  Then the context menu contains more than one option

Scenario: ESCAPE resets the kind filtering
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others
  When the user clicks on the filter to show only options of kind "add"
  Then the context menu contains options of the kind "add"
  When the user types ESCAPE
  Then the context menu contains options of the kinds "add", "delete", "unwrap" and others

Scenario: ESCAPE resets the type filtering
  When the user brings up the context menu on the start label of an element
  And the context menu's filter field has focus
  Then the context menu contains options of the types "element", "attribute" and others
  When the user clicks on the filter to show only options of type "attribute"
  Then the context menu contains options of the type "attribute"
  When the user types ESCAPE
  Then the context menu contains options of the types "element", "attribute" and others

Scenario: ESCAPE twice, when filtering, exits the menu
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  And the user clicks on the filter to show only options of kind "add"
  And the user types ESCAPE
  Then the context menu is visible
  When the user types ESCAPE
  Then the context menu is not visible

Scenario: filtering on element names by regular expression
  When the user uses the mouse to bring up the context menu on a placeholder
  And the context menu's filter field has focus
  Then the context menu is visible
  When the user types "hi"
  Then the context menu contains 3 options
  When the user types ESCAPE
  And the user types "^hi"
  Then the context menu contains only the option "Create new hi"
