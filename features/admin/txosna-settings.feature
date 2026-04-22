Feature: Txosna settings management
  As an association admin
  I want to configure my txosna
  So that I can control its availability and payment options

  Background:
    Given I am authenticated as an ADMIN
    And the txosna "aste-nagusia" exists

  @smoke
  Scenario: Admin sets txosna to PAUSED
    When I PATCH settings for "aste-nagusia" with status "PAUSED"
    Then the response status is 200
    And fetching the txosna returns status "PAUSED"
    And a "txosna:status_changed" SSE event is broadcast

  @integration-only
  Scenario: Volunteer cannot change settings
    Given I am authenticated as a VOLUNTEER
    When I PATCH settings for "aste-nagusia" with status "OPEN"
    Then the response status is 403

  @integration-only
  Scenario: Invalid status value is rejected
    When I PATCH settings for "aste-nagusia" with status "MAYBE"
    Then the response status is 422
