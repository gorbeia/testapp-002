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

  @integration-only
  Scenario: A product enabled in the txosna management page appears in the customer catalog
    Given product "enabled-prod" is enabled for txosna "txosna-1"
    When I request the catalog for "aste-nagusia-2026"
    Then product "enabled-prod" appears in the catalog response

  @integration-only
  Scenario: A product disabled in the txosna management page is excluded from the customer catalog
    Given product "disabled-prod" is disabled for txosna "txosna-1"
    When I request the catalog for "aste-nagusia-2026"
    Then product "disabled-prod" is not in the response

  @integration-only
  Scenario: An enabled product is available in the food counter
    Given product "counter-prod" is enabled for txosna "txosna-1"
    When I request the catalog for "aste-nagusia-2026"
    Then product "counter-prod" is available in the food counter catalog
