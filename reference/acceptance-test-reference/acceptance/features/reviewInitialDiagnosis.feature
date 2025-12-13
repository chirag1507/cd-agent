@features @review-initial-diagnosis
Feature: Review Initial Code Health Diagnosis
  As a manager, Talia,
  I want to review the initial code health diagnosis of a project
  So that I can understand its current state of technical debt.

  Background: An initial code health diagnosis is available for a project
    Given I am logged in as a manager "Talia"
    And I have connected my Git provider account
    And I have added a project named "legacy-project" for examination
    And an initial code health diagnosis for "legacy-project" is available

  Scenario: Project with code violations
    Given the "legacy-project" has code violations
    When I view the initial diagnosis for "legacy-project"
    Then I should see an overall code health score that is less than 100%
    And I should see a detailed list of code violations

  Scenario: Project with no code violations
    Given the "legacy-project" has no code violations
    When I view the initial diagnosis for "legacy-project"
    Then I should see an overall code health score of 100%
    And I should see a message indicating "No code violations found"
