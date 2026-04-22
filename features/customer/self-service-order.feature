Feature: Self-service order
  As a customer at the festival
  I want to place my own order and pay with cash
  So that I can skip the queue at the counter

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Customer places a self-service order
    When I submit a SELF_SERVICE order for "aste-nagusia" with paymentMethod "CASH"
    Then the response status is 201
    And the order status is "PENDING_PAYMENT"
    And no tickets are created yet

  @integration-only
  Scenario: Volunteer confirms cash payment
    Given a PENDING_PAYMENT order exists
    And I am authenticated as a volunteer
    When I POST to confirm the order
    Then the response status is 200
    And the order status is "CONFIRMED"
    And tickets are created
    And a "order:confirmed" SSE event is broadcast

  @integration-only
  Scenario: Expired order cannot be confirmed
    Given a PENDING_PAYMENT order exists with expiresAt in the past
    And I am authenticated as a volunteer
    When I POST to confirm the order
    Then the response status is 409

  @integration-only
  Scenario: Order can be cancelled with a reason
    Given a PENDING_PAYMENT order exists
    When I POST to cancel the order with reason "CUSTOMER"
    Then the response status is 200
    And the order status is "CANCELLED"
    And the cancellation reason is "CUSTOMER"
    And a "order:cancelled" SSE event is broadcast to "aste-nagusia"

  @e2e @smoke @wip
  Scenario: Customer completes self-service order flow in browser
    Given the txosna "aste-nagusia" is open
    When I navigate to the menu for "aste-nagusia"
    And I add "Burgerra" to my cart
    And I fill in my name "Amaia" and submit the order
    Then I see the order confirmation page with an order number
