@e2e-only
Feature: Status overview screen
  As a volunteer
  I want to see a live snapshot of txosna operations
  So that I can understand the current state at a glance

  @e2e @smoke
  Scenario: Overview page renders with stat cards and txosna status
    Given I am on the overview page via PIN "1234"
    Then the page shows a stat card labelled "Itxaroten"
    And the page shows a stat card labelled "Prestatzen"
    And the page shows a txosna status block
    And there are no JavaScript errors in the console
