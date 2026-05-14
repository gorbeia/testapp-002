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

  @integration-only
  Scenario: GET settings returns the current settings without the PIN hash
    When I GET settings for "aste-nagusia"
    Then the response status is 200
    And the settings response has required fields
    And the response body does not include pinHash

  @integration-only
  Scenario: Admin updates waitMinutes
    When I PATCH settings for "aste-nagusia" with waitMinutes 20
    Then the response status is 200
    And the settings waitMinutes is 20

  @integration-only
  Scenario: Admin updates enabled payment methods
    When I PATCH settings for "aste-nagusia" with enabledPaymentMethods "CASH,ONLINE"
    Then the response status is 200
    And the settings enabledPaymentMethods includes "CASH"
    And the settings enabledPaymentMethods includes "ONLINE"

  @integration-only
  Scenario: Admin sets a new PIN which is stored as a bcrypt hash
    When I PATCH PIN for "aste-nagusia" with "9876"
    Then the response status is 204
    And the stored pinHash for "aste-nagusia" verifies against "9876"
    And the stored pinHash for "aste-nagusia" does not equal "9876"
