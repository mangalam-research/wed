Feature: caret
 Users want a caret indicating where they are editing.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

  Scenario: Clicking on an element's label.
    When the user clicks on an element's label
    Then the label changes to show it is selected
    And the caret disappears

  Scenario: Selecting text.
    When the user selects text with the mouse
    Then the text is selected

  Scenario: Selecting text backwards.
    When the user selects text backwards with the mouse
    Then the text is selected
