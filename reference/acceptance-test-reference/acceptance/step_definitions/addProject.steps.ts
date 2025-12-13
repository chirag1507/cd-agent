import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('the user has logged in', async function () {
  if (!this.projectDSL && !this.authDSL && !this.gitProviderDSL) {
    throw new Error('DSL not initialized');
  }

  await this.authDSL.ensureAuthenticatedSession();
});

Given(
  'the user has successfully connected to their Git Provider',
  async function () {
    await this.gitProviderDSL.ensureConnected();
  }
);

Given('the user has not created a project before', async function () {
  await this.projectDSL.expectNoProjects();
});

Given(
  'the user has at least one repository in their Git Provider',
  async function () {
    await this.gitProviderDSL.verifyUserHasRepositories();
  }
);

When('the user selects the {word}', async function (repository: string) {
  await this.projectDSL.selectRepository(repository);
});

Then('the project should be created successfully', async function () {
  await this.projectDSL.expectCreated();
});

Then(
  /^user should be able to see project with (.*)$/,
  async function (projectName: string) {
    await this.projectDSL.expectVisible(projectName);
  }
);

When(
  'the user can create the project with project name and description following details',
  async function (table: DataTable) {
    const details = table.rowsHash();
    const projectName = details['project_name'];
    const description = details.description;
    await this.projectDSL.create(projectName, description);
  }
);

When('a new user attempts to add Project', async function (table: DataTable) {
  const details = table.rowsHash();
  const repository = details['repository'];
  const projectName = details['project_name'];
  const description = details.description;

  await this.projectDSL.tryCreate(repository, projectName, description);
});
Then(
  'the user should be notified with error message',
  async function (table: DataTable) {
    const details = table.rowsHash();
    const expectedErrorMessage = details['error_message'];

    const receivedErrorMessage =
      await this.projectDSL.getErrorMessage(expectedErrorMessage);
    expect(receivedErrorMessage).toBe(expectedErrorMessage);
  }
);

Given(
  /^the user has no repositories in their Git provider account$/,
  async function () {
    await this.gitProviderDSL.verifyUserHasNoRepositories();
  }
);

Then(
  'the system should display a message indicating {string}',
  async function (expectedMessage: string) {
    const receivedErrorMessage =
      await this.projectDSL.getErrorMessage(expectedMessage);
    expect(receivedErrorMessage).toBe(expectedMessage);
  }
);

Given(
  /^a project named "([^"]*)" already exists$/,
  async function (projectName: string) {
    await this.projectDSL.ensureProjectExists(projectName);
  }
);

When(/^the user attempts to add project with same name$/, async function () {
  await this.gitProviderDSL.verifyUserHasRepositories();
  await this.projectDSL.tryCreateDuplicate();
});

Then(
  /^I should receive an error message indicating "([^"]*)"$/,
  async function (expectedErrorMessage) {
    const receivedErrorMessage =  await this.projectDSL.getErrorMessage(expectedErrorMessage);
    expect(receivedErrorMessage).toBe(expectedErrorMessage);
  }
);

Then(/^the project should not be created$/, async function () {
  await this.projectDSL.expectNotCreated();
});

Given(/^the external GitHub API is not responding$/, async function () {
  await this.gitProviderDSL.simulateApiDown();
});

Given(/^navigates to project dashboard$/, async function () {
  await this.projectDSL.navigateToAuthAndLogin();
});

When(/^the user attempts to add project$/, async function () {
  await this.projectDSL.navigateToAuthAndLogin();
});

Then(
  /^the system should display an error message "([^"]*)"$/,
  async function (expectedErrorMessage: string) {
    const receivedErrorMessage =  await this.projectDSL.getErrorMessage(expectedErrorMessage);
    expect(receivedErrorMessage).toBe(expectedErrorMessage);
  }
);
When(/^attempt to add project$/, async function () {
  await this.projectDSL.attemptToAddProject();
});
Given(/^navigates to project$/, async function () {
  await this.projectDSL.navigateToProject();
});
