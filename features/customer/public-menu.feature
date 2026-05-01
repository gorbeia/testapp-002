@e2e-only
Feature: Public txosna menu
  As a customer
  I want to browse the txosna menu in a browser
  So that I can see what food and drinks are available

  @e2e @smoke
  Scenario: Menu page loads with txosna name and status badge
    Given I navigate to "/eu/aste-nagusia-2026"
    Then the page shows txosna name "Aste Nagusia 2026"
    And the page shows a status badge "Irekita"
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Menu has food and drinks category tabs
    Given I navigate to "/eu/aste-nagusia-2026"
    Then the menu shows a category tab for food
    And the menu shows a category tab for drinks
    When I take a screenshot "06-customer-menu-mobile"
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Product cards appear in the active category
    Given I navigate to "/eu/aste-nagusia-2026"
    Then at least one product card is visible
    And each visible product card shows a name and price
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Switching category tabs shows products
    Given I navigate to "/eu/aste-nagusia-2026"
    When I click the drinks category tab
    Then at least one product card is visible
    And there are no JavaScript errors in the console
