import { AddProjectDriver } from '@acceptance/drivers/interface/add-project-driver.interface';

export class ProjectDSL {
  constructor(private readonly driver: AddProjectDriver) {}

  async expectNoProjects(): Promise<void> {
    await this.driver.verifyUserHasNoProjects();
  }

  async selectRepository(repositoryName: string): Promise<void> {
    await this.driver.selectRepository(repositoryName);
  }

  async create(projectName: string, description: string): Promise<void> {
    await this.driver.createProject(projectName, description);
  }

  async expectCreated(): Promise<void> {
    await this.driver.verifyProjectCreatedSuccessfully();
  }

  async expectVisible(projectName: string): Promise<void> {
    await this.driver.verifyUserCanSeeProject(projectName);
  }

  async tryCreate(
    repository: string,
    projectName: string,
    description: string
  ): Promise<void> {
    await this.driver.attemptToCreateProject(
      repository,
      projectName,
      description
    );
  }

  async getErrorMessage(message: string): Promise<string> {
    return this.driver.getErrorMessage(message);
  }

  async ensureProjectExists(projectName: string): Promise<void> {
    await this.driver.setupExistingProject(projectName);
  }

  async tryCreateDuplicate(): Promise<void> {
    await this.driver.attemptToCreateDuplicateProject();
  }

  async expectNotCreated(): Promise<void> {
    await this.driver.verifyProjectNotCreated();
  }

  async navigateToAuthAndLogin(): Promise<void> {
    await this.driver.navigateToAuthAndLogin();
  }

  async attemptToAddProject(): Promise<void> {
    await this.driver.attemptToAddProject();
  }

  async navigateToProject(): Promise<void> {
    await this.driver.navigateToProject();
  }
}
