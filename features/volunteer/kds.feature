@e2e-only
Feature: Kitchen Display System
  As a kitchen volunteer
  I want to see tickets filtered to my post
  So that I can prepare food in the right order

  @e2e @smoke
  Scenario: KDS loads and shows ticket status columns
    Given I am on the KDS page via PIN "1234" and post "plantxa"
    Then the page shows a "Jasota" section
    And there are no JavaScript errors in the console
    When I take a screenshot "33-kds-post-griddle"

  @e2e
  Scenario: KDS header shows the selected post name
    Given I am on the KDS page via PIN "1234" and post "plantxa"
    Then the page header contains "plantxa"
    And there are no JavaScript errors in the console
