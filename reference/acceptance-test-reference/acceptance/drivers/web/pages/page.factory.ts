import { Page } from '@playwright/test';
import { SignupPage } from './signup.page';
import { GitProviderConnectPage } from './git-provider-connect.page';
import { AddProjectPage } from '@acceptance/drivers/web/pages/add-project.page';
import { AdmitForExaminationPage } from '@acceptance/drivers/web/pages/admit-for-examination.page';
import { DashboardPage } from '@acceptance/drivers/web/pages/dashboard.page';

export class PageFactory {
  static createSignupPage(page: Page): SignupPage {
    return new SignupPage(page);
  }

  static createGitProviderConnectPage(page: Page): GitProviderConnectPage {
    return new GitProviderConnectPage(page);
  }

  static createAddProjectPage(page: Page): AddProjectPage {
    return new AddProjectPage(page);
  }

  static createAdmitForExaminationPage(page: Page): AdmitForExaminationPage {
    return new AdmitForExaminationPage(page);
  }

  static DashboardPage(page: Page): DashboardPage {
    return new DashboardPage(page);
  }
}
