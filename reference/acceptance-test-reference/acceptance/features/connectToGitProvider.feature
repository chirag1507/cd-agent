Feature: Connect Git Provider Account
  As a Tech Lead
  I want to connect my team's Git provider account to Code Clinic
  So that I can select repositories for TDD health analysis

  Background:
    Given Tech Lead Talia is registered
    And she is on the Git Provider Connect page

  @ui
  Scenario Outline: Tech Lead successfully connects team's Git provider account
    When she connects her team's <git_provider> account
    Then her Git provider connection should be established successfully

    Examples:
      | git_provider |
      | Github       |

  @ui
  Scenario Outline: Git provider returns an error during Tech Lead authorization
    When she attempts to connect her team's <git_provider> account but authorization fails
    Then her Git provider connection should not be established successfully

    Examples:
      | git_provider |
      | Github       |
