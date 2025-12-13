Feature: Logout
  As a user
  I want to log out of Code Clinic
  So that my session ends and protected pages are inaccessible

  Background:
    Given the user has logged in

  @ui
  Scenario: User logs out successfully
    When the user logs out
    Then the user should be redirected to the signup page

  @ui
  Scenario: Logged-out user cannot access the dashboard
    Given the user has logged out
    When the user attempts to access the dashboard
    Then the user should be redirected to the signup page
