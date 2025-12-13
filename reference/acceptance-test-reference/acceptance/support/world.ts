import {
  setWorldConstructor,
  World,
  IWorldOptions,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { RegistrationDSL } from '@acceptance/dsl/registration.dsl';
import { AuthDSL } from '@acceptance/dsl/auth.dsl';
import { validateFeatureTags } from '@/types/feature.validator';
import { parseTag } from '@/types/test.types';
import { AuthWebDriver } from '../drivers/web/auth-web-driver';
import { RegistrationWebDriver } from '../drivers/web/registration-web-driver';
import { GitProviderDSL } from '../dsl/git-provider.dsl';
import { ConnectGitProviderWebDriver } from '../drivers/web/connect-git-provider-web-driver';
import { ProjectDSL } from '@acceptance/dsl/project.dsl';
import { AddProjectWebDriver } from '@acceptance/drivers/web/add-project-web-driver';
import { Logger } from '@/acceptance/support/logger';
import { AdmitForExaminationDSL } from '@acceptance/dsl/admitForExamination.dsl';
import { AdmitForExaminationWebDriver } from '@acceptance/drivers/web/admit-for-examination-web-driver';
import { UserService } from '@acceptance/drivers/web/services/user.service';
import { StubService } from '@acceptance/drivers/web/services/stub.service';

export interface CodeClinicWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export class CustomWorld extends World implements CodeClinicWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  registrationDSL!: RegistrationDSL;
  authDSL!: AuthDSL;
  gitProviderDSL!: GitProviderDSL;
  projectDSL!: ProjectDSL;
  admitForExaminationDSL!: AdmitForExaminationDSL;
  scenario?: ITestCaseHookParameter;

  private sharedUserService?: UserService;
  private sharedStubService?: StubService;

  constructor(options: IWorldOptions) {
    super(options);
  }
  async init(): Promise<void> {
    const tags =
      this.scenario?.pickle.tags.map((tag: { name: string }) => tag.name) || [];

    try {
      validateFeatureTags(tags);
    } catch (error) {
      // Invalid tags in feature file
      throw error;
    }

    const testTags = tags
      .map(parseTag)
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null);
    const isUITest = testTags.some((tag) => tag.driver === 'ui');
    const isApiTest = testTags.some((tag) => tag.driver === 'api');

    if (isUITest) {
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS !== 'false',
        slowMo: process.env.HEADLESS !== 'false' ? 0 : 500,
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      this.page = await this.context.newPage();

      if (process.env.SHOW_NETWORK_LOGS === 'true') {
        const logger = Logger.getInstance();
        this.page.on('request', (request) => {
          if (isNetworkLoggable(request.url())) {
            logger.info(`[Network][REQ] ${request.method()} ${request.url()}`);
          }
        });
        this.page.on('response', async (response) => {
          const request = response.request();
          const headers = response.headers();
          const location = headers['location'];
          if (isNetworkLoggable(request.url())) {
            logger.info(
              `[Network][RES] ${response.status()} ${request.method()} ${response.url()}${
                location ? ` -> ${location}` : ''
              }`
            );
          }
        });
        this.page.on('requestfailed', (request) => {
          if (isNetworkLoggable(request.url())) {
            logger.error(
              `[Network][FAIL] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
            );
          }
        });
        this.page.on('framenavigated', (frame) => {
          if (
            frame === this.page.mainFrame() &&
            isNetworkLoggable(frame.url())
          ) {
            logger.info(`[Nav] ${frame.url()}`);
          }
        });

        function isNetworkLoggable(url: string): boolean {
          return (
            !url.includes('_next') &&
            !url.includes('/font/') &&
            !url.includes('/image/')
          );
        }
      }

      this.sharedUserService = new UserService(this.page);
      this.sharedStubService = new StubService(this.page);

      this.registrationDSL = new RegistrationDSL(
        new RegistrationWebDriver(
          this.page,
          this.sharedUserService,
          this.sharedStubService
        )
      );
      this.authDSL = new AuthDSL(
        new AuthWebDriver(
          this.page,
          this.sharedStubService,
          this.sharedUserService
        )
      );
      this.gitProviderDSL = new GitProviderDSL(
        new ConnectGitProviderWebDriver(
          this.page,
          this.sharedUserService,
          this.sharedStubService
        )
      );
      this.projectDSL = new ProjectDSL(
        new AddProjectWebDriver(
          this.page,
          this.sharedUserService,
          this.sharedStubService
        )
      );
      this.admitForExaminationDSL = new AdmitForExaminationDSL(
        new AdmitForExaminationWebDriver(
          this.page,
          this.sharedUserService,
          this.sharedStubService
        )
      );
    } else if (isApiTest) {
      // TODO: Add API driver for login when needed
    } else {
      throw new Error('Scenario must be tagged with either @ui or @api');
    }
  }

  async cleanup(): Promise<void> {
    // Clean up test data first
    await this.cleanupTestData();

    // Clean up browser resources
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async cleanupTestData(): Promise<void> {
    if (this.sharedUserService) {
      try {
        await this.sharedUserService.cleanupAllTrackedData();
      } catch {
        throw new Error('Failed to cleanup user service');
      }
    }
  }
}

setWorldConstructor(CustomWorld);
