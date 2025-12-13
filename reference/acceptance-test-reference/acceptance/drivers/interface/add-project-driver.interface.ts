export interface AddProjectDriver {
  verifyUserHasNoProjects(): Promise<void>;
  navigateToAuthAndLogin(): Promise<void>;
  selectRepository(repositoryName: string): Promise<void>;
  createProject(projectName: string, description: string): Promise<void>;
  verifyProjectCreatedSuccessfully(): Promise<void>;
  verifyUserCanSeeProject(projectName: string): Promise<void>;
  setupExistingProject(projectName: string): Promise<void>;
  attemptToCreateDuplicateProject(): Promise<void>;
  verifyProjectNotCreated(): Promise<void>;
  attemptToCreateProject(
    repository: string,
    projectName: string,
    description: string
  ): Promise<void>;
  getErrorMessage(message: string): Promise<string>;
  attemptToAddProject(): Promise<void>;
  navigateToProject(): Promise<void>;
}
