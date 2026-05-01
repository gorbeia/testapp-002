@e2e-only
Feature: TicketBAI invoice ledger
  As an association admin
  I want to view all issued fiscal invoices
  So that I have an audit trail independent of the external provider

  Background:
    Given I am logged in as admin for "txosna-1"

  @e2e @smoke
  Scenario: Invoice ledger renders with heading and invoice table
    When I navigate to "/eu/ticketbai"
    Then the page shows "TicketBAI Fakturak" heading
    And the page shows an invoice table with columns for invoice number, order, date, total, status
    And there are no JavaScript errors in the console
    When I take a screenshot "40-ticketbai-invoice-ledger"

  @e2e
  Scenario: Invoice table has at least one row with a TB- reference
    When I navigate to "/eu/ticketbai"
    Then the invoice table has at least one row
    And the first invoice shows a series reference starting with "TB-"
    And there are no JavaScript errors in the console
