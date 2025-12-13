import { Page, expect } from '@playwright/test';
import { CONFIG } from '@config/test.config';
import { BasePage } from '@shared/pages/base.page';

export class AdmitForExaminationPage extends BasePage {
  constructor(readonly page: Page) {
    super(page);
  }

  async findProjectByName(projectName: string): Promise<void> {
    const projectElement = this.page.getByText(`${projectName}`);
    await expect(projectElement).toBeVisible();
  }

  async clickAdmitForExaminationButton(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Admit for Examination' })
      .click();
    await this.page.waitForTimeout(CONFIG.navigationTimeout);
  }

  async verifyProjectStatusInProgress(projectName: string): Promise<void> {
    await this.waitForPageLoad();

    const statusBadge = this.page.getByText('In Progress');
    await expect(statusBadge).toBeVisible();
  }

  async admitProjectForExamination(projectName: string): Promise<void> {
    await this.findProjectByName(projectName);
    await this.clickAdmitForExaminationButton();
  }
}
