Feature: getting help

Scenario: bringing up the HELP dialog
  Given a document containing a top level element, a p element, and text.
  When the user types F1
  Then a help dialog is visible
  When the user clicks the help link in the dialog
  Then the help opens in a new tab
