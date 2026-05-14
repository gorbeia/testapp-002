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
    Then the response status is 201
    And the order has 2 tickets
    And one ticket has counterType "FOOD"
    And one ticket has counterType "DRINKS"

  @integration-only
  Scenario: Order numbers are sequential and unique per txosna
    When I submit 2 COUNTER orders for "aste-nagusia"
    Then the second order has an order number greater than the first

  @integration-only
  Scenario: Food ticket has no kitchenPost when txosna has no posts configured
    When I submit a COUNTER order for "pintxo-txokoa" with product "prod-1"
    Then the response status is 201
    And the food ticket has kitchenPost null

  @integration-only
  Scenario: Food product with kitchenPost routes its ticket to that post
    When I submit a COUNTER order for "aste-nagusia-2026" with product "prod-1"
    Then the response status is 201
    And the food ticket has kitchenPost "plantxa"

  @integration-only
  Scenario: Variant with its own kitchenPost creates a second food ticket at that post
    When I submit a COUNTER order for "aste-nagusia-2026" with product "prod-1" and variant "vo-1"
    Then the response status is 201
    And there are 2 food tickets
    And the food tickets include kitchenPosts "plantxa" and "muntaia"

  @integration-only
  Scenario: Food product without kitchenPost creates a general ticket even when txosna has posts configured
    When I submit a COUNTER order for "aste-nagusia-2026" with product "prod-1b"
    Then the response status is 201
    And the food ticket has kitchenPost null
