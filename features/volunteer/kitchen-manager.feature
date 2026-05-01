@e2e-only
Feature: Kitchen manager coordinator view
  As a kitchen coordinator
  I want to see all orders across all posts
  So that I can keep track of the full kitchen state

  @e2e @smoke
  Scenario: Kitchen manager page renders with coordinator heading
    Given I am on the kitchen manager page via PIN "1234"
    Then the page shows "Kudeaketa" heading
    And there are no JavaScript errors in the console
    When I take a screenshot "34-kitchen-manager"
