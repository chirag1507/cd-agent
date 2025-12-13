import { Given, When, Then } from '@cucumber/cucumber';

Given('Tech Lead Talia is registered', async function () {
  if (!this.gitProviderDSL && !this.authDSL) {
    throw new Error('DSL not initialized');
  }
  await this.authDSL.ensureAuthenticatedSession();
});

Given('she is on the Git Provider Connect page', async function () {
  if (!this.gitProviderDSL) {
    throw new Error('DSL not initialized');
  }
  await this.gitProviderDSL.navigateToGitProviderConnectPage();
});

When("she connects her team's {word} account", async function (gitProvider) {
  if (!this.gitProviderDSL) {
    throw new Error('DSL not initialized');
  }
  await this.gitProviderDSL.connect(gitProvider);
});

When(
  "she attempts to connect her team's {word} account but authorization fails",
  async function (gitProvider) {
    if (!this.gitProviderDSL) {
      throw new Error('DSL not initialized');
    }
    await this.gitProviderDSL.connectWithFailure(gitProvider);
  }
);

Then(
  'her Git provider connection should be established successfully',
  async function () {
    if (!this.gitProviderDSL) {
      throw new Error('DSL not initialized');
    }
    await this.gitProviderDSL.expectConnected();
  }
);

Then(
  'her Git provider connection should not be established successfully',
  async function () {
    if (!this.gitProviderDSL) {
      throw new Error('DSL not initialized');
    }
    await this.gitProviderDSL.expectNotConnected();
  }
);
