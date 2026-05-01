@e2e-only
Feature: Public order board
  As anyone at the festival
  I want to see the live order board on a large screen
  So that I can check if my order is ready

  @e2e @smoke
  Scenario: Board page loads with ready and in-preparation columns
    Given I navigate to "/eu/aste-nagusia-2026/board"
    Then the page shows a "PREST" section
    And there are no JavaScript errors in the console
    When I take a screenshot "10-order-board-tv"
