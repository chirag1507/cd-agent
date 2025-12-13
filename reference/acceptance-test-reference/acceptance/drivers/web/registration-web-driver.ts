import { Page } from '@playwright/test';
import { PageFactory } from './pages/page.factory';
import { SignupPage } from './pages/signup.page';
import { RegistrationDriver } from '@acceptance/drivers/interface/registration-driver.interface';
import { RegistrationDetails } from '@/acceptance/dsl/models/registration-details.model';
import { CONFIG } from '@/config/test.config';
import { StubService } from './services/stub.service';
import { UserService } from '@acceptance/drivers/web/services/user.service';

export class RegistrationWebDriver implements RegistrationDriver {
  private readonly signUpPage: SignupPage;

  constructor(
    private readonly page: Page,
    private userService: UserService,
    private readonly stubService: StubService
  ) {
    this.signUpPage = PageFactory.createSignupPage(page);
    this.userService = userService;
    this.stubService = stubService;
  }

  async validateUserIsNotRegistered(email: string): Promise<void> {
    const response = await this.page.request.get(
      `${CONFIG.apiUrl}/users/${email}`
    );

    if (response.status() !== 404) {
      throw new Error(`User already exists`);
    }
  }

  async provideRegistrationDetails(
    details: RegistrationDetails
  ): Promise<void> {
    await this.signUpPage.fillRegistrationForm(details);
  }

  async completeRegistration(): Promise<void> {
    const token = await this.signUpPage.executeRegistration();
    this.userService.setToken(token);
  }

  async attemptRegistration(): Promise<void> {
    await this.page.getByTestId('submit-button').click();
  }

  async getErrorMessages(): Promise<string[]> {
    return await this.signUpPage.getErrorMessage();
  }

  async verifyAccountExists(): Promise<boolean> {
    const token = this.userService.getToken();
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status() !== 200) {
      throw new Error(
        `Failed to verify account existence. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/users`
      );
    }
    return true;
  }

  async checkAccountDoesNotExist(email: string): Promise<boolean> {
    return await this.signUpPage.isUserOnRegisterPage();
  }

  async createTestUser(details: RegistrationDetails): Promise<void> {
    await this.stubService.simulateGitHubAuthProviderSuccess(details.email);
    await this.userService.registerAndTrackUser(details);
  }
}
