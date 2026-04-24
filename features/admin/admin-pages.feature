Feature: Admin pages accessibility
  As an association admin
  I want the core management pages to load without crashing
  So that I can always manage my txosna

  Background:
    Given I am logged in as admin for "aste-nagusia-2026"

  @e2e @smoke
  Scenario: Products page renders content
    When I navigate to the txosna products page
    Then the page renders at least one product
    And there are no JavaScript errors in the console

  @e2e @smoke
  Scenario: Settings page shows txosna status
    When I navigate to the txosna settings page
    Then the page shows the current txosna status
    And there are no JavaScript errors in the console

  @e2e @smoke
  Scenario: Reports page renders without error
    When I navigate to the txosna reports page
    Then the reports page renders without error
    And there are no JavaScript errors in the console

  @e2e @smoke
  Scenario: Volunteers page renders a list or empty state
    When I navigate to the txosna volunteers page
    Then the page shows a list or empty state
    And there are no JavaScript errors in the console
