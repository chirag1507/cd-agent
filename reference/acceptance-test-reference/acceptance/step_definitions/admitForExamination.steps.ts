import { Given, When, Then } from '@cucumber/cucumber';

Given('she has a project named {}', async function (projectName: string) {
  await this.projectDSL.ensureProjectExists(projectName);
});

Given(/^the examination service is available$/, async function () {
  await this.admitForExaminationDSL.admitExaminationServiceAvailable();
});

Given(/^the examination service is unavailable$/, async function () {
  await this.admitForExaminationDSL.admitExaminationServiceUnavailable();
});

When('she admits {} for examination', async function (projectName: string) {
  await this.admitForExaminationDSL.admitProjectForExamination(projectName);
});

Then('{} should be under examination', async function (projectName: string) {
  await this.admitForExaminationDSL.verifyProjectUnderExamination(projectName);
});

Given(
  'she tries to add {} for examination',
  async function (projectName: string) {
    await this.admitForExaminationDSL.createSecondTabAndAdmitInFirstTab(
      projectName
    );
  }
);

When('she again try to add that under examination project', async function () {
  await this.admitForExaminationDSL.attemptToAdmitInSecondTab();
});

Then('she should see notification {}', async function (message: string) {
  await this.admitForExaminationDSL.verifyNotification(message);
});
