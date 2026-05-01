@e2e-only
Feature: Pickup proof page
  As a customer
  I want to show my pickup proof to the volunteer
  So that I can collect my order

  @e2e @smoke
  Scenario: Proof page renders with order number and verification code
    Given I navigate to "/eu/order/order-1/proof"
    Then the page shows a large order number
    And the page shows a verification code in monospace
    And there are no JavaScript errors in the console
