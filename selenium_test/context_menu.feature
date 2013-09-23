Feature: context menus

# By "context menu" here we understand only "wed context menu", not
# the default browser context menu.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: bringing up the context menu on a placeholder.
  When the user brings up the context menu on a placeholder
  Then a context menu appears
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu on the start label of the top element.
  When the user brings up the context menu on the start label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu on the end label of the top element.
  When the user brings up the context menu on the end label of the top element
  Then a context menu is not visible

Scenario: bringing up the context menu on the start label of an element.
  When the user brings up the context menu on the start label of an element
  Then a context menu appears
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu on the end label of an element.
  When the user brings up the context menu on the end label of an element
  Then a context menu appears
  And the context menu contains choices for inserting new elements

Scenario: bringing up the context menu on text.
  When the user brings up the context menu on text
  Then a context menu appears
  And the context menu contains choices for inserting new elements

Scenario: bringing up a context menu outside wed does nothing wed-related.
  When the user brings up a context menu outside wed
  Then a context menu is not visible

Scenario: clicking outside the context menu makes it disappear.
  Given that a context menu is open
  When the user clicks outside the context menu
  Then a context menu is not visible
