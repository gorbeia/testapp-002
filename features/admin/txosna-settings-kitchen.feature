@e2e-only
Feature: Txosna settings — Kitchen posts tab
  As an association admin
  I want to configure kitchen posts in the txosna settings
  So that volunteers are routed to their station

  Background:
    Given I am logged in as admin for "txosna-1"

  @e2e @smoke
  Scenario: Kitchen tab renders with existing posts and add form
    When I navigate to "/settings" and click the "Sukaldea" tab
    Then the page shows kitchen posts "plantxa" and "muntaia"
    And there are no JavaScript errors in the console
    When I take a screenshot "35-txosna-settings-kitchen-posts"
