Feature: modals

Background: a simple document.
  Given a document containing a top level element, a p element, and text.
  And a modal is not visible

Scenario: dragging a draggable modal
  Given the user has brought up a draggable modal
  Then the user can drag the modal

Scenario: resizing a resizable modal
  Given the user has brought up a resizable modal
  Then the user can resize the modal
