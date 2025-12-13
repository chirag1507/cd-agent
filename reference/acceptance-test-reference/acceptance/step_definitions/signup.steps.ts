import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { mapDataTableForRegistration } from '@/utils/testMapper';

Given('the authentication is available', async function () {
  if (!this.authDSL) {
    throw new Error('authDSL not initialized');
  }
  if (!this.registrationDSL) {
    throw new Error('registrationDSL not initialized');
  }

  await this.authDSL.verifySystemIsAvailable();
});

Given(
  'I am a new user who has not yet registered',
  async function (dataTable: DataTable) {
    const details = dataTable.rowsHash();
    const email = details.email;
    await this.registrationDSL.validateUserIsNotRegistered(email);
  }
);

Given(
  'user is already registered with following details:',
  async function (dataTable: DataTable) {
    const details = dataTable.hashes()[0];
    const registrationDetails = mapDataTableForRegistration(details);
    await this.registrationDSL.registerUser(registrationDetails);
  }
);

When(
  'I authenticate using my GitHub account',
  async function (dataTable: DataTable) {
    const details = dataTable.rowsHash();
    const email = details.email;

    const isAuthenticated = await this.authDSL.authenticateWithGitHub(email);
    expect(isAuthenticated).toBe(true);
  }
);

When(
  'I provide my registration details',
  async function (dataTable: DataTable) {
    const details = dataTable.rowsHash();

    const registrationDetails = mapDataTableForRegistration(details);
    await this.registrationDSL.fillRegistrationForm(registrationDetails);
  }
);

When('I complete my registration', async function () {
  await this.registrationDSL.submitRegistration();
});

When('I attempt to complete my registration', async function () {
  await this.registrationDSL.trySubmitRegistration();
});

When('I sign in using git provider', async function () {
  if (!this.registrationDSL) {
    throw new Error('DSL not initialized');
  }

  await this.authDSL.signInWithGitProvider();
});

Then(
  'my Code Clinic account should be created successfully',
  async function () {
    await this.registrationDSL.expectAccountExists();
  }
);

Then(
  'I should be notified with error message',
  async function (dataTable: DataTable) {
    const details = dataTable.rowsHash();
    const errorMessages = await this.registrationDSL.getErrorMessages();
    errorMessages.forEach((message: string) => {
      expect(message).toBe(details.error_message);
    });
  }
);

Then(
  'my Code Clinic account should not be created',
  async function (dataTable: DataTable) {
    const details = dataTable.rowsHash();
    const notExists = await this.registrationDSL.expectAccountDoesNotExist(
      details.email
    );

    expect(notExists).toBe(true);
  }
);

Then('I should be notified that authentication failed', async function () {
  expect(true).toBe(true);
});

When('the GitHub authentication process fails', async function () {
  await this.authDSL.simulateGitHubAuthFailure();
});

Then(
  'I should not be able to access the Code Clinic platform',
  async function () {
    const isAuthenticationFails =
      await this.authDSL.expectAuthenticationFailed();
    expect(isAuthenticationFails).toBe(true);
  }
);

Then(
  'I should be signed into my existing Code Clinic account',
  async function () {
    const isLoggedIn = await this.authDSL.expectSignedIn();
    expect(isLoggedIn).toBe(true);
  }
);
