Feature: save
 Users want to be able to save.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: serializes namespaces properly
  When the user clicks on the start label of the first "p" element in "body"
  And the user hits the right arrow
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user saves
  Then the data saved is properly serialized
