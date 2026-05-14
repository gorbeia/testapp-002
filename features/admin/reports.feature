Feature: Txosna daily and weekly reports
  As an association admin
  I want to view order summaries
  So that I can track revenue and product performance

  Background:
    Given I am authenticated as an ADMIN
    And the txosna "aste-nagusia" has 10 confirmed orders and 2 cancelled orders today

  @smoke
  Scenario: Admin views today's report
    When I request reports for "aste-nagusia" with period "today"
    Then the response status is 200
    And ordersTotal is 12
    And ordersConfirmed is 10
    And ordersCancelled is 2

  @integration-only
  Scenario: Revenue includes variant and modifier price deltas
    Given an order contains a product with a variant adding €1.50
    When I request the report
    Then revenue reflects the variant price delta

  @integration-only
  Scenario: Period=today filters out yesterday's orders
    Given there are 5 orders created yesterday
    When I request reports for "aste-nagusia" with period "today"
    Then ordersTotal does not include yesterday's orders

  @integration-only
  Scenario: Report response includes all required metrics
    When I request reports for "aste-nagusia" with period "today"
    Then the response status is 200
    And the report response includes all required metrics

  @integration-only
  Scenario: VOLUNTEER role is rejected with 403
    Given I am authenticated as a VOLUNTEER
    When I request reports for "aste-nagusia" with period "today"
    Then the response status is 403

  @integration-only
  Scenario: Period "week" includes orders from earlier in the week
    Given there are 3 confirmed orders created 6 days ago
    When I request reports for "aste-nagusia" with period "week"
    Then ordersTotal is 15
