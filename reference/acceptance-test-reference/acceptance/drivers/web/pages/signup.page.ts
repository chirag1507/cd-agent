import { expect, Page } from '@playwright/test';
import { RegistrationDetails } from '@/acceptance/dsl/models/registration-details.model';
import { CONFIG } from '@/config/test.config';
import { BasePage } from '@/shared/pages/base.page';
// import { Logger } from '@/acceptance/support/logger';

export class SignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isUserOnAuthPage(): Promise<boolean> {
    await this.page.waitForURL(/\/auth/);
    return true;
  }

  async navigateToAuthPage(): Promise<boolean> {
    const isAvailable = await this.page.goto(`${CONFIG.baseUrl}/auth`);
    expect(isAvailable?.ok()).toBe(true);
    return isAvailable?.ok() ?? false;
  }

  async authenticateWithGitHub(): Promise<boolean> {
    await this.continueWithGitHub();
    await this.page.waitForURL(/\/onboarding\/register/);
    return true;
  }

  async continueWithGitHub(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'github Continue with GitHub' })
      .click();

    await this.waitForPageLoad();

    // const githubButton = this.page.getByRole('button', {
    //   name: 'github Continue with GitHub',
    // });

    // // Logger.getInstance().info(
    // //   '[SignupPage] Waiting for GitHub button to be visible...'
    // // );
    // await githubButton.waitFor({
    //   state: 'visible',
    //   timeout: CONFIG.stateUpdateTimeout,
    // });
    // await expect(githubButton).toBeEnabled();

    // // Logger.getInstance().info('[SignupPage] Clicking GitHub button');
    // await githubButton.click();

    // // Logger.getInstance().info(
    // //   '[SignupPage] Clicked GitHub button, awaiting URL change upstream...'
    // // );
  }

  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.page.getByTestId('firstName-input').fill(details.firstName);
    await this.page.getByTestId('lastName-input').fill(details.lastName);
    await this.page.getByTestId('companyName-input').fill(details.companyName);

    if (details.companyRole) {
      await this.page.getByTestId('companyRole-select').click();
      await this.page
        .getByRole('option', { name: details.companyRole })
        .click();
    }

    if (details.teamSize) {
      await this.page.getByTestId('teamSize-select').click();
      await this.page.getByRole('option', { name: details.teamSize }).click();
    }
  }

  async executeRegistration(): Promise<string> {
    const [responseData] = await Promise.all([
      this.captureNetworkResponse('register'),
      await this.page.getByTestId('submit-button').click(),
    ]);
    await this.waitForPageLoad();
    return responseData.token;
  }

  async isUserOnRegisterPage(): Promise<boolean> {
    await this.page.waitForURL(/\/onboarding\/register/);
    return true;
  }

  async getErrorMessage(): Promise<string[]> {
    const errorTestIds = [
      'firstName-error',
      'lastName-error',
      'email-error',
      'companyName-error',
      'companyRole-error',
      'teamSize-error',
    ];

    const errorMessages = await Promise.all(
      errorTestIds.map(async (testId) => {
        try {
          const element = this.page.getByTestId(testId);
          await element.waitFor({
            state: 'visible',
            timeout: CONFIG.stateUpdateTimeout,
          });
          const text = await element.textContent();
          return text;
        } catch {
          return null;
        }
      })
    );

    return errorMessages.filter(
      (message): message is string => message !== null && message.trim() !== ''
    );
  }

  async verifyIsAuthenticationFails(): Promise<boolean> {
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/auth')) {
      throw new Error(
        `Expected to be on AUTH PAGE, but current URL is: ${currentUrl}`
      );
    }
    return true;
  }
}
