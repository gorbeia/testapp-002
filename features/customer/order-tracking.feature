@e2e-only
Feature: Order tracking by verification code
  As a customer
  I want to look up my order by entering a short code
  So that I can track my order without logging in

  @e2e @smoke
  Scenario: Track entry page renders with code input and submit button
    Given I navigate to "/eu/aste-nagusia-2026/track"
    Then the page shows a text input for the tracking code
    And there are no JavaScript errors in the console
    When I take a screenshot "38-track-entry-mobile"

  @e2e
  Scenario: Entering wrong code shows an error message
    Given I navigate to "/eu/aste-nagusia-2026/track"
    When I enter tracking code "ZZ-0000" and submit
    Then the page shows a "Koderik ez da aurkitu" section
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Entering correct code shows the order status
    Given I navigate to "/eu/aste-nagusia-2026/track"
    When I enter tracking code "JO42" and submit
    Then I am on the tracking status page for code "JO42"
    And the page shows per-ticket status
    And there are no JavaScript errors in the console
    When I take a screenshot "39-track-status-mobile"

  @e2e
  Scenario: Tracking status page shows TicketBAI invoice section
    Given I navigate to "/eu/aste-nagusia-2026/track/JO42"
    Then the page shows a "Txartel argia" section with invoice reference
    And there are no JavaScript errors in the console
    When I take a screenshot "43-track-status-with-invoice"
