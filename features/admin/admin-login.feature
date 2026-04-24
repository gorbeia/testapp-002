@e2e-only
Feature: Admin login
  As an association admin
  I want to log in through the two-step login flow
  So that I can access the txosna management dashboard

  @e2e @smoke
  Scenario: Admin logs in and reaches the txosna dashboard
    Given I navigate to "/login"
    And I select association "Erreka Gaztedi"
    When I log in as admin with email "amaia@elkartea.eus" and password "test1234"
    Then I am redirected to the txosna dashboard
    And the txosna list shows at least one txosna
    And there are no JavaScript errors in the console
