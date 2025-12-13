import { Page } from '@playwright/test';
import { CONFIG } from '@/config/test.config';
import { authorizeMapperFromGitProvider } from '@/utils/testMapper';
import { BasePage } from '@/shared/pages/base.page';

export class GitProviderConnectPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToGitProviderConnectPage(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}/onboarding/connect-git-provider`);
    await this.waitForPageLoad();
    if (!this.page.url().includes('/onboarding/connect-git-provider')) {
      throw new Error('Failed to navigate to connect git provider');
    }
  }

  async connectToGitHub(provider: string): Promise<void> {
    const callbackPromise = this.page.waitForResponse((res) =>
      res.url().includes('/api/git-provider/oauth/callback')
    );

    await this.page
      .getByTestId(authorizeMapperFromGitProvider[provider])
      .click();

    await callbackPromise;
    await this.waitForPageLoad();
  }
}
