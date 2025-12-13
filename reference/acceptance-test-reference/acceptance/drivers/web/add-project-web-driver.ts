import { AddProjectDriver } from '@acceptance/drivers/interface/add-project-driver.interface';
import { StubService } from '@acceptance/drivers/web/services/stub.service';
import { UserService } from '@acceptance/drivers/web/services/user.service';
import { AddProjectPage } from '@acceptance/drivers/web/pages/add-project.page';
import { PageFactory } from '@acceptance/drivers/web/pages/page.factory';
import { Page } from '@playwright/test';
import { CONFIG } from '@config/test.config';
import { REPO_NAME_USER_SERVICE } from '@acceptance/dsl/models/repository.fixture';

export class AddProjectWebDriver implements AddProjectDriver {
  private readonly addProjectPage: AddProjectPage;

  constructor(
    private readonly page: Page,
    private readonly userService: UserService,
    private readonly stubService: StubService
  ) {
    this.addProjectPage = PageFactory.createAddProjectPage(page);
    this.userService = userService;
    this.stubService = stubService;
  }

  async verifyUserHasNoProjects(): Promise<void> {
    try {
      const token = this.userService.getToken();

      const response = await this.page.request.get(`${CONFIG.apiUrl}/project`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status() !== 200) {
        throw new Error(
          `Failed to get projects. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/projects`
        );
      }

      const projects = await response.json();

      if (projects.projects.length !== 0) {
        throw new Error(
          `Expected user to have no projects, but found ${projects.length} projects`
        );
      }
    } catch (error) {
      throw new Error(`Failed to verify user has no projects: ${error}`);
    }
  }

  async navigateToAuthAndLogin(): Promise<void> {
    await this.addProjectPage.navigateToAuth();
    await this.addProjectPage.clickContinueWithGitHub();
    await this.addProjectPage.waitForDashboard();
  }

  async selectRepository(repositoryName: string) {
    try {
      await this.stubService.simulateGitHubRepositoryListSuccess();

      await this.addProjectPage.selectRepositoryByName(repositoryName);
    } catch (error) {
      throw new Error(
        `Failed to select repository ${repositoryName}: ${error}`
      );
    }
  }

  async createProject(projectName: string, description: string) {
    try {
      await this.addProjectPage.fillProjectName(projectName);
      await this.addProjectPage.fillProjectDescription(description);

      const [response] = await Promise.all([
        this.addProjectPage.captureNetworkResponse('project'),
        await this.addProjectPage.submitCreateProjectButton(),
      ]);

      if (response.id) {
        this.userService.trackCreatedProjectId(response.id);
      }
    } catch (error) {
      throw new Error(`Failed to create project ${projectName}: ${error}`);
    }
  }

  async fillAndSubmitProjectForm(
    projectName: string,
    description: string
  ): Promise<void> {
    try {
      await this.addProjectPage.fillProjectName(projectName);
      await this.addProjectPage.fillProjectDescription(description);
      await this.addProjectPage.submitCreateProjectButton();
    } catch (error) {
      throw new Error(
        `Failed to fill and submit project form for ${projectName}: ${error}`
      );
    }
  }

  async verifyProjectCreatedSuccessfully(): Promise<void> {
    try {
      const token = this.userService.getToken();

      const response = await this.page.request.get(`${CONFIG.apiUrl}/project`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status() !== 200) {
        throw new Error(`Failed to get projects. Status: ${response.status()}`);
      }

      const projects = await response.json();

      if (projects.projects.length === 0) {
        throw new Error(
          'Expected project to be created, but found no projects'
        );
      }
    } catch (error) {
      throw new Error(`Failed to verify project creation: ${error}`);
    }
  }

  async verifyUserCanSeeProject(projectName: string): Promise<void> {
    try {
      await this.addProjectPage.verifyProjectVisibleInDashboard(projectName);
    } catch (error) {
      throw new Error(`Failed to verify user can see project: ${error}`);
    }
  }

  async attemptToCreateProject(
    repository: string,
    projectName: string,
    description: string
  ): Promise<void> {
    if (repository) {
      await this.selectRepository(repository);
    }
    await this.fillAndSubmitProjectForm(projectName, description);
  }

  async setupExistingProject(projectName: string): Promise<void> {
    try {
      const token = this.userService.getToken();

      const response = await this.page.request.post(
        `${CONFIG.apiUrl}/project`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            repoId: 1,
            repoName: 'existing-test-repo',
            name: projectName,
          },
        }
      );

      if (response.status() !== 201) {
        const responseBody = await response.text();
        throw new Error(
          `Failed to setup existing project. Status: ${response.status()}, Response: ${responseBody}`
        );
      }

      const responseData = await response.json();
      if (responseData.id) {
        this.userService.trackCreatedProjectId(responseData.id);
      }
    } catch (error) {
      throw new Error(
        `Failed to setup existing project "${projectName}": ${error}`
      );
    }
  }

  async attemptToCreateDuplicateProject(): Promise<void> {
    try {
      await this.addProjectPage.clickAddProjectButton();

      await this.addProjectPage.selectRepositoryByName(REPO_NAME_USER_SERVICE);

      await this.addProjectPage.fillProjectName('Existing_Project');
      await this.addProjectPage.fillProjectDescription(
        'Attempt to create duplicate'
      );

      await this.addProjectPage.submitCreateProjectButton();
    } catch (error) {
      throw new Error(`Failed to attempt duplicate project creation: ${error}`);
    }
  }

  async verifyProjectNotCreated(): Promise<void> {
    try {
      const token = this.userService.getToken();

      const response = await this.page.request.get(`${CONFIG.apiUrl}/project`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status() !== 200) {
        throw new Error(
          `Failed to get projects. Status: ${response.status()}, URL: ${CONFIG.apiUrl}/project`
        );
      }

      const projectsData = await response.json();

      if (projectsData.projects.length !== 1) {
        throw new Error(
          `Expected exactly 1 project (the original), but found ${projectsData.projects.length} projects: ${JSON.stringify(projectsData.projects)}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to verify project was not created: ${error}`);
    }
  }

  async getErrorMessage(message: string): Promise<string> {
    return await this.addProjectPage.getErrorMessageByText(message);
  }

  async attemptToAddProject(): Promise<void> {
    await this.addProjectPage.clickAddProjectButton();
  }

  async navigateToProject(): Promise<void> {
    await this.addProjectPage.navigateToProject();
  }
}
