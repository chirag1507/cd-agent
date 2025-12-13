export interface AuthDriver {
  isSystemAvailable(): Promise<boolean>;
  authenticate(email: string): Promise<boolean>;
  gitHubAuthenticationFailed(): Promise<void>;
  verifyIsAuthenticationFails(): Promise<boolean>;
  signInUsingGitProvider(): Promise<void>;
  isOnDashboard(): Promise<boolean>;
  isOnAuth(): Promise<boolean>;
  ensureAuthenticatedSession(): Promise<void>;
  performLogout(): Promise<void>;
  navigateToDashboard(): Promise<void>;
}
