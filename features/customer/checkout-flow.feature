@e2e-only
Feature: Self-service checkout flow
  As a customer at the festival
  I want to add items to my cart and place an order
  So that I can pay at the counter without waiting in line

  @e2e @smoke
  Scenario: Customer adds a product and the cart bar appears
    Given I navigate to "/eu/aste-nagusia-2026"
    When I add the first available product to the cart
    Then the cart bar is visible with a checkout link
    And there are no JavaScript errors in the console
    When I take a screenshot "08-order-checkout-mobile"

  @e2e
  Scenario: Product sheet opens when a product card is clicked
    Given I navigate to "/eu/aste-nagusia-2026"
    When I click the first available product card
    And there are no JavaScript errors in the console
    Then I take a screenshot "13-product-selection-mobile"

  @e2e
  Scenario: Cart page shows items before order is submitted
    Given I navigate to "/eu/aste-nagusia-2026"
    When I add the first available product to the cart
    And I proceed to checkout
    And there are no JavaScript errors in the console
    Then I take a screenshot "14-cart-mobile"

  @e2e
  Scenario: Customer completes checkout with cash payment and sees order confirmation
    Given I navigate to "/eu/aste-nagusia-2026"
    When I add the first available product to the cart
    And I proceed to checkout
    And I fill in customer name "Ane"
    And I submit the order
    Then I am on the order confirmation or status page
    And there are no JavaScript errors in the console
    When I take a screenshot "09-order-confirmed-cash"
