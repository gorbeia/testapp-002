@e2e-only
Feature: Drinks counter screen
  As a volunteer in drinks counter mode
  I want to manage drink orders efficiently
  So that customers get their drinks quickly

  @e2e @smoke
  Scenario: Drinks counter renders with expected sections
    Given I am on the drinks counter page via PIN "1234"
    Then the page shows "Edariak" heading
    And there are no JavaScript errors in the console
