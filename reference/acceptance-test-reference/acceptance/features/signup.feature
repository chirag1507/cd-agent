Feature: Signup
  As a new user
  I want to sign up for Code Clinic using my GitHub account
  So that I can quickly start monitoring my team's code health

  Rule: A new user can register for an account

    Background:
      Given the authentication is available

    @ui
    Scenario Outline: Successful register after authenticating with GitHub
      Given I am a new user who has not yet registered
        | email | <email> |
      When I authenticate using my GitHub account
        | email | <email> |
      And I provide my registration details
        | first_name   | <first_name>   |
        | last_name    | <last_name>    |
        | email        | <email>        |
        | company_name | <company_name> |
        | company_role | <company_role> |
        | team_size    | <team_size>    |
      And I complete my registration
      Then my Code Clinic account should be created successfully

      Examples: User Profiles
        | email                                 | first_name | last_name | company_name        | company_role             | team_size |
        | harish.vaja@avestatechnologies.com    | Harish     | Vaja      | Avesta Technologies | Lead Engineer            | 1-5       |
        | rahul.lakhvara@avestatechnologies.com | Rahul      | Lakhvara  | Avesta Technologies | Engineering Manager      | 11-25     |
        | devin.mak@example.com                 | Devin      | Mak       | Startup Inc.        | Senior Software Engineer | 50-99     |
        | sam.nik@example.com                   | Sam        | Nik       | Indie Co            | Founder                  | 100+      |

    @ui
    Scenario Outline: Attempt to complete registration with missing information
      Given I am a new user who has not yet registered
        | email | <email> |
      When I authenticate using my GitHub account
        | email | <email> |
      And I provide my registration details
        | first_name   | <first_name>   |
        | last_name    | <last_name>    |
        | email        | <email>        |
        | company_name | <company_name> |
        | company_role | <company_role> |
        | team_size    | <team_size>    |
      And I attempt to complete my registration
      Then I should be notified with error message
        | error_message | <error_message> |
      And my Code Clinic account should not be created
        | email | <email> |

      Examples: Missing Required Fields
        | first_name | last_name | email                 | company_name | company_role  | team_size | error_message            |
        |            | Doe       | jane.doe1@example.com | ExampleCorp  | Lead Engineer | 1-5       | First name is required   |
        | Jane       |           | jane.doe2@example.com | ExampleCorp  | Lead Engineer | 1-5       | Last name is required    |
        | Jane       | Doe       | jane.doe3@example.com |              | Lead Engineer | 1-5       | Company name is required |
        | Jane       | Doe       | jane.doe4@example.com | ExampleCorp  |               | 1-5       | Role is required         |
        | Jane       | Doe       | jane.doe5@example.com | ExampleCorp  | Lead Engineer |           | Team size is required    |


    @ui
    Scenario: GitHub authentication fails
      When the GitHub authentication process fails
      Then I should be notified that authentication failed
      And I should not be able to access the Code Clinic platform

  Rule: An existing user can sign in to their account

    @ui
    Scenario: An existing user signs in via GitHub
      Given the authentication is available
      And user is already registered with following details:
        | first_name | last_name | email                | company_name | company_role | team_size |
        | Jane       | Doe       | jane.doe@example.com | ExampleCorp  | Tech Lead    | 1-5       |
      When I sign in using git provider
      Then I should be signed into my existing Code Clinic account
