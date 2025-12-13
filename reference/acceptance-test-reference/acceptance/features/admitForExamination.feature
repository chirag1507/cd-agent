Feature: Admit Project for Examination
  As a Tech Lead
  I want to admit an existing project for examination
  So that I can get a comprehensive code health assessment

  Background:
    Given the user has logged in
    And the user has successfully connected to their Git Provider

  @ui
  Scenario Outline: Successfully admit a project for examination
    Given she has a project named <project_name>
    And the examination service is available
    And navigates to project dashboard
    When she admits <project_name> for examination
    Then <project_name> should be under examination
    And she should see notification "Project admitted for monitoring"

    Examples:
      | project_name   |
      | legacy-project |
      | new-service    |
      | mobile-app     |

  @ui
  Scenario Outline: Tech Lead attempts to admit project already under examination
    Given she has a project named <project_name>
    And the examination service is available
    And navigates to project dashboard
    And she tries to add <project_name> for examination
    When she again try to add that under examination project
    Then she should see notification "Project is already under examination"

    Examples:
      | project_name   |
      | legacy-project |

  @ui
  Scenario Outline: Failed to admit project when examination service unavailable
    Given she has a project named <project_name>
    And the examination service is unavailable
    And navigates to project dashboard
    When she admits <project_name> for examination
    Then she should see notification "Service unavailable"

    Examples:
      | project_name   |
      | legacy-project |
