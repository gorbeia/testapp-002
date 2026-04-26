Feature: Volunteer profile update
  As an association admin
  I want to update volunteer profiles
  So that I can manage names, roles, and account status

  Background:
    Given I am authenticated as an ADMIN for association "elkartea-1"
    # v2 = Gorka Zubia, role VOLUNTEER, active, belongs to assoc-1
    And volunteer "v2" exists and is active

  @smoke
  Scenario: Admin updates a volunteer's name
    When I PATCH volunteer "v2" with name "Ane Berritu"
    Then the response status is 200
    And the returned volunteer has name "Ane Berritu"

  @integration-only
  Scenario: Admin deactivates a volunteer
    When I PATCH volunteer "v2" with active false
    Then the response status is 200
    And volunteer "v2" has active set to false

  @integration-only
  Scenario: Admin changes a volunteer's role
    When I PATCH volunteer "v2" with role "ADMIN"
    Then the response status is 200
    And the returned volunteer has role "ADMIN"

  @integration-only
  Scenario: Non-admin cannot update a volunteer
    Given I am authenticated as a VOLUNTEER
    When I PATCH volunteer "v2" with name "Blocked"
    Then the response status is 403

  @integration-only
  Scenario: Updating a non-existent volunteer returns 404
    When I PATCH volunteer "does-not-exist" with name "Ghost"
    Then the response status is 404

  @integration-only
  Scenario: Admin cannot update a volunteer from another association
    Given I am authenticated as an ADMIN for association "other-assoc"
    When I PATCH volunteer "v2" with name "Hijacked"
    Then the response status is 403
