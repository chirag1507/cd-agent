import { expect, Page } from '@playwright/test';
import { CONFIG } from '@config/test.config';
import { BasePage } from '@shared/pages/base.page';

export class AddProjectPage extends BasePage {
  constructor(readonly page: Page) {
    super(page);
  }

  async navigateToAuth(): Promise<boolean> {
    const isAvailable = await this.page.goto(`${CONFIG.baseUrl}/auth`);
    expect(isAvailable?.ok()).toBe(true);
    return isAvailable?.ok() ?? false;
  }

  async clickContinueWithGitHub(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'github Continue with GitHub' })
      .click();
    await this.page.waitForURL(/\/(onboarding\/register|dashboard)/);
  }

  async waitForDashboard(): Promise<boolean> {
    await this.page.waitForURL(/\/dashboard/);
    return true;
  }

  async selectRepositoryByName(repositoryName: string): Promise<void> {
    await this.page
      .locator('div')
      .filter({ hasText: new RegExp(`^${repositoryName}$`) })
      .first()
      .click();
    await expect(
      this.page.getByRole('button', { name: 'Add Project' })
    ).toBeEnabled();
  }

  async fillProjectName(projectName: string): Promise<void> {
    await this.page.fill('[data-testid="project-name-input"]', projectName);
  }

  async fillProjectDescription(description: string): Promise<void> {
    await this.page.getByTestId('project-description-input').fill(description);
  }

  async submitCreateProjectButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Project' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyProjectVisibleInDashboard(projectName: string): Promise<void> {
    const projectCard = await this.page.waitForSelector(
      `[data-testid="project-card-${projectName}"]`
    );
    expect(projectCard).not.toBeNull();
  }

  async getErrorMessageByText(message: string): Promise<string> {
    return await this.findTextByTestId(message);
  }

  async clickAddProjectButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Project' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProject(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}/onboarding/add-project`);
  }
}
