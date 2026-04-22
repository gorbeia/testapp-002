Feature: Online payment via Stripe
  As a customer
  I want to pay for my order online
  So that it is confirmed automatically

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And the payment provider is the FakePaymentProvider

  @smoke
  Scenario: Customer initiates an online payment session
    Given a PENDING_PAYMENT order "order-pay-1" exists
    When I POST to /payments/session with orderId "order-pay-1"
    Then the response status is 200
    And the response contains a redirectUrl
    And the order has a paymentSessionId stored

  @integration-only
  Scenario: Stripe webhook confirms order on successful checkout
    Given a PENDING_PAYMENT order "order-pay-1" exists
    And order "order-pay-1" has paymentSessionId "sess-abc"
    When I POST a Stripe webhook event "checkout.session.completed" for session "sess-abc"
    Then the order status is "CONFIRMED"
    And tickets are created for the order

  @integration-only
  Scenario: Stripe webhook cancels order on expired checkout
    Given a PENDING_PAYMENT order "order-pay-1" exists
    And order "order-pay-1" has paymentSessionId "sess-abc"
    When I POST a Stripe webhook event "checkout.session.expired" for session "sess-abc"
    Then the order status is "CANCELLED"
    And the cancellation reason is "TIMEOUT"

  @integration-only
  Scenario: Webhook with invalid signature is rejected
    When I POST a Stripe webhook with an invalid stripe-signature header
    Then the response status is 400

  @e2e @smoke @wip
  Scenario: Customer pays online and sees confirmation
    Given the txosna "aste-nagusia" is open
    When I navigate to the menu and place an order with online payment
    Then I am redirected to the payment page
    And after payment the order status page shows "CONFIRMED"
