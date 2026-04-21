Feature: Counter order creation
  As a volunteer at the counter
  I want to create orders on behalf of customers
  So that their food and drink are prepared immediately

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And I am authenticated as a volunteer

  @smoke
  Scenario: Volunteer creates a counter order
    When I submit a COUNTER order for "aste-nagusia" with:
      | customerName | Gorka  |
      | paymentMethod| CASH   |
      | productId    | prod-1 |
      | quantity     | 2      |
    Then the response status is 201
    And the order status is "CONFIRMED"
    And the order has an order number
    And a "order:created" SSE event is broadcast to "aste-nagusia"

  @integration-only
  Scenario: Order is rejected when txosna is PAUSED
    Given the txosna "aste-nagusia" is PAUSED
    When I submit a COUNTER order for "aste-nagusia"
    Then the response status is 409

  @integration-only
  Scenario: Order is rejected for a sold-out product
    Given product "prod-1" has soldOut set to true
    When I submit a COUNTER order for "aste-nagusia" with product "prod-1"
    Then the response status is 422

  @integration-only
  Scenario: Food and drinks are split into separate tickets
    When I submit a COUNTER order with one food product and one drinks product
    Then the order has 2 tickets
    And one ticket has counterType "FOOD"
    And one ticket has counterType "DRINKS"

  @integration-only
  Scenario: Order numbers are sequential and unique per txosna
    When I submit 2 COUNTER orders for "aste-nagusia"
    Then the second order has an order number greater than the first
