Feature: Customer order status
  As a customer
  I want to check my order status
  So that I know when to collect my food

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Customer retrieves order by id
    Given a confirmed order exists with id "order-abc"
    When I request order "order-abc"
    Then the response status is 200
    And the response includes orderNumber and verificationCode

  @integration-only
  Scenario: Unknown order returns 404
    When I request order "order-does-not-exist"
    Then the response status is 404

  @integration-only
  Scenario: Wrong verification code returns 403
    Given an order exists with verificationCode "AB-1234"
    When I request the order by txosnaId, orderNumber, and verificationCode "ZZ-9999"
    Then the response status is 403
