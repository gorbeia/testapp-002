@e2e-only
Feature: Food counter screen
  As a volunteer in food counter mode
  I want to manage orders and payments at the food counter
  So that customers get their food quickly

  Background:
    Given I am on the food counter page via PIN "1234"

  @e2e @smoke
  Scenario: Food counter main view renders with three sections
    Then the page shows "ORDAINKETARIK GABE" section
    And the page shows a "+ Eskaera berria" button
    And there are no JavaScript errors in the console
    When I take a screenshot "12b-counter-main"

  @e2e
  Scenario: New order form opens when clicking the new order button
    When I click "+ Eskaera berria"
    Then the page shows "GEHITU PRODUKTUA" section
    And there are no JavaScript errors in the console
    When I take a screenshot "12b-counter-new-order"

  @e2e
  Scenario: Product configuration appears when a product is selected
    When I click "+ Eskaera berria"
    And I click the product "Burgerra" in the product grid
    Then the page shows a "Albokoa" section
    And there are no JavaScript errors in the console
    When I take a screenshot "12b-counter-product-config"

  @e2e
  Scenario: New order shows product summary after adding an item
    When I click "+ Eskaera berria"
    And I click the product "Burgerra" in the product grid
    And I select variant option "Patata frijituak"
    And I confirm adding the product
    Then the product appears in the new order summary
    And there are no JavaScript errors in the console
    When I take a screenshot "12b-counter-new-order-with-item"
