Feature: Online payment via Redsys
  As a customer
  I want to pay for my order using Redsys (bank TPV)
  So that it is confirmed automatically

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And the payment provider is the FakePaymentProvider
    And a Redsys payment provider is configured for the txosna

  @integration-only
  Scenario: Customer initiates a Redsys payment session
    Given a PENDING_PAYMENT order "order-redsys-1" exists
    When I POST to /payments/session with orderId "order-redsys-1" and providerType "REDSYS"
    Then the response status is 200
    And the response contains a redirectUrl
    And the order has a paymentSessionId stored

  @integration-only
  Scenario: Redsys notification confirms order on successful payment
    Given a PENDING_PAYMENT order "order-redsys-1" exists
    And order "order-redsys-1" has paymentSessionId "0042ABCD"
    When I POST a Redsys webhook notification for session "0042ABCD" with status "succeeded"
    Then the response status is 200
    And the order status is "CONFIRMED"
    And tickets are created for the order

  @integration-only
  Scenario: Redsys notification cancels order on failed payment
    Given a PENDING_PAYMENT order "order-redsys-1" exists
    And order "order-redsys-1" has paymentSessionId "0042ABCD"
    When I POST a Redsys webhook notification for session "0042ABCD" with status "cancelled"
    Then the response status is 200
    And the order status is "CANCELLED"
    And the cancellation reason is "TIMEOUT"

  @integration-only
  Scenario: Redsys webhook with invalid signature is rejected
    Given a PENDING_PAYMENT order "order-redsys-1" exists
    And order "order-redsys-1" has paymentSessionId "0042ABCD"
    When I POST a Redsys webhook notification with an invalid signature for session "0042ABCD"
    Then the response status is 400
