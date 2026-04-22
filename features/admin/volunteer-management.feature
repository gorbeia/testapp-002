Feature: Volunteer management
  As an association admin
  I want to manage volunteers
  So that I can control who has access to the txosna tools

  Background:
    Given I am authenticated as an ADMIN for association "elkartea-1"

  @smoke
  Scenario: Admin creates a volunteer
    When I POST a new volunteer with email "berri@test.com" and password "secure123"
    Then the response status is 201
    And the stored volunteer has a hashed password (not plaintext)

  @integration-only
  Scenario: Volunteer cannot create other volunteers
    Given I am authenticated as a VOLUNTEER
    When I POST a new volunteer
    Then the response status is 403

  @integration-only
  Scenario: Admin soft-deletes a volunteer
    Given volunteer "v2" exists and is active
    When I DELETE volunteer "v2"
    Then volunteer "v2" has active set to false

  @integration-only
  Scenario: PIN authentication succeeds with correct PIN
    Given the txosna "aste-nagusia" exists and is OPEN
    And the txosna "aste-nagusia" has PIN "1234"
    When I POST to /auth/pin with slug "aste-nagusia" and pin "1234"
    Then the response status is 200
    And the body contains valid: true

  @integration-only
  Scenario: Wrong PIN returns invalid without leaking status
    Given the txosna "aste-nagusia" exists and is OPEN
    And the txosna "aste-nagusia" has PIN "1234"
    When I POST to /auth/pin with slug "aste-nagusia" and pin "0000"
    Then the response status is 200
    And the body contains valid: false
