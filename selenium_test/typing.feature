Feature: typing keys

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: deleting all text letter by letter in an element.
  When the user deletes all text letter by letter in an element
  Then a placeholder is present in the element
