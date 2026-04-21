Feature: KDS ticket lifecycle
  As kitchen or bar staff
  I want to advance tickets through preparation states
  So that customers are notified when their order is ready

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And I am authenticated as a volunteer
    And a confirmed order exists with a ticket in status "RECEIVED"

  @smoke
  Scenario: Staff advances a ticket to IN_PREPARATION
    When I PATCH ticket status to "IN_PREPARATION"
    Then the response status is 200
    And the ticket status is "IN_PREPARATION"
    And a "ticket:status_changed" SSE event is broadcast

  @integration-only
  Scenario: Backwards transition is rejected
    Given the ticket is in status "IN_PREPARATION"
    When I PATCH ticket status to "RECEIVED"
    Then the response status is 422

  @integration-only
  Scenario: All tickets ready triggers order:ready broadcast
    Given all tickets in the order are in status "RECEIVED"
    When I advance all tickets to "READY"
    Then a "order:ready" SSE event is broadcast to "aste-nagusia"

  @integration-only
  Scenario: KDS filters by counterType and status
    Given there are FOOD tickets in "RECEIVED" and DRINKS tickets in "IN_PREPARATION"
    When I request tickets for "aste-nagusia" with counterType "FOOD" and status "RECEIVED"
    Then only FOOD tickets in RECEIVED status are returned
