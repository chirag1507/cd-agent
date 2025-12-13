import { ConnectGitProviderDriver } from '../drivers/interface/connect-git-provider-driver.interface';

export class GitProviderDSL {
  constructor(private readonly driver: ConnectGitProviderDriver) {}

  async navigateToGitProviderConnectPage(): Promise<void> {
    await this.driver.navigateToGitProviderConnectPage();
  }

  async connect(provider: string): Promise<void> {
    await this.driver.connectGitProvider(provider);
  }

  async connectWithFailure(provider: string): Promise<void> {
    await this.driver.connectGitProviderWithFailure(provider);
  }

  async expectConnected(): Promise<void> {
    const isConnected = await this.driver.verifyConnectionStatus();
    if (!isConnected) {
      throw new Error(
        'Git provider connection was not established successfully, but it was expected to be.'
      );
    }
  }

  async expectNotConnected(): Promise<void> {
    const isConnected = await this.driver.verifyConnectionStatus();
    if (isConnected) {
      throw new Error(
        'Git provider connection was established, but it was expected to not be established.'
      );
    }
  }

  async verifyUserHasRepositories(): Promise<void> {
    await this.driver.verifyUserHasRepositories();
  }

  async verifyUserHasNoRepositories(): Promise<void> {
    await this.driver.verifyUserHasNoRepositories();
  }

  async simulateApiDown(): Promise<void> {
    await this.driver.configureGitHubAPINotResponding();
  }

  async expectNoRepositoriesMessage(expectedMessage: string): Promise<void> {
    await this.driver.verifyNoRepositoriesMessage(expectedMessage);
  }

  async ensureConnected(): Promise<void> {
    const connected = await this.driver.verifyConnectionStatus();
    if (!connected) {
      await this.driver.ensureConnected();
      const recheck = await this.driver.verifyConnectionStatus();
      if (!recheck) {
        throw new Error(
          'Expected Git provider connection to be established, but it is not.'
        );
      }
    }
  }
}
