import { Page } from '@playwright/test';
import { PageFactory } from './pages/page.factory';
import { SignupPage } from './pages/signup.page';
import { AuthDriver } from '@acceptance/drivers/interface/auth-driver.interface';
import { StubService } from './services/stub.service';
import { UserService } from '@acceptance/drivers/web/services/user.service';
import { RegistrationDetailsBuilder } from '@acceptance/drivers/web/pages/builder/registration-details.builder';
import { DashboardPage } from '@acceptance/drivers/web/pages/dashboard.page';

export class AuthWebDriver implements AuthDriver {
  private readonly signUpPage: SignupPage;
  private readonly dashboardPage: DashboardPage;

  constructor(
    private readonly page: Page,
    private readonly stubService: StubService,
    private readonly userService: UserService
  ) {
    this.signUpPage = PageFactory.createSignupPage(page);
    this.dashboardPage = PageFactory.DashboardPage(page);
    this.stubService = stubService;
    this.userService = userService;
  }

  async isSystemAvailable(): Promise<boolean> {
    return this.signUpPage.navigateToAuthPage();
  }

  async authenticate(email: string): Promise<boolean> {
    await this.stubService.simulateGitHubAuthProviderSuccess(email);
    return await this.signUpPage.authenticateWithGitHub();
  }

  async gitHubAuthenticationFailed(): Promise<void> {
    await this.stubService.simulateGitHubAuthProviderFailure();
    await this.signUpPage.continueWithGitHub();
  }

  async verifyIsAuthenticationFails(): Promise<boolean> {
    return await this.signUpPage.verifyIsAuthenticationFails();
  }

  async signInUsingGitProvider(): Promise<void> {
    await this.signUpPage.continueWithGitHub();
  }

  async isOnDashboard(): Promise<boolean> {
    return this.dashboardPage.isUserOnDashboard();
  }

  async isOnAuth(): Promise<boolean> {
    return this.signUpPage.isUserOnAuthPage();
  }

  async ensureAuthenticatedSession(): Promise<void> {
    const details = RegistrationDetailsBuilder.aRegistration()
      .withEmail(`test.session+${Date.now()}@example.com`)
      .build();
    await this.userService.registerAndTrackUser(details);
  }

  async performLogout(): Promise<void> {
    await this.dashboardPage.navigateToDashboardPage();
    await this.dashboardPage.isUserOnDashboard();
    await this.dashboardPage.performLogout();
  }

  async navigateToDashboard(): Promise<void> {
    await this.dashboardPage.navigateToDashboardPage();
  }
}
