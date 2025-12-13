Feature: Add Project from Git Provider
  As a user,
  I want to set a project by selecting a repository from Git Provider,
  So that I can admit for monitoring.

  Background:
    Given the user has logged in
    And the user has successfully connected to their Git Provider

  @ui
  Scenario Outline: A new user with repositories logs in for the first time and creates a project
    Given the user has not created a project before
    And the user has at least one repository in their Git Provider
    And navigates to project
    When the user selects the <repository>
    And the user can create the project with project name and description following details
      | project_name | <project_name> |
      | description  | <description>  |
    Then the project should be created successfully
    And user should be able to see project with <project_name>

    Examples:
      | repository    | project_name | description                              |
      | shopping-cart | Shopping     | E-commerce shopping cart microservice    |
      | user-service  | User         | Authentication and authorization service |

  @ui
  Scenario: No repositories are available for the user
    Given the user has not created a project before
    And the user has no repositories in their Git provider account
    And navigates to project dashboard
    When attempt to add project
    Then the system should display a message indicating "No repositories found"

  @ui
  Scenario Outline: User attempts to create a project with missing details
    Given the user has not created a project before
    And the user has at least one repository in their Git Provider
    And navigates to project dashboard
    When attempt to add project
    When a new user attempts to add Project
      | repository   | <repository>   |
      | project_name | <project_name> |
      | description  | <description>  |
    Then the user should be notified with error message
      | error_message | <error_message> |

    Examples:
      | Test cases              | repository    | project_name | description      | error_message                 |
      | Blank Project Name      | shopping-cart |              |                  | Project name cannot be empty. |
      | repository not selected |               | test project | test description | Please select a repository.   |

  @ui
  Scenario: Prevent creation of a project with a duplicate name
    Given a project named "Existing_Project" already exists
    And navigates to project dashboard
    When the user attempts to add project with same name
    Then I should receive an error message indicating "Project with this name already exists"
    And the project should not be created

  @ui
  Scenario: GitHub API is unavailable when a user add project
    Given the user has not created a project before
    And the external GitHub API is not responding
    When the user attempts to add project
    And attempt to add project
    Then the system should display an error message "Failed to retrieve user repositories"
