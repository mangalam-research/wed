Feature: transforming the XML structure.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: choice for wrapping elements
  When the user selects text
  And the user brings up the context menu on the selection
  Then a context menu is visible close to where the user invoked it
  And the context menu contains choices for wrapping text in new elements.

Scenario: wrapping the selected text
  Given that the user has brought up the context menu over a selection
  When the user clicks a choice for wrapping text in new elements
  Then the selection is wrapped in a new element.

# This test fails on Selenium 2.35.0, using FF 22. Why??? Note that
# the failure cannot be replicated manually. It does not seem to be a
# timeout issue.
Scenario: creating an element before
  Given that the user has brought up the context menu over the start label of an element
  When the user clicks a choice for creating an element before the selected element
  Then a new element is inserted before the selected element.

Scenario: creating an element after
  Given that the user has brought up the context menu over the end label of an element
  When the user clicks a choice for creating an element after the selected element
  Then a new element is inserted after the selected element.
