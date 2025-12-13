import { Page } from '@playwright/test';
import { ConnectGitProviderDriver } from '@acceptance/drivers/interface/connect-git-provider-driver.interface';
import { RegistrationDetailsBuilder } from '@/acceptance/drivers/web/pages/builder/registration-details.builder';
import { StubService } from './services/stub.service';
import { UserService } from './services/user.service';
import { GitProviderConnectPage } from './pages/git-provider-connect.page';
import { PageFactory } from './pages/page.factory';
import { CONFIG } from '@/config/test.config';

export class ConnectGitProviderWebDriver implements ConnectGitProviderDriver {
  private readonly gitProviderConnectPage: GitProviderConnectPage;
  private readonly userService: UserService;

  constructor(
    private readonly page: Page,
    private readonly sharedUserService: UserService,
    private readonly stubService: StubService
  ) {
    this.gitProviderConnectPage =
      PageFactory.createGitProviderConnectPage(page);
    this.stubService = stubService;
    this.userService = sharedUserService;
  }

  async connectGitProvider(provider: string): Promise<void> {
    await this.stubService.simulateGitProviderAuthUrlSuccess();
    await this.gitProviderConnectPage.connectToGitHub(provider);
  }

  async connectGitProviderWithFailure(provider: string): Promise<void> {
    await this.stubService.simulateGitProviderAuthUrlFailure();
    await this.gitProviderConnectPage.connectToGitHub(provider);
  }

  async verifyConnectionStatus(): Promise<boolean> {
    const token = this.userService.getToken();
    if (!token) {
      throw new Error('Token not provided');
    }
    const response = await this.page.request.get(
      `${CONFIG.apiUrl}/git-provider/check-connection`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to verify connection status. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/git-provider/check-connection`
      );
    }
    const { isGitConnected } = await response.json();
    return isGitConnected;
  }

  async navigateToGitProviderConnectPage(): Promise<void> {
    await this.gitProviderConnectPage.navigateToGitProviderConnectPage();
  }

  async verifyUserHasRepositories(): Promise<void> {
    try {
      const token = this.userService.getToken();
      await this.stubService.simulateGitHubRepositoryListSuccess();
      const response = await this.page.request.get(
        `${CONFIG.apiUrl}/git-provider/user-repositories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status() !== 200) {
        throw new Error(
          `Failed to get user repositories. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/git-provider/user-repositories`
        );
      }
      const responseData = await response.json();
      if (responseData.repositories.length === 0) {
        throw new Error(
          `Expected user to have at least one repository, but found ${responseData.repositoryCount} repositories`
        );
      }
    } catch (error) {
      throw new Error(`Failed to verify user has repositories: ${error}`);
    }
  }

  async verifyUserHasNoRepositories(): Promise<void> {
    try {
      const token = this.userService.getToken();
      await this.stubService.simulateGitHubRepositoryListEmpty();
      const response = await this.page.request.get(
        `${CONFIG.apiUrl}/git-provider/user-repositories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status() !== 200) {
        throw new Error(
          `Failed to get user repositories. Status: ${response.status()}`
        );
      }
      const responseData = await response.json();
      if (responseData.repositories.length !== 0) {
        throw new Error(
          `Expected user to have no repositories, but found ${responseData.repositoryCount} repositories`
        );
      }
    } catch (error) {
      throw new Error(`Failed to verify user has no repositories: ${error}`);
    }
  }

  async configureGitHubAPINotResponding(): Promise<void> {
    try {
      await this.stubService.simulateGitHubRepositoryListFailure();
    } catch (error) {
      throw new Error(
        `Failed to configure GitHub API as not responding: ${error}`
      );
    }
  }

  async verifyNoRepositoriesMessage(expectedMessage: string): Promise<void> {
    await this.gitProviderConnectPage.waitForPageLoad();
    const message = this.page.getByText(expectedMessage);
    await message.waitFor({ state: 'visible' });
  }

  async ensureConnected(): Promise<void> {
    try {
      const token = this.userService.getToken();

      const authUrlResponse = await this.page.request.get(
        `${CONFIG.apiUrl}/git-provider/auth-url`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const callbackUrl = (await authUrlResponse.json()).url;

      await this.stubService.simulateGitProviderAuthUrlSuccess();

      const authUrlCallbackResponse = await this.page.request.get(callbackUrl, {
        maxRedirects: 0,
      });

      if (authUrlCallbackResponse.status() !== 302) {
        throw new Error(
          `Failed to get auth URL. Status: ${authUrlCallbackResponse.status()}`
        );
      }

      if (token) {
        const isConnected = await this.checkGitProviderConnection(token);

        if (!isConnected) {
          throw new Error(
            'Git provider connection was not established successfully'
          );
        }
      }
    } catch (error) {
      throw new Error(`Failed to setup Git provider connection: ${error}`);
    }
  }

  private async checkGitProviderConnection(token: string): Promise<boolean> {
    const response = await this.page.request.get(
      `${CONFIG.apiUrl}/git-provider/check-connection`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.status() !== 200) {
      throw new Error(
        `Failed to verify connection status. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/git-provider/check-connection`
      );
    }
    const { isGitConnected } = await response.json();
    return isGitConnected;
  }
}
