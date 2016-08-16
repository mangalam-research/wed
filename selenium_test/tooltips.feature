# As of 2.41.0 this fails on Windows in FF.
# See: https://code.google.com/p/selenium/issues/detail?id=7249
@not.with_platform_browser=win,ff
Feature: tooltips are displayed on labels

Background: a simple document.
  Given a document with tooltips on
  And there are no tooltips

Scenario: a tooltip comes up when the user moves the mouse on a start label
  When the user moves the mouse over a start label
  Then a tooltip comes up

Scenario: a tooltip disappears when the user moves the mouse off of a start label
  When the user moves the mouse over a start label
  Then a tooltip comes up
  When the user moves the mouse off the start label
  Then there are no tooltips

Scenario: a tooltip disappears when the user types ESCAPE
  When the user moves the mouse over a start label
  Then a tooltip comes up
  When the user types ESCAPE
  Then there are no tooltips

Scenario: a tooltip disappears when the user deletes an element that had a tooltip
  When the user moves the mouse over a start label
  Then a tooltip comes up
  When the user clicks
  And the user types DELETE
  Then there are no tooltips

Scenario: a tooltip disappears when the user modifies text nodes
  When the user clicks on text
  And the user moves the mouse over a start label
  Then a tooltip comes up
  When the user types "a"
  Then there are no tooltips
