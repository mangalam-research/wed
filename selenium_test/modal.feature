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

Scenario: resizing a resizable modal more than its maximum height
  Given the user has brought up a resizable modal
  And the modal has a max height of 100px
  Then the user resizes the height by 200px
  And a modal is visible
