import { BasePage } from '@shared/pages/base.page';
import { Page } from '@playwright/test';
import { CONFIG } from '@config/test.config';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isUserOnDashboard(): Promise<boolean> {
    await this.page.waitForURL(/\/dashboard/);
    return true;
  }

  async performLogout(): Promise<void> {
    await this.page.getByTestId('profile-menu').click();
    await this.page.getByTestId('logout-button').click();
    await this.page.waitForURL(/\/auth/);
  }

  async navigateToDashboardPage(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}/dashboard`);
  }
}
