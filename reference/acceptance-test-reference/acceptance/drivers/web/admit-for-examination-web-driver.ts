import { AdmitForExaminationDriver } from '@acceptance/drivers/interface/admit-for-examination-driver.interface';
import { PageFactory } from '@acceptance/drivers/web/pages/page.factory';
import { Page } from '@playwright/test';
import { UserService } from '@acceptance/drivers/web/services/user.service';
import { AdmitForExaminationPage } from '@acceptance/drivers/web/pages/admit-for-examination.page';
import { CONFIG } from '@config/test.config';
import { StubService } from '@acceptance/drivers/web/services/stub.service';

export class AdmitForExaminationWebDriver implements AdmitForExaminationDriver {
  private readonly admitForExaminationPage: AdmitForExaminationPage;
  private readonly userService: UserService;
  private secondTab?: Page;

  constructor(
    private readonly page: Page,
    private readonly sharedUserService: UserService,
    private readonly stubService: StubService
  ) {
    this.admitForExaminationPage =
      PageFactory.createAdmitForExaminationPage(page);
    this.userService = sharedUserService;
    this.stubService = stubService;
  }

  async acceptAdmitExaminationStub(): Promise<void> {
    await this.stubService.simulateAdmitExaminationAccept();
  }

  async rejectAdmitExaminationStub(): Promise<void> {
    await this.stubService.simulateAdmitExaminationReject();
  }

  async admitProjectForExamination(projectName: string): Promise<void> {
    try {
      await this.admitForExaminationPage.admitProjectForExamination(
        projectName
      );
    } catch (error) {
      throw new Error(
        `Failed to admit project "${projectName}" for examination: ${error}`
      );
    }
  }

  async verifyProjectUnderExamination(projectName: string): Promise<void> {
    try {
      await this.admitForExaminationPage.verifyProjectStatusInProgress(
        projectName
      );
    } catch (error) {
      throw new Error(
        `Failed to verify project "${projectName}" is under examination: ${error}`
      );
    }
  }

  async createSecondTabAndAdmitInFirstTab(projectName: string): Promise<void> {
    try {
      const context = this.page.context();
      this.secondTab = await context.newPage();
      const secondTabAdmitPage = PageFactory.createAdmitForExaminationPage(
        this.secondTab as Page
      );

      await this.secondTab.goto(`${CONFIG.baseUrl}/dashboard`);
      await this.secondTab.waitForLoadState('networkidle');

      await secondTabAdmitPage.admitProjectForExamination(projectName);
    } catch (error) {
      throw new Error(
        `Failed to create second tab and admit in first tab: ${error}`
      );
    }
  }

  async attemptToAdmitInSecondTab(): Promise<void> {
    try {
      if (this.secondTab) {
        await this.admitForExaminationPage.clickAdmitForExaminationButton();
      }
    } catch (error) {
      throw new Error(`Failed to attempt admit in second tab: ${error}`);
    }
  }

  async verifyNotification(message: string): Promise<void> {
    try {
      await this.page
        .locator('[data-sonner-toast]')
        .filter({ hasText: message })
        .isVisible();
    } catch (error) {
      throw new Error(`Failed to verify notification - ${message} : ${error}`);
    }
  }
}
