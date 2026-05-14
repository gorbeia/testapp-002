Feature: TicketBAI invoice issuance
  As an association admin
  I want invoices to be issued automatically for confirmed orders
  So that fiscal compliance is maintained

  Background:
    Given I am authenticated as an ADMIN
    And TicketBAI is enabled for association "assoc-1"
    And TicketBAI config for "assoc-1" has series "TB" and providerType "MOCK"

  @smoke
  Scenario: TicketBAI invoice is issued for a confirmed order
    When I issue a TicketBAI invoice for the first order of txosna "txosna-1"
    Then a TicketBAI invoice exists for that order
    And the invoice series is "TB"
    And the invoice qrUrl starts with "https://tbai.eus/qr"

  @integration-only
  Scenario: Invoice numbers increment for sequential orders
    When I issue TicketBAI invoices for 2 orders of txosna "txosna-1"
    Then the invoice numbers are 1 and 2

  @integration-only
  Scenario: Each invoice chains to the previous one via a unique chainId
    When I issue TicketBAI invoices for 2 orders of txosna "txosna-1"
    Then the two invoices have different chainIds
