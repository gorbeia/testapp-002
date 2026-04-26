Feature: Order listing for txosna
  As kitchen or counter staff
  I want to query orders for a txosna with filters
  So that I can focus on the relevant orders for my station

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And I am authenticated as a volunteer

  @smoke
  Scenario: All orders for a txosna are returned
    Given 2 COUNTER orders exist for "aste-nagusia"
    When I GET orders for "aste-nagusia"
    Then the response status is 200
    And the response contains at least 2 orders

  @integration-only
  Scenario: Orders can be filtered by status
    Given a CONFIRMED order exists for "aste-nagusia"
    And a PENDING_PAYMENT order exists for "aste-nagusia"
    When I GET orders for "aste-nagusia" with status "CONFIRMED"
    Then the response status is 200
    And all returned orders have status "CONFIRMED"

  @integration-only
  Scenario: Orders can be filtered by channel
    Given a COUNTER order exists for "aste-nagusia"
    And a SELF_SERVICE order exists for "aste-nagusia"
    When I GET orders for "aste-nagusia" with channel "COUNTER"
    Then the response status is 200
    And all returned orders have channel "COUNTER"

  @integration-only
  Scenario: Expired PENDING_PAYMENT orders are auto-cancelled on listing
    Given a PENDING_PAYMENT order exists that expired 1 hour ago for "aste-nagusia"
    When I GET orders for "aste-nagusia"
    Then the response status is 200
    And no orders have status "PENDING_PAYMENT"
