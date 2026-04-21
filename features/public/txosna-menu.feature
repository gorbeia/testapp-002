Feature: Public txosna menu
  As a customer
  I want to see the txosna menu and its status
  So that I can decide what to order

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Customer loads an open txosna
    When I request the txosna details for slug "aste-nagusia"
    Then the response status is 200
    And the response includes the txosna name and status "OPEN"

  @integration-only
  Scenario: Unknown slug returns 404
    When I request the txosna details for slug "does-not-exist"
    Then the response status is 404

  @smoke
  Scenario: Catalog groups products by category
    When I request the catalog for "aste-nagusia"
    Then the response contains at least 1 category with nested products

  @integration-only
  Scenario: Unavailable products are excluded from catalog
    Given product "prod-hidden" has available set to false
    When I request the catalog for "aste-nagusia"
    Then product "prod-hidden" is not in the response

  @integration-only
  Scenario: Sold-out products appear flagged
    Given product "prod-burger" has soldOut set to true
    When I request the catalog for "aste-nagusia"
    Then product "prod-burger" appears in the response with soldOut true
