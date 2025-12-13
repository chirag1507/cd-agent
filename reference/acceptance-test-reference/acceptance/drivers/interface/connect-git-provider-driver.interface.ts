export interface ConnectGitProviderDriver {
  connectGitProvider(provider: string): Promise<void>;
  connectGitProviderWithFailure(provider: string): Promise<void>;
  verifyConnectionStatus(): Promise<boolean>;
  navigateToGitProviderConnectPage(): Promise<void>;
  verifyUserHasRepositories(): Promise<void>;
  verifyUserHasNoRepositories(): Promise<void>;
  configureGitHubAPINotResponding(): Promise<void>;
  verifyNoRepositoriesMessage(expectedMessage: string): Promise<void>;
  ensureConnected(): Promise<void>;
}
