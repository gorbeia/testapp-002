Feature: TicketBAI configuration API
  As an association admin
  I want to manage TicketBAI settings via the API
  So that fiscal invoice generation is correctly configured

  Background:
    Given I am authenticated as an ADMIN

  @smoke
  Scenario: GET returns default config when none has been saved
    When I GET TicketBAI config for association "assoc-1"
    Then the response status is 200
    And the TicketBAI config has providerType "MOCK" and series "TB"

  @integration-only
  Scenario: Admin saves a custom TicketBAI series
    When I PATCH TicketBAI config for association "assoc-1" with series "AGK"
    Then the response status is 200
    And the TicketBAI config series is "AGK"

  @integration-only
  Scenario: Connection test succeeds with MOCK provider
    Given TicketBAI config for "assoc-1" has series "TB" and providerType "MOCK"
    When I POST to test TicketBAI connection for association "assoc-1"
    Then the response status is 200
    And the response body has ok: true

  @integration-only
  Scenario: Admin from a different association is rejected
    Given I am authenticated as an ADMIN for association "other-assoc"
    When I GET TicketBAI config for association "assoc-1"
    Then the response status is 403
