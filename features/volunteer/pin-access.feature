@e2e-only
Feature: Volunteer PIN access
  As a volunteer
  I want to enter a PIN and select a mode
  So that I am taken to the correct operational screen

  Background:
    Given I navigate to "/eu/pin?slug=aste-nagusia-2026"

  @e2e @smoke
  Scenario: PIN screen shows four mode buttons and a keypad
    Then the page shows four mode buttons: "Janaria", "Edariak", "Sukaldea", "Kudeaketa"
    And the page shows a 4-digit keypad
    And there are no JavaScript errors in the console
    When I take a screenshot "30-pin-four-modes"

  @e2e
  Scenario: Selecting Kitchen mode highlights the button
    When I select pin mode "Sukaldea"
    Then the "Sukaldea" button appears selected
    And there are no JavaScript errors in the console
    When I take a screenshot "31-pin-kitchen-mode-selected"

  @e2e
  Scenario: Correct PIN in food mode navigates to food counter
    When I select pin mode "Janaria"
    And I enter PIN "1234"
    And I press the confirm button
    Then I am on the food counter page
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Correct PIN in drinks mode navigates to drinks counter
    When I select pin mode "Edariak"
    And I enter PIN "1234"
    And I press the confirm button
    Then I am on the drinks counter page
    And there are no JavaScript errors in the console

  @e2e
  Scenario: Correct PIN in kitchen mode shows post selection screen
    When I select pin mode "Sukaldea"
    And I enter PIN "1234"
    And I press the confirm button
    Then the page shows a post selection screen with "plantxa" and "muntaia"
    And there are no JavaScript errors in the console
    When I take a screenshot "32-pin-post-selection"

  @e2e
  Scenario: Wrong PIN shows error message
    When I select pin mode "Janaria"
    And I enter PIN "0000"
    And I press the confirm button
    Then the page shows "PIN okerra" error
    And there are no JavaScript errors in the console
