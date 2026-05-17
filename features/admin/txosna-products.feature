Feature: Txosna product listing
  As an association admin
  I want to see my association's full product catalog on each txosna's management page
  So that I can configure per-txosna availability and price overrides

  Background:
    Given I am authenticated as an ADMIN

  @smoke
  Scenario: Association products appear on the txosna product page
    When I request the product list for txosna "txosna-1"
    Then the response status is 200
    And the response contains at least 1 category with nested products

  @integration-only
  Scenario: Each product includes txosna-specific configuration data
    When I request the product list for txosna "txosna-1"
    Then the response status is 200
    And each product in the response has a txosnaProduct field

  @integration-only
  Scenario: Products are visible on every txosna that belongs to the association
    When I request the product list for txosna "txosna-2"
    Then the response status is 200
    And the response contains at least 1 category with nested products

  @integration-only
  Scenario: Admin cannot access products of a txosna from another association
    Given I am authenticated as an ADMIN for association "assoc-2"
    When I request the product list for txosna "txosna-1"
    Then the response status is 404
