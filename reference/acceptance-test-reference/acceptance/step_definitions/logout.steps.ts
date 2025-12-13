import { Given, Then, When } from '@cucumber/cucumber';

When(/^the user logs out$/, async function () {
  if (!this.authDSL) {
    throw new Error('DSL not initialized');
  }

  await this.authDSL.performLogout();
});

Then(/^the user should be redirected to the signup page$/, async function () {
  await this.authDSL.verifyUserOnAuth();
});

Given(/^the user has logged out$/, async function () {
  await this.authDSL.performLogout();
});

When(/^the user attempts to access the dashboard$/, async function () {
  await this.authDSL.simulateDashboardNavigation();
});
