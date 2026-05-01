@e2e-only
Feature: TicketBAI settings — BEZ tab
  As an association admin
  I want to configure TicketBAI in the Settings BEZ tab
  So that fiscal invoices are generated for every order

  Background:
    Given I am logged in as admin for "txosna-1"

  @e2e @smoke
  Scenario: BEZ tab renders with TicketBAI toggle and VAT types list
    When I navigate to "/eu/settings" and click the "BEZ" tab
    Then the page shows a "TicketBAI gaitu" toggle
    And the page shows a VAT types list
    And there are no JavaScript errors in the console
    When I take a screenshot "38-settings-bez-tab"

  @e2e
  Scenario: BEZ tab shows configuration panel when TicketBAI is enabled
    When I navigate to "/eu/settings" and click the "BEZ" tab
    And the "TicketBAI gaitu" toggle is already on
    Then the page shows a "Faktura seriea" input
    And the page shows a "Konexioa probatu" button
    And there are no JavaScript errors in the console
    When I take a screenshot "39-settings-bez-ticketbai-enabled"
