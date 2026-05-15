@e2e-only
Feature: Admin pages accessibility
  As an association admin
  I want the core management pages to load without crashing
  So that I can always manage my txosna

  Background:
    Given I am logged in as admin for "aste-nagusia-2026"

  @e2e @smoke
  Scenario: Products page renders content
    When I navigate to the txosna products page
    Then the page renders at least one product
    And there are no JavaScript errors in the console

  @e2e @smoke
  Scenario: Settings page shows txosna status
    When I navigate to the txosna settings page
    Then the page shows the current txosna status
    And there are no JavaScript errors in the console
    When I take a screenshot "22-txosna-settings-general"

  @e2e
  Scenario: Settings payment tab renders
    When I navigate to "/settings" and click the "Ordainketa" tab
    Then the page loads successfully not redirected to login
    And there are no JavaScript errors in the console
    When I take a screenshot "23-txosna-settings-payment"

  @e2e
  Scenario: Settings orders tab renders
    When I navigate to "/settings" and click the "Eskaerak" tab
    Then the page loads successfully not redirected to login
    And there are no JavaScript errors in the console
    When I take a screenshot "24-txosna-settings-orders-v2"

  @e2e
  Scenario: Settings QR tab renders
    When I navigate to "/settings" and click the "QR kodea" tab
    Then the page loads successfully not redirected to login
    And there are no JavaScript errors in the console
    When I take a screenshot "25-txosna-settings-qr"

  @e2e
  Scenario: Txosna products page renders
    When I navigate to the txosna products page
    Then the page renders at least one product
    And there are no JavaScript errors in the console
    When I take a screenshot "26-txosna-products"

  @e2e @smoke
  Scenario: Reports page renders without error
    When I navigate to the txosna reports page
    Then the reports page renders without error
    And there are no JavaScript errors in the console
    When I take a screenshot "05-reports"

  @e2e @smoke
  Scenario: Volunteers page renders a list or empty state
    When I navigate to the txosna volunteers page
    Then the page shows a list or empty state
    And there are no JavaScript errors in the console
    When I take a screenshot "03-volunteers"

  @e2e
  Scenario: Menu management page renders product list
    Given I navigate to "/eu/menu"
    Then the page loads successfully not redirected to login
    And there are no JavaScript errors in the console
    When I take a screenshot "02-menu-management"

  @e2e
  Scenario: Association payment settings renders
    When I navigate to "/eu/settings" and click the "Ordainketa" tab
    Then the page loads successfully not redirected to login
    And there are no JavaScript errors in the console
    When I take a screenshot "27-association-payment-settings"
