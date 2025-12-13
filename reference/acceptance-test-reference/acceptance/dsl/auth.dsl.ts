import { AuthDriver } from '../drivers/interface/auth-driver.interface';

export class AuthDSL {
  constructor(private readonly driver: AuthDriver) {}

  async verifySystemIsAvailable(): Promise<void> {
    const isAvailable = await this.driver.isSystemAvailable();
    if (!isAvailable) {
      throw new Error(
        'The system is not available, but it was expected to be.'
      );
    }
  }

  async authenticateWithGitHub(email: string): Promise<boolean> {
    return await this.driver.authenticate(email);
  }

  async simulateGitHubAuthFailure(): Promise<void> {
    await this.driver.gitHubAuthenticationFailed();
  }

  async expectAuthenticationFailed(): Promise<boolean> {
    return await this.driver.verifyIsAuthenticationFails();
  }

  async signInWithGitProvider(): Promise<void> {
    await this.driver.signInUsingGitProvider();
  }

  async expectSignedIn(): Promise<boolean> {
    return await this.driver.isOnDashboard();
  }

  async ensureAuthenticatedSession(): Promise<void> {
    await this.driver.ensureAuthenticatedSession();
  }

  async performLogout(): Promise<void> {
    await this.driver.performLogout();
  }

  async verifyUserOnAuth(): Promise<boolean> {
    return await this.driver.isOnAuth();
  }

  async simulateDashboardNavigation(): Promise<void> {
    await this.driver.navigateToDashboard();
  }
}
