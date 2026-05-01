@e2e-only
Feature: Customer order status page
  As a customer
  I want to view my order status in a browser
  So that I know when to collect my food

  @e2e @smoke
  Scenario: Order status page renders for a known order
    Given I navigate to "/eu/order/order-1"
    Then the page shows an order number
    And the page shows progress steps including "Jasota"
    And there are no JavaScript errors in the console
    When I take a screenshot "41-order-status-fiscal-invoice"

  @e2e
  Scenario: TicketBAI invoice section appears on order with invoice
    Given I navigate to "/eu/order/order-1"
    Then the page shows a "Txartel argia" section
    And there are no JavaScript errors in the console
